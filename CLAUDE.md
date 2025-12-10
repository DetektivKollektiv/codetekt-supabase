# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Codetekt is a **crowd-sourced content verification platform** built on Supabase. Users submit content (articles, posts) for review, multiple reviewers evaluate the content using structured questionnaires, and the system automatically aggregates results when 3+ reviews are submitted.

**Tech Stack:** Supabase (PostgreSQL 17, Auth, Edge Functions), Deno 2, TypeScript, Zod 4.1.13

## Development Commands

### Local Development Setup
```bash
# Start all Supabase services (PostgreSQL, API, Studio, Auth, etc.)
supabase start

# Access points after starting:
# - API: http://127.0.0.1:54321
# - Studio UI: http://127.0.0.1:54323
# - Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres
# - Email testing: http://127.0.0.1:54324

# Stop all services
supabase stop
```

### Database Management
```bash
# Reset database (drops DB, runs all migrations, runs all seed files)
supabase db reset

# Create new migration
supabase migration new <migration_name>

# Generate TypeScript types from database schema
supabase gen types typescript --local > supabase/functions/_shared/types/database.types.ts

# Push migrations to production
supabase db push
```

### Edge Functions
```bash
# Functions run automatically with hot reload (per_worker policy in config.toml)
# Edit files in supabase/functions/*/index.ts and they reload on next invocation

# Run function tests
deno test --allow-net --allow-env supabase/functions/tests/<function_name>_test.ts

# Deploy function to production
supabase functions deploy <function_name>

# Deploy all functions
supabase functions deploy
```

### Testing
```bash
# Run all function tests
deno test --allow-net --allow-env supabase/functions/tests/

# Run specific test file
deno test --allow-net --allow-env supabase/functions/tests/set-review-answer_test.ts
```

## Architecture

### Database Schema

**Core Data Flow:**
```
User → profiles
  ↓
Creates case → cases (references review_templates by version)
  ↓
Receives review_answers (status: in_progress or submitted)
  ↓
When 3+ submitted → review_aggregations (statistical results)
  ↓
Optional: case_disputes (metadata challenges requiring admin resolution)
```

**Key Tables:**
- **profiles**: User profiles (extends auth.users), public read, self-update
- **review_templates**: Versioned questionnaires stored as JSONB, immutable versions
- **cases**: Content submissions, references specific template version
- **review_answers**: User reviews with dual state (in_progress vs submitted)
  - Unique constraint: (case_id, reviewed_by) - one review per user per case
  - Visibility: Own reviews + all submitted reviews
- **review_aggregations**: Statistical aggregation of 3+ submitted reviews
  - Only service_role can write (via edge function)
  - Contains counts, percentages, averages, warnings, result_score (0-3 scale)
- **case_disputes**: Admin queue for disputing case metadata fields

### Edge Functions

#### set-review-answer (Primary Function)
**Location:** `supabase/functions/set-review-answer/index.ts`

**Purpose:** Save and validate review answers, trigger aggregation when threshold met

**Key Flow:**
1. **Authentication** - Verify JWT, extract user ID
2. **Dual Validation** - Smart status determination:
   - Try `submittedReviewAnswerSchema` (all required fields) → status: "submitted"
   - Fallback to `inProgressReviewAnswerSchema` (all optional) → status: "in_progress"
   - Both fail → Return validation errors
3. **Upsert Review** - Save/update review_answers (handles duplicate submissions)
4. **Aggregation Logic** (only if status = "submitted"):
   - Query all submitted reviews for case
   - If count >= 3: Calculate aggregation via `buildAggregation()`
   - Save to review_aggregations using service_role client
5. **Return** - {status, saved: true}

**Modules:**
- `validation.ts` - Dual-schema validation logic
- `aggregation.ts` - Statistical calculations (counts, percentages, averages, warnings)

#### get-review-template
**Status:** Placeholder (not yet implemented)
**Likely Purpose:** Retrieve review template with conditional field evaluation

### Validation Architecture

**Dual Schema Pattern** (unique to this codebase):
- Same endpoint handles both draft saves and final submissions
- Two Zod schemas for identical data structure:
  - `submittedReviewAnswerSchema`: All fields `.required()` - strict validation
  - `inProgressReviewAnswerSchema`: All fields `.optional()` - relaxed validation
- Validation determines status automatically based on data completeness
- Provides detailed error reporting for both validation attempts

**Conditional Field Logic:**
Review template fields support dynamic properties:
- `is_required`: boolean | Condition[] - Dynamic required validation
- `is_shown`: boolean | Condition[] - Dynamic visibility
- `is_disabled`: boolean | Condition[] - Dynamic enable/disable
- `is_disputable`: boolean | Condition[] - Dynamic dispute capability

Example: `{field_id: "additional_rating", operator: "<", value: 4}` makes a field required when rating < 4

### Aggregation Logic

**Function:** `buildAggregation()` in `supabase/functions/set-review-answer/aggregation.ts`

