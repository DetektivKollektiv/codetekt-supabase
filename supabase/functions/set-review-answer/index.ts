// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Database } from "../_shared/types/database.types.ts";
import { reviewAggregationSchema } from "../_shared/schemas/index.ts";
import { payloadSchema, validateReviewAnswer } from "./validation.ts";
import { buildAggregation } from "./aggregation.ts";

type ReviewAggregationRow =
  Database["public"]["Tables"]["review_aggregations"]["Row"];

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

  // Step 3: Validate review answer data (submitted vs in-progress)
  const validationResult = validateReviewAnswer(data);

  if (!validationResult.success) {
    return new Response(
      JSON.stringify(validationResult.error),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const { status, validatedData, submitted_at } = validationResult;

  // Step 4: Save review answer
  const { error: upsertError } = await supabase
    .from("review_answers")
    .upsert({
      case_id,
      reviewed_by: user.id,
      data: validatedData as never,
      status,
      submitted_at,
    }, {
      onConflict: "case_id,reviewed_by",
    });

  if (upsertError) {
    console.error("Upsert review_answers error", upsertError);
    return new Response("Failed to save review answer", { status: 500 });
  }

  // Step 5: Run aggregation logic if review was submitted
  if (status === "submitted") {
    // Fetch all submitted answers for this case
    const { data: submitted, error: selectError } = await supabase
      .from("review_answers")
      .select("data, reviewed_by")
      .eq("case_id", case_id)
      .eq("status", "submitted");

    if (selectError || !submitted) {
      console.error("Select review_answers error", selectError);
      return new Response("Failed to read review answers", { status: 500 });
    }

    // Only aggregate when at least 3 submitted answers exist
    if (submitted.length >= 3) {
      const { aggregation, resultScore } = buildAggregation(submitted);

      // Validate aggregation structure to match shared schema
      const validAggregation = reviewAggregationSchema.parse(aggregation);

      const serviceClient = createClient<Database>(
        supabaseUrl,
        supabaseServiceRoleKey,
      );

      const { error: aggError } = await serviceClient
        .from("review_aggregations")
        .upsert(
          {
            case_id,
            data: validAggregation,
            result_score: resultScore,
            reviewer_ids: submitted.map((row) => row.reviewed_by),
            calculated_at: new Date().toISOString(),
          } satisfies ReviewAggregationRow,
          {
            onConflict: "case_id",
          },
        );

      if (aggError) {
        console.error("Upsert review_aggregations error", aggError);
        return new Response("Failed to save aggregation", { status: 500 });
      }
    }
  }

  // Step 6: Return success response
  return new Response(
    JSON.stringify({ status, saved: true }),
    { headers: { "Content-Type": "application/json" } },
  );
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/set-review-answer' \
    --header 'Authorization: Bearer YOUR_TOKEN' \
    --header 'Content-Type: application/json' \
    --data '{"case_id":"uuid","data":{}}'

*/
