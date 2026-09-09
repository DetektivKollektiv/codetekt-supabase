#!/usr/bin/env python3
"""Reject edits to existing migrations and annotate risky statements in new ones."""

from __future__ import annotations

import pathlib
import re
import subprocess
import sys

MIGRATIONS = pathlib.Path("supabase/migrations")
FILENAME = re.compile(r"^(\d{14})_([^/\r\n]+)\.sql$")
DESTRUCTIVE = re.compile(
    r"\b(?:DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE(?:\s+TABLE)?|CASCADE)\b",
    re.IGNORECASE,
)


def migration_files() -> list[pathlib.Path]:
    files = sorted(MIGRATIONS.glob("*.sql"))
    versions: set[str] = set()
    for path in files:
        match = FILENAME.fullmatch(path.name)
        if not match:
            raise ValueError(f"Invalid migration filename: {path}")
        version = match.group(1)
        if version in versions:
            raise ValueError(f"Duplicate migration version: {version}")
        versions.add(version)
    return files


def changed_migrations(base: str, head: str) -> tuple[list[pathlib.Path], list[str]]:
    if not base or set(base) == {"0"}:
        return migration_files(), []
    result = subprocess.run(
        [
            "git",
            "diff",
            "--name-status",
            "--find-renames",
            f"{base}..{head}",
            "--",
            "supabase/migrations",
        ],
        check=True,
        text=True,
        capture_output=True,
    )
    added: list[pathlib.Path] = []
    immutable_changes: list[str] = []
    for line in result.stdout.splitlines():
        fields = line.split("\t")
        status = fields[0]
        if status == "A" and len(fields) == 2:
            added.append(pathlib.Path(fields[1]))
        elif status and status[0] in {"M", "D", "R", "C", "T"}:
            immutable_changes.append(line)
    return added, immutable_changes


def warnings(paths: list[pathlib.Path]) -> list[tuple[pathlib.Path, int, str]]:
    matches: list[tuple[pathlib.Path, int, str]] = []
    for path in paths:
        for number, line in enumerate(path.read_text().splitlines(), start=1):
            match = DESTRUCTIVE.search(line)
            if match:
                matches.append((path, number, match.group(0)))
    return matches


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(f"Usage: {argv[0]} <base-sha> <head-sha>", file=sys.stderr)
        return 64
    try:
        files = migration_files()
        added, immutable_changes = changed_migrations(argv[1], argv[2])
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        print(error, file=sys.stderr)
        return 1

    if immutable_changes:
        print("Existing migration files are immutable; add a new migration instead:", file=sys.stderr)
        print("\n".join(immutable_changes), file=sys.stderr)
        return 1

    for path, line, token in warnings(added):
        print(
            f"::warning file={path},line={line},title=Potentially destructive migration::"
            f"Review {token} before merging and confirm the Production backup state."
        )
    print(f"Validated {len(files)} migration files; {len(added)} are new in this change.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