**Process:**
1. Aggregates only numeric fields (traffic-light and likert-scale with values 0-3)
2. For each field: Counts occurrences, calculates percentages, computes averages
3. Adds warning if field average < 2
4. Computes overall result_score (0-3 scale) as average of all field averages
5. Extracts metadata (keywords, content_type) from first answer

**Output Structure:**
```typescript
{
  aggregation: {
    metadata: { keywords: string[], content_type: string[] },
    fields: {
      [fieldId]: {
        counts: { 0: number, 1: number, 2: number, 3: number },
        percentages: { 0: number, 1: number, 2: number, 3: number },
        average: number,
        warnings: string[]
      }
    }
  },
  resultScore: number
}
```

## Important Patterns and Conventions

### Naming Conventions
- **Migrations**: `YYYYMMDDHHMMSS_description.sql` (timestamp-based)
- **Seeds**: `N_description.sql` (numbered for execution order)
- **Functions**: kebab-case directories with `index.ts` entrypoint
- **Schemas**: suffix `-schemas.ts`, grouped by domain
- **Database**: snake_case tables/columns
- **TypeScript**: camelCase variables, PascalCase types

### Row Level Security (RLS)
All tables use RLS policies for fine-grained access control:
- **Public read, authenticated write**: review_templates, cases (own cases)
- **Complex visibility**: review_answers (own + all submitted reviews)
- **Service role only**: review_aggregations write operations
- **Admin workflows**: case_disputes resolution

### Test Data
- Fixed UUIDs for test users: `aaaaaaaa-aaaa-...`, `bbbbbbbb-bbbb-...`, etc.
- Consistent test password: "testpassword123"
- Seeds create complete relational test data
- Run `supabase db reset` to reload fresh test data

### Database Type Generation
- Auto-generated types from schema: `supabase/functions/_shared/types/database.types.ts`
- **IMPORTANT:** Regenerate after any schema changes:
  ```bash
  supabase gen types typescript --local > supabase/functions/_shared/types/database.types.ts
  ```

### Shared Code Structure
Edge functions share code via `supabase/functions/_shared/`:
- `schemas/` - Zod validation schemas (grouped by domain)
- `types/` - TypeScript types (including auto-generated database.types.ts)
- Import using relative paths: `import { schema } from "../_shared/schemas/index.ts"`

## Configuration Files

### supabase/config.toml
Key settings:
- **project_id**: "codetekt-supabase"
- **PostgreSQL**: v17
- **Deno**: v2
- **Edge runtime policy**: "per_worker" (enables hot reload during development)
- **Auth**: Email/password enabled, JWT expiry 3600s
- **Ports**: API (54321), DB (54322), Studio (54323), Email testing (54324)

### .vscode/settings.json
- Deno enabled for `supabase/functions/` directory only
- Deno formatter for TypeScript
- Multiple unstable Deno features enabled (kv, cron, http, net, etc.)

## Review Template Structure

**Location:** `supabase/review_templates/template_1.json`

**Language:** German (target market appears to be German-speaking users)

**Structure:** Array of question sections, each containing:
- `id`: Unique section identifier
- `metadata`: {title, text, help_url, indent_level}
- `fields`: Array of field definitions

**Field Types:**
- `chip`: Single/multiple choice chips
- `traffic-light`: Yes/No/Unclear rating (0-2 scale typically)
- `likert-scale`: 5-point scale with labels
- `text-area`: Long-form text input
- `multi-line-text`: Multiple short text inputs

**Conditional Logic Example:**
Field `additional_comment` has `is_shown: [{field_id: "additional_rating", operator: "<", value: 4}]`
This makes the comment field visible only when rating indicates an issue (value < 4).

## Working with Migrations

**Creating Migrations:**
1. Make schema changes in SQL files
2. Create migration: `supabase migration new descriptive_name`
3. Write SQL in generated file: `supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql`
4. Test locally: `supabase db reset`
5. Regenerate types: `supabase gen types typescript --local > supabase/functions/_shared/types/database.types.ts`

**Migration Patterns in this Codebase:**
- Use `IF NOT EXISTS` for idempotent operations
- Include `CASCADE` on foreign key deletes where appropriate
- Add RLS policies immediately after table creation
- Create helper functions for complex queries (e.g., `has_admin_resolution()`)

## Environment Variables

**Local Development:** Automatically provided by `supabase start`
- `SUPABASE_URL`: http://127.0.0.1:54321
- `SUPABASE_ANON_KEY`: Public API key (auto-generated)
- `SUPABASE_SERVICE_ROLE_KEY`: Admin key (auto-generated, use cautiously)

**Production:** Set via Supabase Dashboard or CLI
```bash
supabase secrets set KEY_NAME=value
```

## Language and Localization

- **Database content**: German language (Inhaltstyp, Stichwörter, etc.)
- **Code**: English (functions, variables, comments)
- **Target audience**: German-speaking users (evident from review template)
- When adding features, maintain German UI text in review templates and user-facing content
