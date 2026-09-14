"""Test that the forced backend command rejects arbitrary SSH commands."""

import pathlib
import subprocess
import unittest

SCRIPT = pathlib.Path(__file__).with_name("backend-deploy.sh")
BASELINE_SCRIPT = pathlib.Path(__file__).with_name("baseline-production.sh")
REVISION = "a" * 40
DIGEST = "b" * 64


class DeploymentScriptTest(unittest.TestCase):
    def run_command(self, command: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            ["bash", str(SCRIPT), command],
            input="",
            text=True,
            capture_output=True,
            check=False,
        )

    def test_rejects_shell_and_malformed_commands(self):
        for command in (
            "",
            "id",
            f"deploy {REVISION} 1 {DIGEST}; id",
            f"deploy {REVISION} 1 $(id)",
            f"deploy {REVISION}\n1 {DIGEST}",
            f"deploy {REVISION} 0 {DIGEST}",
            f"deploy {REVISION} 1 {'B' * 64}",
        ):
            with self.subTest(command=command):
                result = self.run_command(command)
                self.assertEqual(result.returncode, 64)

    def test_valid_command_reaches_privilege_gate(self):
        result = self.run_command(f"deploy {REVISION} 1 {DIGEST}")
        self.assertEqual(result.returncode, 77)
        self.assertIn("restricted sudo", result.stderr)

    def test_baseline_assigns_cli_ledger_to_postgres(self):
        source = BASELINE_SCRIPT.read_text()
        for statement in (
            "alter schema supabase_migrations owner to postgres",
            "alter table supabase_migrations.schema_migrations owner to postgres",
            "alter table supabase_migrations.seed_files owner to postgres",
            "has_table_privilege('postgres', 'supabase_migrations.schema_migrations', 'INSERT')",
        ):
            with self.subTest(statement=statement):
                self.assertIn(statement, source)


if __name__ == "__main__":
    unittest.main()
