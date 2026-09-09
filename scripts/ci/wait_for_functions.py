#!/usr/bin/env python3
import time
import urllib.error
import urllib.request

request = urllib.request.Request(
    "http://127.0.0.1:54321/functions/v1/get-review-template",
    data=b"{}",
    headers={"Content-Type": "application/json"},
)
for _ in range(60):
    try:
        urllib.request.urlopen(request, timeout=3)
    except urllib.error.HTTPError as error:
        if error.code == 401:
            raise SystemExit(0)
    except OSError:
        pass
    time.sleep(1)
raise SystemExit("Local Edge Functions did not become ready")
