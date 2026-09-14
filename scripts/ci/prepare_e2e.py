#!/usr/bin/env python3
"""Create runner-only environment files from disposable local Supabase status."""

import json
import os
import pathlib
import sys

status_path = pathlib.Path(sys.argv[1])
functions_path = pathlib.Path(sys.argv[2])
status = json.loads(status_path.read_text())
public_key = status.get("PUBLISHABLE_KEY") or status.get("ANON_KEY")
secret_key = status.get("SECRET_KEY") or status.get("SERVICE_ROLE_KEY")
if not public_key or not secret_key:
    raise SystemExit("Local Supabase status did not contain API keys")

values = {
    "SUPABASE_PUBLISHABLE_KEY": public_key,
    "SUPABASE_SECRET_KEY": secret_key,
    "WEDIUM_API_KEY": "local-ci-wedium-key",
}
github_env = pathlib.Path(os.environ["GITHUB_ENV"])
with github_env.open("a") as output:
    for name, value in values.items():
        output.write(f"{name}={value}\n")

function_values = {
    "SUPABASE_PUBLISHABLE_KEYS": json.dumps({"default": public_key}),
    "SUPABASE_SECRET_KEYS": json.dumps({"default": secret_key}),
    "DB_WEBHOOK_SECRET": "super-secret-db-webhook-key-123",
    "WEDIUM_API_KEY": values["WEDIUM_API_KEY"],
    "SCALEWAY_TEM_PROJECT_ID": "unused-local-ci-project",
    "SCALEWAY_TEM_SECRET_KEY": "unused-local-ci-key",
    "SCALEWAY_TEM_FROM_EMAIL": "noreply@example.test",
    "SITE_URL": "http://127.0.0.1:3000",
    "NEW_CASE_NOTIFICATION_EMAIL": "notifications@example.test",
    "DISPUTE_NOTIFICATION_EMAIL": "notifications@example.test",
    "COMMENT_REPORT_NOTIFICATION_EMAIL": "notifications@example.test",
}
functions_path.write_text("".join(f"{name}={value}\n" for name, value in function_values.items()))
functions_path.chmod(0o600)
status_path.unlink()
print("Prepared disposable backend test environment.")
