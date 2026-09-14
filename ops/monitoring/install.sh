#!/bin/sh
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CONFIG=${1:?Usage: sudo sh install.sh /path/to/monitoring.json}
test "$(id -u)" -eq 0
python3 - "$CONFIG" "$SCRIPT_DIR" <<'PY'
import json, sys
sys.path.insert(0, sys.argv[2])
from monitor import CONTAINERS
from urllib.parse import urlsplit
config = json.load(open(sys.argv[1]))
assert set(config) == {'backup', 'wal', 'disk', *CONTAINERS}
assert len(set(config.values())) == len(config)
for url in config.values():
    p = urlsplit(url)
    assert p.scheme == 'https' and p.netloc == 'status.codetekt.org'
    assert p.path.startswith('/api/push/') and len(p.path.split('/')[-1]) >= 16
    assert not p.query and not p.fragment
PY
install -d -o root -g root -m 0755 /opt/codetekt-monitoring
install -o root -g root -m 0644 "$SCRIPT_DIR/monitor.py" /opt/codetekt-monitoring/monitor.py
install -o gorm -g gorm -m 0600 "$CONFIG" /etc/codetekt-monitoring.json
install -o root -g root -m 0644 "$SCRIPT_DIR/systemd/codetekt-monitoring@.service" /etc/systemd/system/
for mode in containers wal disk backup; do
    case "$mode" in
        containers) interval=60 ;;
        wal|disk) interval=300 ;;
        backup) interval=900 ;;
    esac
    cat > "/etc/systemd/system/codetekt-monitoring-$mode.timer" <<EOF
[Unit]
Description=Codetekt monitoring timer ($mode)

[Timer]
OnBootSec=30
OnUnitActiveSec=$interval
AccuracySec=5
Unit=codetekt-monitoring@$mode.service

[Install]
WantedBy=timers.target
EOF
done
systemd-analyze verify /etc/systemd/system/codetekt-monitoring@.service /etc/systemd/system/codetekt-monitoring-*.timer
systemctl daemon-reload
for mode in containers wal disk backup; do
    systemctl enable --now "codetekt-monitoring-$mode.timer"
    systemctl start "codetekt-monitoring@$mode.service"
done
systemctl list-timers 'codetekt-monitoring-*' --no-pager
