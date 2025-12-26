```markdown
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Codetekt is a **crowd-sourced content verification platform** built on Supabase. Users submit content (articles, posts) for review, multiple reviewers evaluate the content using structured questionnaires, and the system automatically aggregates results when 3+ reviews are submitted. Users can discuss cases through a comment system with moderation capabilities.

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

# Run specific test files
deno test --allow-net --allow-env supabase/functions/tests/set-review-answers-in-progress_test.ts
deno test --allow-net --allow-env supabase/functions/tests/set-review-answers-submitted_test.ts
```

## Architecture

### Database Schema

**Core Data Flow:**
```
User → profiles
  ↓
Creates case → cases (references review_templates by version)
  ↓
Saves draft → review_answers_in_progress (private to author)
  ↓
Publishes → review_answers_submitted (public read, service_role write)
  ↓
When 3+ submitted → review_aggregations (statistical results)
  ↓
Optional: case_disputes (metadata challenges requiring admin resolution)
  ↓
Community: case_comments (discussion, moderation, likes, reports)
```

**Key Tables:**

**Core Tables:**
- **profiles**: User profiles (extends auth.users), public read, self-update
  - Fields: `id`, `username`, `is_admin`, `updated_at`
  - `is_admin`: Boolean flag for admin privileges (default: false)
- **review_templates**: Versioned questionnaires stored as JSONB, immutable versions
- **cases**: Content submissions, references specific template version

**Review System:**
- **review_answers_in_progress**: Draft reviews (private to author)
  - Unique constraint: (case_id, reviewed_by) - one draft per user per case
  - Visibility: Own drafts only
  - Tracks: `submitted_review_answers_id` (link to published), `has_unpublished_changes` (sync state)
- **review_answers_submitted**: Published reviews (public read, service_role write only)
  - Unique constraint: (case_id, reviewed_by) - one published review per user per case
  - Visibility: All authenticated users can read
  - Immutable by users after publish (only edge function can write)
- **review_aggregations**: Statistical aggregation of 3+ submitted reviews
  - Only service_role can write (via edge function)
  - Contains counts, percentages, averages, warnings, result_score (0-3 scale)
- **case_disputes**: Admin queue for disputing case metadata fields

**Comment System:**
- **case_comments**: User comments on cases
  - Fields: `id`, `case_id`, `author_id`, `content`, `edited_at`, `created_at`, `updated_at`
  - Edit tracking: `edited_at` timestamp (no edit history)
  - Authors can edit/delete only non-moderated comments
  - Content limit: 1-5000 characters
- **case_comment_moderations**: Admin moderation of comments
  - Fields: `id`, `comment_id`, `reason`, `moderated_by`, `moderated_at`
  - Unique constraint: One moderation per comment
  - Existence = comment is hidden
  - `moderated_by` nullable (supports deleted admins via SET NULL)
  - Prevents author edit/delete when moderation exists
- **case_comment_likes**: User likes on comments
  - Fields: `id`, `comment_id`, `user_id`, `created_at`
  - Unique constraint: One like per user per comment
  - Simple like/unlike functionality (no reaction types)
- **case_comment_reports**: User reports of problematic comments
  - Fields: `id`, `comment_id`, `reported_by`, `reason`, `created_at`
  - Unique constraint: One report per user per comment
  - `reason`: Freetext explanation (10-500 characters)
  - No resolution tracking (admin checks if moderation exists)

### Edge Functions

#### set-review-answers-in-progress
**Location:** `supabase/functions/set-review-answers-in-progress/index.ts`

**Purpose:** Save draft review answers (all fields optional)

**Key Flow:**
1. **Authentication** - Verify JWT, extract user ID
2. **Parse Payload** - `{ case_id, data }`
3. **Validation** - Use `inProgressReviewAnswerSchema` (all fields optional)
4. **Upsert Draft** - Save/update to `review_answers_in_progress` table
   - Sets `has_unpublished_changes = true`
   - Uses `onConflict: "case_id,reviewed_by"`
5. **Return** - `{ saved: true }`

