#!/usr/bin/env python3
"""Read-only host checks with independent Uptime Kuma push heartbeats."""

import argparse
import concurrent.futures
import datetime as dt
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request

CONTAINERS = (
    "codetekt-frontend", "supabase-caddy", "supabase-auth", "supabase-pooler",
    "supabase-db", "supabase-edge-functions", "supabase-envoy", "supabase-storage",
    "realtime-dev.supabase-realtime", "supabase-meta", "supabase-rest",
    "supabase-studio", "supabase-imgproxy",
)
WAL_SQL = """
SELECT json_build_object(
  'archive_mode', current_setting('archive_mode'),
  'archive_command', current_setting('archive_command') <> '',
  'archive_timeout', extract(epoch from current_setting('archive_timeout')::interval),
  'archived_count', archived_count,
  'unresolved_failure', last_failed_time IS NOT NULL AND
      (last_archived_time IS NULL OR last_failed_time > last_archived_time),
  'oldest_ready_seconds', (SELECT COALESCE(max(extract(epoch FROM now() - modification)), 0)
      FROM pg_ls_archive_statusdir() WHERE name LIKE '%.ready')
) FROM pg_stat_archiver;
"""


def run(*args, timeout=15):
    return subprocess.run(args, check=True, capture_output=True, text=True,
                          timeout=timeout).stdout.strip()


def backup_result(backups, service, now):
    if service.get('Result') != 'success' or service.get('ExecMainStatus') != '0':
        return False, 'Backup service failed'
    if not backups:
        return False, 'No completed full backup found'
    times = [dt.datetime.fromisoformat(b['time'].replace('Z', '+00:00')) for b in backups]
    age = (now - max(times)).total_seconds()
    if age < -300 or age > 36 * 3600:
        return False, 'Full backup timestamp invalid or older than 36 hours'
    return True, f'Full backup age {age / 3600:.1f}h; timer active; service successful'


def wal_result(state):
    if (state['archive_mode'] != 'on' or not state['archive_command']
            or not 0 < float(state['archive_timeout']) <= 300
            or state['archived_count'] < 1):
        return False, 'WAL archiving configuration invalid or no archived WAL'
    if state['unresolved_failure']:
        return False, 'Unresolved WAL archive failure'
    if float(state['oldest_ready_seconds']) > 900:
        return False, 'WAL archive backlog older than 15 minutes'
    return True, 'WAL archiving active; no overdue backlog or unresolved failure'


def container_result(container):
    state = container['State']
    health = state.get('Health', {}).get('Status')
    ok = state['Status'] == 'running' and health in (None, 'healthy')
    return ok, f"Container {state['Status']}; health {health or 'not configured'}"


def inspect(name):
    return json.loads(run('docker', 'inspect', name))[0]


def check_backup():
    run('systemctl', 'is-active', 'codetekt-postgres-backup.timer')
    service = dict(line.split('=', 1) for line in run(
        'systemctl', 'show', 'codetekt-postgres-backup.service',
        '-p', 'Result', '-p', 'ExecMainStatus').splitlines())
    backups = json.loads(run('docker', 'exec', '--user', 'postgres', 'supabase-db',
                            '/usr/local/bin/wal-g', 'backup-list', '--json', timeout=60))
    return backup_result(backups, service, dt.datetime.now(dt.timezone.utc))


def check_wal():
    data = run('docker', 'exec', '--user', 'postgres', '-e', 'PGUSER=supabase_admin',
               'supabase-db', 'psql', '-d', 'postgres', '-XAt', '-v', 'ON_ERROR_STOP=1',
               '-c', WAL_SQL)
    return wal_result(json.loads(data))


def check_disk():
    containers = json.loads(run('docker', 'inspect', *CONTAINERS))
    paths = {'/', run('docker', 'info', '--format', '{{.DockerRootDir}}')}
    for container in containers:
        paths.update(m['Source'] for m in container['Mounts'] if m['Type'] in ('bind', 'volume'))
    # Resolve the enclosing mount from the kernel table, without traversing
    # private volume contents. Separate mounted data disks remain included.
    with open('/proc/self/mountinfo') as mounts:
        mountpoints = filesystem_mounts(paths, mounts.read())
    blocks = run('df', '-P', *mountpoints)
    inodes = run('df', '-Pi', *mountpoints)
    percentages = []
    for label, output in [('storage', blocks), ('inodes', inodes)]:
        for line in output.splitlines()[1:]:
            value = line.split()[4]
            if value == '-' and label == 'inodes':
                continue
            percentages.append((label, int(value.rstrip('%'))))
    if not percentages:
        return False, 'No filesystem usage data'
    worst = max(percentages, key=lambda item: item[1])
    return worst[1] < 85, f'Maximum filesystem usage: {worst[0]} {worst[1]}%'


def filesystem_mounts(paths, mountinfo):
    mounts = [re.sub(r'\\([0-7]{3})', lambda m: chr(int(m[1], 8)), line.split()[4])
              for line in mountinfo.splitlines()]
    selected = set()
    for path in paths:
        path = os.path.realpath(path)
        matches = [mount for mount in mounts if path == mount or path.startswith(mount.rstrip('/') + '/')]
        selected.add(max(matches, key=len))
    return sorted(selected)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def push(url, ok, message):
    parsed = urllib.parse.urlsplit(url)
    if (parsed.scheme != 'https' or parsed.netloc != 'status.codetekt.org'
            or not parsed.path.startswith('/api/push/') or parsed.username
            or parsed.query or parsed.fragment):
        raise ValueError('Invalid push destination')
    query = urllib.parse.urlencode({'status': 'up' if ok else 'down', 'msg': message})
    with urllib.request.build_opener(NoRedirect).open(url + '?' + query, timeout=10) as response:
        if response.status != 200 or json.load(response).get('ok') is not True:
            raise ValueError('Push not acknowledged')


def execute(name, check, urls, check_only):
    try:
        ok, message = check()
    except Exception as error:
        # Never include subprocess output, credentials or URLs in logs/heartbeats.
        ok, message = False, f'Check failed ({type(error).__name__})'
    print(f'{name}: {"UP" if ok else "DOWN"}: {message}', flush=True)
    if not check_only:
        try:
            push(urls[name], ok, message)
        except Exception as error:
            print(f'{name}: push failed ({type(error).__name__})', file=sys.stderr)
            return False
    return ok


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=['backup', 'wal', 'disk', 'containers'])
    parser.add_argument('--config', default='/etc/codetekt-monitoring.json')
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    urls = {} if args.check_only else json.loads(open(args.config).read())
    checks = {'backup': check_backup, 'wal': check_wal, 'disk': check_disk}
    selected = ({name: lambda name=name: container_result(inspect(name)) for name in CONTAINERS}
                if args.mode == 'containers' else {args.mode: checks[args.mode]})
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(lambda item: execute(*item, urls, args.check_only), selected.items()))
    return 0 if all(results) else 1


if __name__ == '__main__':
    sys.exit(main())
