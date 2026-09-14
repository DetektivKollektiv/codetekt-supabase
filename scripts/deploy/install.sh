#!/bin/bash
# Run once as root from a reviewed checkout/bundle. Does not restart any service.
set -Eeuo pipefail
export PATH=/usr/sbin:/usr/bin:/sbin:/bin

if [[ $EUID != 0 || $# != 1 ]]; then
  echo 'Usage: sudo bash install.sh <backend-deploy-key.pub>' >&2
  exit 64
fi
source_dir=$(cd -- "$(dirname -- "$0")" && pwd)
public_key=$(<"$1")
[[ $public_key =~ ^ssh-ed25519\ [A-Za-z0-9+/=]+(\ [^$'\n']*)?$ ]] || {
  echo 'Expected one Ed25519 public key.' >&2
  exit 64
}
if id codetekt-backend-deploy &>/dev/null; then
  echo 'codetekt-backend-deploy already exists; inspect it before reinstalling.' >&2
  exit 1
fi
docker inspect supabase-db supabase-edge-functions >/dev/null
[[ -d /home/gorm/services/codetekt-supabase/volumes/functions ]]
for command in flock curl python3 tar sha256sum visudo; do command -v "$command" >/dev/null; done

useradd --system --home-dir /var/lib/codetekt-backend-deploy --shell /bin/sh codetekt-backend-deploy
install -d -o root -g root -m 755 \
  /var/lib/codetekt-backend-deploy /var/lib/codetekt-backend-deploy/.ssh
install -o root -g root -m 755 "$source_dir/backend-deploy.sh" /usr/local/sbin/codetekt-backend-deploy
install -o root -g root -m 755 "$source_dir/backend-ssh-command.sh" /usr/local/bin/codetekt-backend-deploy-ssh
install -o root -g root -m 755 "$source_dir/baseline-production.sh" /usr/local/sbin/codetekt-backend-baseline
printf 'restrict,command="/usr/local/bin/codetekt-backend-deploy-ssh" %s\n' "$public_key" \
  > /var/lib/codetekt-backend-deploy/.ssh/authorized_keys
chmod 644 /var/lib/codetekt-backend-deploy/.ssh/authorized_keys
sudoers=$(mktemp)
trap 'rm -f -- "$sudoers"' EXIT
printf 'codetekt-backend-deploy ALL=(root) NOPASSWD: /usr/local/sbin/codetekt-backend-deploy\n' > "$sudoers"
visudo -cf "$sudoers"
install -o root -g root -m 440 "$sudoers" /etc/sudoers.d/codetekt-backend-deploy
echo 'Restricted backend deploy account installed. No database or container was changed.'