**Modules:**
- `validation.ts` - Simple validation with optional fields

#### set-review-answers-submitted
**Location:** `supabase/functions/set-review-answers-submitted/index.ts`

**Purpose:** Publish complete review drafts, trigger aggregation when threshold met

**Key Flow:**
1. **Authentication** - Verify JWT, extract user ID
2. **Parse Payload** - `{ in_progress_id }`
3. **Fetch Draft** - Get in-progress review (verify ownership with `reviewed_by = user.id`)
4. **Capture Timestamp** - Store `updated_at` for optimistic locking (race condition protection)
5. **Validation** - Use `submittedReviewAnswerSchema` (all fields required, strict)
6. **Publish Review** - Upsert to `review_answers_submitted` using service_role client
7. **Update Tracking** - Update in-progress record with optimistic lock:
   - Normal case: Set `submitted_review_answers_id` + `has_unpublished_changes = false`
   - Race condition detected: Only set `submitted_review_answers_id` (preserves newer draft state)
8. **Aggregation** - If 3+ submitted reviews: Calculate and save aggregation
9. **Return** - `{ saved: true, review_id, aggregated }`

**Modules:**
- `validation.ts` - Strict validation (all fields required)
- `aggregation.ts` - Statistical calculations (counts, percentages, averages, warnings)

**Race Condition Protection:**
Uses optimistic locking with `updated_at` timestamp to prevent overwriting concurrent edits. If draft is modified during publish, the function gracefully degrades to only linking the published review while preserving the newer draft's unpublished state.

#### get-review-template
**Location:** `supabase/functions/get-review-template/index.ts`

**Purpose:** Retrieve review template with dynamic field modifications based on reviewer status, aggregated metadata, and dispute resolutions

**Key Flow:**
1. **Authentication** - Verify JWT, extract user ID
2. **Input Validation** - Validate `case_id` using Zod schema
3. **Data Fetching** - Single optimized query fetches:
   - Case + template
   - User's in-progress review (if exists)
   - All submitted reviews for aggregation
   - All disputes for the case
4. **Dispute Checks**:
   - **Open disputes** (resolution = NULL): Return 403 with error (blocks all access)
   - **Resolved disputes** (resolution != NULL): Apply admin's final values as locked fields
5. **Template Building** (6-step process):
   - Clone base template
   - Aggregate metadata from submitted reviews (keywords, content_types)
   - Build modifications for first vs subsequent reviewer
   - Apply metadata modifications (keywords, content_type)
   - Apply resolved dispute modifications (overrides aggregated values)
   - Populate user's in-progress draft values (if exists)
6. **Return** - Modified template with all field configurations

**Modules:**
- `template-modifier.ts` - Template modification utilities (aggregation, field modifications)

**Reviewer Status Logic:**

*First Reviewer (0 submitted reviews):*
- `keyword_type`: is_required=true, additonal_option_count=5
- `content_type`: is_required=true

*Subsequent Reviewer (1+ submitted reviews):*
- `keyword_type`: is_required=false, is_disputable=true, additonal_option_count=3, aggregated keywords as disabled options
- `content_type`: is_required=false, is_disabled=true, is_disputable=true, prefilled with aggregated values

*Resolved Dispute (admin decision):*
- Affected field: is_required=false, is_disputable=false, is_disabled=true, prefilled with admin's final_value
- Overrides all other logic (highest priority)

**Dispute Handling:**

*Open Disputes:* Returns 403 Forbidden with `{ error: "Case has pending disputes", dispute_count: N }`

*Resolved Disputes:* Admin's final_value applied as locked field configuration, preventing further edits or disputes

### Validation Architecture

**Two-Schema Pattern:**
- Two separate edge functions with different validation requirements:
  - `set-review-answers-in-progress`: Uses `inProgressReviewAnswerSchema` (all fields optional)
  - `set-review-answers-submitted`: Uses `submittedReviewAnswerSchema` (all fields required)
- Clear separation of draft vs. published concerns
- Provides detailed error reporting with Zod validation issues

