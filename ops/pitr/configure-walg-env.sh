#!/bin/sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
ENV_FILE="$PROJECT_DIR/.env.walg"

if [ -e "$ENV_FILE" ]; then
  echo "ERROR: $ENV_FILE already exists; refusing to overwrite it." >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "ERROR: openssl is required to validate the encryption key." >&2
  exit 1
fi

read_secret() {
  prompt=$1
  printf '%s' "$prompt" >&2
  old_stty=$(stty -g)
  trap 'stty "$old_stty"' EXIT HUP INT TERM
  stty -echo
  IFS= read -r value
  stty "$old_stty"
  trap - EXIT HUP INT TERM
  printf '\n' >&2
  printf '%s' "$value"
}

printf 'Hetzner S3 access key ID: ' >&2
IFS= read -r access_key
secret_key=$(read_secret 'Hetzner S3 secret access key: ')
libsodium_key=$(read_secret 'WAL-G libsodium key (32 random bytes, Base64): ')

if [ -z "$access_key" ] || [ -z "$secret_key" ] || [ -z "$libsodium_key" ]; then
  echo "ERROR: all three values are required." >&2
  exit 1
fi

decoded_bytes=$(printf '%s' "$libsodium_key" | openssl base64 -d -A 2>/dev/null | wc -c | tr -d ' ')
if [ "$decoded_bytes" != "32" ]; then
  echo "ERROR: the libsodium key must decode to exactly 32 bytes." >&2
  echo "Generate one with: openssl rand -base64 32" >&2
  exit 1
fi

umask 077
{
  printf '%s\n' \
    'WALG_S3_PREFIX=s3://codetekt-prod-pitr/postgres' \
    'AWS_ENDPOINT=https://fsn1.your-objectstorage.com' \
    'AWS_REGION=fsn1' \
    'AWS_S3_FORCE_PATH_STYLE=false' \
    "AWS_ACCESS_KEY_ID=$access_key" \
    "AWS_SECRET_ACCESS_KEY=$secret_key" \
    "WALG_LIBSODIUM_KEY=$libsodium_key" \
    'WALG_LIBSODIUM_KEY_TRANSFORM=base64' \
    'WALG_COMPRESSION_METHOD=zstd' \
    'WALG_UPLOAD_CONCURRENCY=4' \
    'WALG_DOWNLOAD_CONCURRENCY=4' \
    'S3_RETENTION_PERIOD=604800' \
    'S3_RETENTION_MODE=GOVERNANCE' \
    'S3_ENABLE_VERSIONING=enabled' \
    'PGHOST=/var/run/postgresql' \
    'PGUSER=postgres' \
    'PGDATABASE=postgres'
} > "$ENV_FILE"

chmod 600 "$ENV_FILE"
unset access_key secret_key libsodium_key

echo "Created $ENV_FILE with mode 600."
echo "The initial object retention is 7 days in GOVERNANCE mode."
