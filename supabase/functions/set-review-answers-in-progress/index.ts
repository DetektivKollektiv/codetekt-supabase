/**
 * SET REVIEW ANSWERS IN-PROGRESS EDGE FUNCTION
 *
 * Saves a reviewer's draft answers while they're working on a case review.
 * Allows incremental progress tracking and auto-save functionality.
 *
 * Validation:
 * - Validates request payload (case_id, data object)
 * - Validates review data against in-progress schema (all fields optional)
 * - Only saves fields that are provided (partial updates supported)
 *
 * Behavior:
 * - Upserts to review_answers_in_progress table (per user per case)
 * - Sets has_unpublished_changes flag to true
 * - Updates timestamp on each save
 * - Does not require all fields to be filled (draft state)
 * - If comment field is provided with length > 0, inserts into case_comments table
 *
 * Requirements:
 * - User must be authenticated
 * - Valid case_id required
 * - Data must conform to in-progress schema structure
 *
 * Returns:
 * - Success response with saved: true and in_progress_id
 * - Error if authentication fails
 * - Error if validation fails
 * - Error if database operation fails
 *
 * Database updates:
 * - Upserts to review_answers_in_progress (on conflict: case_id, reviewed_by)
 * - Stores: case_id, reviewed_by, data, has_unpublished_changes, updated_at
 * - Optionally inserts to case_comments if comment provided
 */

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Database } from "../_shared/types/database.types.ts";
import { payloadSchema, validateInProgressData } from "./validation.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  // Step 1: Authenticate user
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return new Response("Missing Authorization header", { status: 401 });
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabase.auth.getUser(
    token,
  );

  if (userError || !user) {
    console.error("Error fetching user:", userError);
    return new Response("Unauthorized", { status: 401 });
  }

  // Step 2: Parse and validate payload
  const json = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { case_id, data } = parsed.data;

  // Step 3: Validate review answer data (in-progress schema - all fields optional)
  const validationResult = validateInProgressData(data);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify(validationResult.error),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { validatedData } = validationResult;

  // Step 4: Save review answer to in_progress table
  const { data: savedData, error: upsertError } = await supabase
    .from("review_answers_in_progress")
    .upsert({
      case_id,
      reviewed_by: user.id,
      data: validatedData as never,
      has_unpublished_changes: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "case_id,reviewed_by",
    })
    .select()
    .single();

  if (upsertError) {
    console.error("Upsert review_answers_in_progress error", upsertError);
    return new Response("Failed to save review answer", { status: 500 });
  }

  // Step 5: Handle comment insertion if provided
  const comment = validatedData.comment;
  if (comment && typeof comment === "string" && comment.trim().length > 0) {
    const { error: commentError } = await supabase
      .from("case_comments")
      .insert({
        case_id,
        author_id: user.id,
        content: comment.trim(),
      });

    if (commentError) {
      console.error("Failed to insert case comment:", commentError);
      // Don't fail the entire request - the review was saved successfully
    }
  }

  // Step 6: Return success response
  return new Response(
    JSON.stringify({ saved: true, in_progress_id: savedData.id }),
    { headers: { "Content-Type": "application/json" } },
  );
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/set-review-answers-in-progress' \
    --header 'Authorization: Bearer YOUR_TOKEN' \
    --header 'Content-Type: application/json' \
    --data '{"case_id":"11111111-1111-4111-8111-111111111111","data":{"grammar":2,"structure":3}}'

*/
