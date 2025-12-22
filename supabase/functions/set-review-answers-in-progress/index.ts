// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

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
  const { error: upsertError } = await supabase
    .from("review_answers_in_progress")
    .upsert({
      case_id,
      reviewed_by: user.id,
      data: validatedData as never,
      has_unpublished_changes: true,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "case_id,reviewed_by",
    });

  if (upsertError) {
    console.error("Upsert review_answers_in_progress error", upsertError);
    return new Response("Failed to save review answer", { status: 500 });
  }

  // Step 5: Return success response
  return new Response(
    JSON.stringify({ saved: true }),
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
