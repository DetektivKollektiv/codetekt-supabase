#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

sudo install -o root -g root -m 0644 \
  "$SCRIPT_DIR/systemd/codetekt-postgres-backup.service" \
  /etc/systemd/system/codetekt-postgres-backup.service
sudo install -o root -g root -m 0644 \
  "$SCRIPT_DIR/systemd/codetekt-postgres-backup.timer" \
  /etc/systemd/system/codetekt-postgres-backup.timer
sudo systemctl daemon-reload
sudo systemctl enable --now codetekt-postgres-backup.timer
sudo systemctl list-timers codetekt-postgres-backup.timer --no-pager
