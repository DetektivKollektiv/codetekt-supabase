import pathlib
import tempfile
import unittest
from unittest import mock

import check_migrations


class MigrationChecksTest(unittest.TestCase):
    def test_finds_destructive_statements(self):
        with tempfile.TemporaryDirectory() as directory:
            migration = pathlib.Path(directory) / "20260908000000_drop_old_column.sql"
            migration.write_text("alter table public.items drop column old_value cascade;\n")
            found = check_migrations.warnings([migration])
        self.assertEqual([(1, "DROP COLUMN")], [(line, token.upper()) for _, line, token in found])

    def test_marks_modified_migrations_as_immutable(self):
        diff = mock.Mock(stdout="M\tsupabase/migrations/20260908000000_existing.sql\n")
        with mock.patch.object(check_migrations.subprocess, "run", return_value=diff):
            added, immutable = check_migrations.changed_migrations("base", "head")
        self.assertEqual(added, [])
        self.assertEqual(immutable, ["M\tsupabase/migrations/20260908000000_existing.sql"])

    def test_accepts_new_migration(self):
        diff = mock.Mock(stdout="A\tsupabase/migrations/20260908000000_new.sql\n")
        with mock.patch.object(check_migrations.subprocess, "run", return_value=diff):
            added, immutable = check_migrations.changed_migrations("base", "head")
        self.assertEqual(added, [pathlib.Path("supabase/migrations/20260908000000_new.sql")])
        self.assertEqual(immutable, [])

if __name__ == "__main__":
    unittest.main()
