import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.1.13";
import { buildAggregation, SubmittedReview } from "../_shared/aggregation.ts";
import { reviewAggregationSchema } from "../_shared/schemas/aggregation-schemas.ts";
import { submittedReviewAnswerSchema } from "../_shared/schemas/review-schemas.ts";
import { Database } from "../_shared/types/database.types.ts";

const MIN_REVIEWS_FOR_AGGREGATION = 2;

const requestSchema = z.object({
  case_id: z.string().uuid("Invalid case_id: must be a valid UUID"),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  console.log("=== HOT RELOAD TEST: Function version 2026-01-17-TEST ===");
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

    // Step 3.5: Query resolved disputes for metadata fields
    const { data: resolvedDisputes, error: disputeError } =
      await supabaseServiceRole
        .from("review_disputes")
        .select("field_id, final_value")
        .eq("case_id", case_id)
        .not("resolution", "is", null)
        .not("final_value", "is", null)
        .in("field_id", ["keyword_type", "content_type"]);

    if (disputeError) {
      console.error("Failed to query resolved disputes:", disputeError);
      return new Response(
        JSON.stringify({
          error: "Failed to query resolved disputes",
          details: disputeError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 4: Validate each review and filter out invalid ones
    console.log(`=== VALIDATING ${allSubmittedReviews?.length ?? 0} REVIEWS ===`);
    const validatedReviews: SubmittedReview[] = [];
    const invalidReviews: {
      reviewed_by: string;
      errors: z.core.$ZodIssueBase[];
    }[] = [];

    for (const review of allSubmittedReviews ?? []) {
      console.log(`Validating review by ${review.reviewed_by}:`, JSON.stringify(review.data));
      const validationResult = submittedReviewAnswerSchema.safeParse(review.data);
      if (validationResult.success) {
        console.log(`✓ Review by ${review.reviewed_by} is VALID`);
        validatedReviews.push(review);
      } else {
        console.warn(
          `✗ Review by ${review.reviewed_by} FAILED validation:`,
          JSON.stringify(validationResult.error.issues, null, 2),
        );
        invalidReviews.push({
          reviewed_by: review.reviewed_by,
          errors: validationResult.error.issues,
        });
      }
    }
    
    console.log(`=== VALIDATION COMPLETE: ${validatedReviews.length} valid, ${invalidReviews.length} invalid ===`);

    // Step 5: Enforce minimum review threshold on validated reviews
    if (validatedReviews.length < MIN_REVIEWS_FOR_AGGREGATION) {
      return new Response(
        JSON.stringify({
          error: "Insufficient valid reviews for aggregation",
          details:
            `Case has ${validatedReviews.length} valid reviews (${invalidReviews.length} invalid), minimum ${MIN_REVIEWS_FOR_AGGREGATION} required`,
          total_review_count: allSubmittedReviews?.length ?? 0,
          valid_review_count: validatedReviews.length,
          invalid_review_count: invalidReviews.length,
          required_count: MIN_REVIEWS_FOR_AGGREGATION,
          invalid_reviews: invalidReviews,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 6: Build aggregation
    let aggregation: z.infer<typeof reviewAggregationSchema>;
    let resultScore: number;

    try {
      const aggregationResult = buildAggregation(
        validatedReviews,
        resolvedDisputes || undefined,
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

    // Step 7: Validate aggregation output
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

    // Step 8: Extract reviewer IDs (only from validated reviews)
    const reviewerIds = validatedReviews.map((r) => r.reviewed_by);

    // Step 9: Upsert aggregation to database
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

    // Step 10: Return success response
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
