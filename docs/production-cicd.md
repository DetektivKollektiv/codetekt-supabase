# Backend CI/CD auf Hetzner

Ziel ist das selbst gehostete Supabase unter `https://api.codetekt.org`.
Der Workflow `.github/workflows/backend.yml` läuft bei Pull Requests gegen `main`
und bei Pushes auf `main`. Das Frontend wird separat im Repository
`codetekt-frontend` gebaut und ausgerollt.

## Ablauf

`Backend checks` prüft zuerst die Migrationshistorie. Bereits vorhandene
Migrationsdateien dürfen nicht geändert, umbenannt oder gelöscht werden. Für
neue Migrationen erscheinen Hinweise bei `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`
und `CASCADE`; diese Hinweise blockieren den Lauf nicht.

Danach laufen die Deno-Unit-Tests. Die Supabase CLI startet eine vollständig
lokale, temporäre Instanz und wendet alle Migrationen und Seeds auf eine frische
PostgreSQL-17-Datenbank an. Vorhandene pgTAP-Dateien unter `supabase/tests` werden
mit `supabase test db` ausgeführt. Abschließend laufen beide Backend-E2E-Suites
gegen lokale Edge Functions. Diese Jobs erhalten keine Production-Secrets.

Nur ein erfolgreicher Push auf `main` startet `Deploy production backend`.
GitHub Actions bündelt die Migrationen, Edge Functions und die fest gepinnte
Supabase CLI 2.115.0. Ein eigener SSH-Schlüssel darf auf dem Server ausschließlich
den root-eigenen Deploy-Befehl starten. Das Bundle enthält keine `.env`-Dateien,
wird per SHA-256 geprüft und nicht dauerhaft auf dem Server gespeichert.

Da der Deploy-Job das GitHub Environment `hetzner-production` referenziert,
registriert GitHub automatisch ein Deployment mit dem Backend-Commit-SHA. Nur ein
erfolgreicher Job erhält den Status `success`. Frontend-PRs lesen den neuesten
erfolgreichen Eintrag und testen dadurch gegen exakt den aktuell ausgerollten
Backend-Stand. Beide Repositories sind öffentlich; dafür ist kein zusätzlicher
Cross-Repository-Token nötig.

Vor jeder Production-Änderung muss der Server bestätigen:

- WAL-Archivierung ist aktiv, hat einen aktuellen erfolgreichen WAL-Upload und
  keinen neueren Fehler.
- Im erreichbaren WAL-G-Ziel liegt ein Full Backup, das höchstens 36 Stunden alt ist.
- Die Production-Migrationshistorie wurde einmalig baselined und enthält keine
  Version, deren Datei im Deployment fehlt.

Dann führt die Supabase CLI nur ausstehende Migrationen gegen den laufenden,
intern erreichbaren `supabase-db`-Container aus. Anschließend werden die
versionierten Edge Functions in das vorhandene Bind-Mount-Verzeichnis übertragen
und nur der Compose-Service `functions` mit dem vorhandenen `run.sh` neu erstellt.
Images oder PostgreSQL-Major-Versionen werden dabei nicht aktualisiert.

Der Deploy prüft danach `/auth/v1/health` sowie die erwartete nicht autorisierte
Antwort der Function `get-review-template`. Fehler führen zu einem fehlgeschlagenen
Actions-Run. Bereits angewendete DB-Migrationen werden nicht automatisch
zurückgerollt; eine Korrektur erfolgt als neue Migration. Wenn die Function-
Aktualisierung fehlschlägt, stellt das Script deren vorheriges Verzeichnis wieder
her und meldet den gesamten Deploy trotzdem als fehlgeschlagen.

GitHub und der Server verhindern parallele Production-Deployments. Main-Läufe
werden in GitHub eingereiht; serverseitig schützt zusätzlich `flock` den Deploy.
Ältere Run-Nummern dürfen keinen neueren Release überschreiben.

## Einmalige Einrichtung

1. Das GitHub Environment `hetzner-production` ist im Backend-Repository
   angelegt und erlaubt Deployments ausschließlich vom Branch `main`.