**Conditional Field Logic:**
Review template fields support dynamic properties:
- `is_required`: boolean | Condition[] - Dynamic required validation
- `is_shown`: boolean | Condition[] - Dynamic visibility
- `is_disabled`: boolean | Condition[] - Dynamic enable/disable
- `is_disputable`: boolean | Condition[] - Dynamic dispute capability

Example: `{field_id: "additional_rating", operator: "<", value: 4}` makes a field required when rating < 4

### Aggregation Logic

**Function:** `buildAggregation()` in `supabase/functions/set-review-answers-submitted/aggregation.ts`

**When Triggered:** Automatically when 3+ submitted reviews exist for a case

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
    metadata: { keywords: string[] | null, content_type: string[] | null },
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

**Saved to:** `review_aggregations` table with `reviewer_ids` array and `calculated_at` timestamp

### Two-Table Review Architecture

**Design Pattern:** Separation of draft and published review data

**Benefits:**
- **Clean State Management**: No ambiguous "status" field; table determines state
- **Security**: Published reviews are immutable by users (service_role only)
- **History Preservation**: In-progress table maintains draft history even after publish
- **Race Condition Protection**: Optimistic locking prevents concurrent edit conflicts

**Key Concepts:**

1. **Draft → Publish Flow:**
   ```
   User creates draft → review_answers_in_progress (has_unpublished_changes = true)
   User edits draft → Upsert to in_progress (maintains has_unpublished_changes = true)
   User publishes → Copies to review_answers_submitted (via service_role)
                  → Updates in_progress (sets submitted_review_answers_id, has_unpublished_changes = false)
   ```

2. **Edit After Publish Flow:**
   ```
   User edits published review → Creates new version in in_progress (has_unpublished_changes = true)
   Published review unchanged → Original remains in submitted table
   User republishes → Updates submitted (upsert), resets in_progress tracking
   ```

3. **State Indicators:**
   - `has_unpublished_changes = false` + `submitted_review_answers_id != null` → Draft synced with published
   - `has_unpublished_changes = true` + `submitted_review_answers_id != null` → Newer draft exists
   - `has_unpublished_changes = true` + `submitted_review_answers_id = null` → Never published
   - No in_progress record → No draft (may have published review only)

4. **Race Condition Handling:**
   - `set-review-answers-submitted` uses optimistic locking via `updated_at` timestamp
   - If concurrent edit detected during publish: Only links published review, preserves draft's unpublished state
   - Prevents data corruption from simultaneous save + publish operations

### Comment System Architecture

**Design Principles:**
- **KISS Principle**: Minimal complexity, no edit history
- **GDPR-Friendly**: CASCADE deletes for user data removal
- **Admin Preservation**: Moderations survive admin deletion via SET NULL

**Comment Lifecycle:**
```
User creates comment → case_comments
  ↓
User can edit (if not moderated) → edited_at timestamp updated
  ↓
Other users can like → case_comment_likes
  ↓
Other users can report → case_comment_reports
  ↓
Admin moderates (hides) → case_comment_moderations
  ↓
User cannot edit/delete moderated comments
```

**Key Features:**

1. **Edit Tracking (Simple):**
   - `edited_at` timestamp only (no edit history)
   - Trigger updates timestamp on content change
   - Frontend shows "(bearbeitet)" badge

2. **Moderation:**
   - Existence-based: Entry in `case_comment_moderations` = hidden
   - Admin provides reason (10-500 characters)
   - Deleting moderation = unhiding comment
   - `moderated_by` can be NULL (deleted admin)

3. **Likes:**
   - Simple like/unlike (no reaction types)
   - One like per user per comment
   - Count aggregated in frontend

4. **Reports:**
   - Freetext reason (10-500 characters)
   - No resolution workflow (admin checks if moderated)
   - One report per user per comment

**CASCADE Rules:**

- **User Deletion (GDPR):**
  ```
  DELETE profiles
    → CASCADE → case_comments (all user comments deleted)
      → CASCADE → case_comment_likes (likes on those comments deleted)
      → CASCADE → case_comment_moderations (moderations deleted)
      → CASCADE → case_comment_reports (reports deleted)
    → CASCADE → case_comment_likes (user's own likes deleted)
    → CASCADE → case_comment_reports (user's own reports deleted)
  ```

