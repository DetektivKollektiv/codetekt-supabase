import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.1.13";
import { buildAggregation } from "../_shared/aggregation.ts";
import { reviewAggregationSchema } from "../_shared/schemas/aggregation-schemas.ts";
import { Database } from "../_shared/types/database.types.ts";

const MIN_REVIEWS_FOR_AGGREGATION = 2;

const requestSchema = z.object({
  case_id: z.string().uuid("Invalid case_id: must be a valid UUID"),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  try {
    // Step 1: Parse and validate request payload
    const json = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request payload",
          details: parsed.error.issues,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { case_id } = parsed.data;

    // Step 2: Create service role client
    const supabaseServiceRole = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey,
    );

    // Step 3: Query all submitted reviews for the case
    const { data: allSubmittedReviews, error: queryError } =
      await supabaseServiceRole
        .from("review_answers_submitted")
        .select("data, reviewed_by")
        .eq("case_id", case_id);

    if (queryError) {
      console.error("Failed to query submitted reviews:", queryError);
      return new Response(
        JSON.stringify({
          error: "Failed to query submitted reviews",
          details: queryError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 4: Enforce minimum review threshold
    if (
      !allSubmittedReviews ||
      allSubmittedReviews.length < MIN_REVIEWS_FOR_AGGREGATION
    ) {
      return new Response(
        JSON.stringify({
          error: "Insufficient reviews for aggregation",
          details:
            `Case has ${allSubmittedReviews?.length ?? 0} reviews, minimum ${MIN_REVIEWS_FOR_AGGREGATION} required`,
          review_count: allSubmittedReviews?.length ?? 0,
          required_count: MIN_REVIEWS_FOR_AGGREGATION,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 5: Build aggregation
    let aggregation: z.infer<typeof reviewAggregationSchema>;
    let resultScore: number;

    try {
      const aggregationResult = buildAggregation(
        allSubmittedReviews.map((r) => ({
          data: r.data,
          reviewed_by: r.reviewed_by,
        })),
      );

      aggregation = aggregationResult.aggregation;
      resultScore = aggregationResult.resultScore;
    } catch (error) {
      console.error("Error building aggregation:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to build aggregation",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 6: Validate aggregation output
    const validationResult = reviewAggregationSchema.safeParse(aggregation);

    if (!validationResult.success) {
      console.error("Aggregation validation failed:", validationResult.error);
      return new Response(
        JSON.stringify({
          error: "Aggregation output validation failed",
          details: validationResult.error.issues,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 7: Extract reviewer IDs
    const reviewerIds = allSubmittedReviews.map((r) => r.reviewed_by);

    // Step 8: Upsert aggregation to database
    const { error: upsertError } = await supabaseServiceRole
      .from("review_aggregations")
      .upsert({
        case_id: case_id,
        data: aggregation as never,
        result_score: resultScore,
        reviewer_ids: reviewerIds,
        calculated_at: new Date().toISOString(),
      }, {
        onConflict: "case_id",
      });

    if (upsertError) {
      console.error("Failed to save aggregation:", upsertError);
      return new Response(
        JSON.stringify({
          error: "Failed to save aggregation to database",
          details: upsertError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 9: Return success response
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Unexpected error in set-review-aggregation:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/set-review-aggregation' \
    --header 'Content-Type: application/json' \
    --data '{"case_id":"11111111-1111-4111-8111-111111111111"}'

*/
