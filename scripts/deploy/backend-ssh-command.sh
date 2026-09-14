#!/bin/sh
# The account's only SSH entry point; never evaluate SSH_ORIGINAL_COMMAND.
exec sudo -n /usr/local/sbin/codetekt-backend-deploy "${SSH_ORIGINAL_COMMAND:-}"