2. Einen separaten Ed25519-Schlüssel für Backend-Deployments erzeugen. Den
   Private Key ausschließlich als Environment Secret `BACKEND_SSH_PRIVATE_KEY`
   speichern.
3. `scripts/deploy` und den Public Key über die bestehende administrative
   Verbindung auf den Server übertragen. Dort aus dem geprüften Verzeichnis
   `sudo bash install.sh <public-key-file>` ausführen. Der Installer startet
   keine Container und verändert keine Datenbank.
4. Als Environment Variable `SSH_HOST` die Serveradresse setzen. `SSH_KNOWN_HOSTS`
   muss die bereits über eine vertrauenswürdige Verbindung geprüfte Ed25519-
   Host-Key-Zeile enthalten. Während des Deployments kein ungeprüftes
   `ssh-keyscan` verwenden.
5. Prüfen, dass der neue Key weder eine Shell noch Port-Forwarding oder beliebige
   Befehle wie `id` ausführen kann.

Änderungen unter `scripts/deploy` aktualisieren die root-eigenen Serverdateien
nicht automatisch. Sie müssen separat geprüft und mit dem Installer bewusst
erneuert werden.

## Vor dem ersten automatischen Deploy

Production besitzt derzeit noch keine Tabelle
`supabase_migrations.schema_migrations`. Der Deploy bricht deshalb kontrolliert
ab, bis die bestehende Datenbank einmalig baselined wurde.

Vor der Baseline müssen alle vorhandenen Production-Objekte mit dem gewählten
Backend-Commit abgeglichen werden. Außerdem müssen der tägliche Full-Backup-Timer
installiert, ein frisches Full Backup nachgewiesen und ein isolierter Restore-Test
geplant beziehungsweise durchgeführt werden. Die Baseline ist kein Schema-Abgleich
und führt keine Migrationsdatei aus; sie markiert die Dateien des angegebenen
Checkouts nur als bereits angewendet.

Erst danach auf dem Server ausführen:

```sh
sudo /usr/local/sbin/codetekt-backend-baseline \
  /pfad/zum/geprueften/codetekt-supabase-checkout \
  baseline-existing-production
```

Anschließend die Tabelle prüfen und einen Pull Request vollständig durch
`Backend checks` laufen lassen. Der erste Merge auf `main` ist der erste echte
Production-Test der SSH-Strecke und muss in GitHub sowie über die öffentlichen
Health-Endpunkte beobachtet werden.

## GitHub-Konfiguration

Benötigt werden nur:

- Environment Secret `BACKEND_SSH_PRIVATE_KEY`
- Environment Variable `SSH_HOST`
- Environment Variable `SSH_KNOWN_HOSTS`

Für CI, Migrationen und Functions werden keine Production-Datenbankpasswörter an
GitHub übertragen. Das serverseitige Script nutzt die bereits im DB-Container
vorhandene interne Authentifizierung. `main` ist so geschützt, dass Änderungen
nur über Pull Requests mit dem Pflichtcheck `Backend checks` und aktuellem Branch
gemergt werden können. Der Schutz gilt auch für Administratoren; Force-Push und
Löschen sind deaktiviert.

## Lokale Prüfung

```sh
python3 scripts/ci/check_migrations.py <base-sha> <head-sha>
PYTHONPATH=scripts/ci python3 -m unittest scripts/ci/test_check_migrations.py
python3 scripts/deploy/test_deploy.py
deno test --allow-env \
  supabase/functions/_shared/supabase-api-keys.test.ts \
  supabase/functions/_wedium/schemas.test.ts \
  supabase/functions/_wedium/aggregation.test.ts
bash -n scripts/deploy/*.sh
```

Für den vollständigen lokalen Lauf eine isolierte Supabase-Instanz verwenden,
damit `supabase db reset` keine lokale Entwicklungsdatenbank überschreibt.

## Referenzen

- [Supabase: Automated testing using GitHub Actions](https://supabase.com/docs/guides/deployment/ci/testing)
- [Supabase: Database migrations](https://supabase.com/docs/guides/deployment/database-migrations)
- [Supabase: Managing environments](https://supabase.com/docs/guides/deployment/managing-environments)
