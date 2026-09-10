import datetime as dt
import io
import json
import subprocess
import unittest
from contextlib import redirect_stdout, redirect_stderr
from unittest.mock import patch, mock_open

import monitor as m


class MonitoringTests(unittest.TestCase):
    def test_backup_age_and_failed_service(self):
        now = dt.datetime(2026, 9, 10, tzinfo=dt.timezone.utc)
        service = {'Result': 'success', 'ExecMainStatus': '0'}
        for hours, expected in [(1, True), (36, True), (37, False), (-1, False)]:
            backups = [{'time': (now - dt.timedelta(hours=hours)).isoformat()}]
            self.assertEqual(m.backup_result(backups, service, now)[0], expected)
        self.assertFalse(m.backup_result([], service, now)[0])
        self.assertFalse(m.backup_result(backups, {'Result': 'exit-code'}, now)[0])

    def test_idle_wal_is_healthy_but_backlog_and_failures_are_not(self):
        state = dict(archive_mode='on', archive_command=True, archive_timeout=300,
                     archived_count=100, unresolved_failure=False, oldest_ready_seconds=0)
        self.assertTrue(m.wal_result(state)[0])
        for key, value in [('archive_mode', 'off'), ('archive_command', False),
                           ('archive_timeout', 0), ('archived_count', 0),
                           ('unresolved_failure', True), ('oldest_ready_seconds', 901)]:
            self.assertFalse(m.wal_result({**state, key: value})[0], key)

    def test_stopped_starting_and_unhealthy_containers(self):
        for status, health, expected in [('running', None, True), ('running', 'healthy', True),
                                        ('running', 'starting', False), ('running', 'unhealthy', False),
                                        ('exited', 'healthy', False)]:
            state = {'Status': status}
            if health:
                state['Health'] = {'Status': health}
            self.assertEqual(m.container_result({'State': state})[0], expected)

    def test_disk_and_inode_thresholds_on_mounted_data(self):
        for storage, inodes, expected in [(14, 2, True), (85, 2, False), (14, 85, False)]:
            with patch('builtins.open', mock_open(read_data='1 0 8:1 / / rw - ext4 /dev/a rw\n2 1 8:2 / /data rw - ext4 /dev/b rw\n')), patch.object(m, 'run', side_effect=[
                json.dumps([{'Mounts': [{'Type': 'volume', 'Source': '/data'}]}]),
                '/var/lib/docker',
                f'Filesystem Blocks Used Available Capacity Mount\n/dev/a 100 14 86 {storage}% /\n',
                f'Filesystem Inodes Used Free IUse Mount\n/dev/a 100 2 98 {inodes}% /\n',
            ]) as command:
                self.assertEqual(m.check_disk()[0], expected)
                self.assertIn('/data', command.call_args_list[2].args)

    def test_private_volume_paths_and_separate_mounts(self):
        mounts = '1 0 8:1 / / rw - ext4 /dev/a rw\n2 1 8:2 / /data rw - ext4 /dev/b rw\n'
        self.assertEqual(m.filesystem_mounts(['/var/lib/docker/volumes/private/_data', '/data/db', '/database'], mounts), ['/', '/data'])

    def test_check_failure_pushes_down_without_leaking_output(self):
        secret = 'sensitive-command-output'
        with patch.object(m, 'push') as push, redirect_stdout(io.StringIO()) as output:
            def fail():
                raise subprocess.CalledProcessError(1, ['command'], stderr=secret)
            self.assertFalse(m.execute('backup', fail, {'backup': 'url'}, False))
            self.assertFalse(push.call_args.args[1])
            self.assertNotIn(secret, output.getvalue())

    def test_push_failure_is_visible_and_check_only_never_pushes(self):
        with patch.object(m, 'push', side_effect=TimeoutError('secret-url')) as push:
            with redirect_stdout(io.StringIO()), redirect_stderr(io.StringIO()) as errors:
                self.assertFalse(m.execute('wal', lambda: (True, 'OK'), {'wal': 'url'}, False))
                self.assertNotIn('secret-url', errors.getvalue())
                self.assertTrue(m.execute('wal', lambda: (True, 'OK'), {}, True))
            self.assertEqual(push.call_count, 1)

    def test_push_destination_and_redirect_restrictions(self):
        for url in ['http://status.codetekt.org/api/push/token',
                    'https://example.org/api/push/token',
                    'https://status.codetekt.org/api/push/token?secret=x']:
            with self.assertRaises(ValueError):
                m.push(url, True, 'OK')
        self.assertIsNone(m.NoRedirect().redirect_request(None, None, 302, '', {}, 'https://example.org'))


if __name__ == '__main__':
    unittest.main()
