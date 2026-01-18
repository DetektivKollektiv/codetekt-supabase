/**
 * SET REVIEW AGGREGATION EDGE FUNCTION
 *
 * Aggregates all submitted reviews for a case into a single consensus result.
 * Uses service role key to access all reviews regardless of RLS policies.
 *
 * Aggregation process:
 * - Fetches case and associated review template
 * - Fetches all submitted reviews for the specified case
 * - Validates each review against the schema (filters out invalid reviews)
 * - Applies resolved dispute values for metadata fields (title, keywords, content_type)
 * - Calculates consensus values and confidence scores for all fields
 * - Organizes aggregated fields by questions matching template structure
 * - Generates quality tags for each aggregated field
 * - Computes overall result score based on field agreements
 * - Stores aggregation with reviewer IDs and timestamp
 *
 * Requirements:
 * - Minimum 2 valid reviews required for aggregation
 * - Invalid reviews are logged but don't block aggregation
 * - Resolved disputes override review values for metadata fields
 * - Template must exist and be valid
 *
 * Returns:
 * - Success response when aggregation is saved
 * - Error if case or template not found
 * - Error if insufficient valid reviews (< 2)
 * - Error if aggregation validation fails
 * - Error if database operations fail
 *
 * Database updates:
 * - Upserts to review_aggregations table (on conflict: case_id)
 * - Stores: aggregated data, result_score, reviewer_ids, calculated_at timestamp
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.1.13";
import { reviewAggregationSchema } from "../_shared/schemas/aggregation-schemas.ts";
import { submittedReviewAnswerSchema } from "../_shared/schemas/review-schemas.ts";
import { reviewTemplateSchema } from "../_shared/schemas/template-schemas.ts";
import { Database } from "../_shared/types/database.types.ts";
import { buildAggregation, SubmittedReview } from "./aggregation.ts";

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

    // Step 2.5: Fetch case to get template_version
    const { data: caseData, error: caseError } = await supabaseServiceRole
      .from("cases")
      .select("template_version")
      .eq("id", case_id)
      .single();

    if (caseError || !caseData) {
      console.error("Failed to fetch case:", caseError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch case",
          details: caseError?.message || "Case not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 2.6: Fetch template
    const { data: templateData, error: templateError } =
      await supabaseServiceRole
        .from("review_templates")
        .select("template")
        .eq("version", caseData.template_version)
        .single();

    if (templateError || !templateData) {
      console.error("Failed to fetch template:", templateError);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch template",
          details: templateError?.message || "Template not found",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 2.7: Validate template
    const templateValidation = z.array(reviewTemplateSchema).safeParse(
      templateData.template,
    );

    if (!templateValidation.success) {
      console.error("Template validation failed:", templateValidation.error);
      return new Response(
        JSON.stringify({
          error: "Template validation failed",
          details: templateValidation.error.issues,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const template = templateValidation.data;

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
        .in("field_id", ["title", "keyword_type", "content_type"]);

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
    const validatedReviews: SubmittedReview[] = [];
    const invalidReviews: {
      reviewed_by: string;
      errors: z.core.$ZodIssueBase[];
    }[] = [];

    for (const review of allSubmittedReviews ?? []) {
      const validationResult = submittedReviewAnswerSchema.safeParse(
        review.data,
      );
      if (validationResult.success) {
        validatedReviews.push(review);
      } else {
        console.warn(
          `Review by ${review.reviewed_by} failed validation:`,
          validationResult.error.issues,
        );
        invalidReviews.push({
          reviewed_by: review.reviewed_by,
          errors: validationResult.error.issues,
        });
      }
    }

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
        template,
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