- **Admin Deletion:**
  ```
  DELETE profiles (admin)
    → SET NULL → case_comment_moderations.moderated_by
    (moderations remain, show "Gelöschter Administrator")
  ```

- **Case Deletion:**
  ```
  DELETE cases
    → CASCADE → case_comments
      → CASCADE → case_comment_likes
      → CASCADE → case_comment_moderations
      → CASCADE → case_comment_reports
  ```

**RLS Policies:**

- **case_comments:**
  - SELECT: Everyone (true)
  - INSERT: Authenticated, own author_id
  - UPDATE: Own comments, not moderated
  - DELETE: Own comments, not moderated

- **case_comment_moderations:**
  - SELECT: Everyone (transparency)
  - ALL: Admins only (is_admin = true)

- **case_comment_likes:**
  - SELECT: Everyone (true)
  - INSERT: Authenticated, own user_id
  - DELETE: Own likes

- **case_comment_reports:**
  - SELECT: Admins see all OR users see own
  - INSERT: Authenticated, own reported_by

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
- **Private to author**: review_answers_in_progress (users can only see/edit their own drafts)
- **Public read, service_role write**: review_answers_submitted (read-only for users)
- **Service role only**: review_aggregations write operations
- **Admin workflows**: case_disputes resolution, comment moderation
- **Comment system**: Public read comments/likes, restricted write, admin-only moderation

### Admin System
- **Admin Flag**: `profiles.is_admin` boolean (default: false)
- **Set via UI**: Managed through Supabase Studio or direct SQL
- **Capabilities**: Moderate comments, resolve disputes, full moderation access
- **Preservation**: Admin deletion sets moderated_by to NULL (moderations remain)

### Test Data
- Fixed UUIDs for test users: `aaaaaaaa-aaaa-...`, `bbbbbbbb-bbbb-...`, etc.
- Consistent test password: "testpassword123"
- First test user (Gorm) is admin: `is_admin = true`
- Seeds create complete relational test data including comments, moderations, likes, reports
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

### Security Functions
All PL/pgSQL functions use secure search paths:
```sql
CREATE OR REPLACE FUNCTION function_name()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
...
$$;
```

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
- Use `SET NULL` for admin references to preserve data on admin deletion
- Add RLS policies immediately after table creation
- Create helper functions for complex queries (e.g., `has_admin_resolution()`)
- Set `search_path` in all PL/pgSQL functions for security

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

## Frontend Integration Notes

### Comment System Frontend Queries

**Fetch Comments for a Case:**
```typescript
// Get all comments with author info
const { data: comments } = await supabase
  .from('case_comments')
  .select('*, profiles!author_id(username)')
  .eq('case_id', caseId);

// Get moderations
const { data: moderations } = await supabase
  .from('case_comment_moderations')
  .select('comment_id, reason, moderated_at, profiles!moderated_by(username)')
  .in('comment_id', commentIds);

// Get like counts + user's likes
const { data: likes } = await supabase
  .from('case_comment_likes')
  .select('comment_id, user_id')
  .in('comment_id', commentIds);

// Get user's reports
const { data: myReports } = await supabase
  .from('case_comment_reports')
  .select('comment_id')
  .eq('reported_by', userId)
  .in('comment_id', commentIds);

// Merge in frontend:
// - is_hidden = moderations.some(m => m.comment_id === comment.id)
// - like_count = likes.filter(l => l.comment_id === comment.id).length
// - i_liked = likes.some(l => l.comment_id === comment.id && l.user_id === userId)
// - i_reported = myReports.some(r => r.comment_id === comment.id)
```

**Display Logic:**
- Show "(bearbeitet)" badge if `edited_at` is not null
- Hide content if moderation exists, show reason instead
- Show "Gelöschter Administrator" if `moderated_by` is null
- Disable edit/delete buttons on moderated comments
- Only show comment form on cases with 3+ reviews (aggregation exists)
```