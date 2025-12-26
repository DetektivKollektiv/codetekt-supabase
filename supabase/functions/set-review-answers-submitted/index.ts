import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildAggregation } from "../_shared/aggregation.ts";
import { Database } from "../_shared/types/database.types.ts";
import { validateSubmittedData } from "./validation.ts";
import { reviewAggregationSchema } from "../_shared/schemas/aggregation-schemas.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async (req) => {
  try {
    // Step 1: Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      token,
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 2: Parse payload
    const { in_progress_id } = await req.json();

    if (!in_progress_id) {
      return new Response(
        JSON.stringify({ error: "Missing in_progress_id in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 3: Fetch in-progress draft (verify ownership)
    const { data: inProgressReview, error: fetchError } = await supabase
      .from("review_answers_in_progress")
      .select("*")
      .eq("id", in_progress_id)
      .eq("reviewed_by", user.id) // CRITICAL: Verify user owns the draft
      .single();

    if (fetchError || !inProgressReview) {
      return new Response(
        JSON.stringify({
          error: "Draft not found or you don't have permission to publish it",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Capture updated_at for optimistic locking (race condition protection)
    const originalUpdatedAt = inProgressReview.updated_at;

    // Step 4: Validate data with strict schema
    const validation = validateSubmittedData(
      inProgressReview.data as Record<string, unknown>,
    );

    if (!validation.success) {
      return new Response(
        JSON.stringify(validation.error),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 5: Create service_role client for writing to protected table
    const supabaseServiceRole = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey,
    );

    // Step 6: Upsert to review_answers_submitted table
    const { data: submittedReview, error: upsertError } =
      await supabaseServiceRole
        .from("review_answers_submitted")
        .upsert({
          case_id: inProgressReview.case_id,
          reviewed_by: user.id,
          data: validation.validatedData as never,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "case_id,reviewed_by",
        })
        .select()
        .single();

    if (upsertError || !submittedReview) {
      console.error("Failed to upsert submitted review:", upsertError);
      return new Response(
        JSON.stringify({
          error: "Failed to publish review",
          details: upsertError?.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 7: Update in-progress tracking (with race condition protection)
    const { data: updateResult, error: updateError } = await supabase
      .from("review_answers_in_progress")
      .update({
        submitted_review_answers_id: submittedReview.id,
        has_unpublished_changes: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", in_progress_id)
      .eq("updated_at", originalUpdatedAt) // Optimistic lock
      .select("id");

    // If no rows updated (race condition), fallback to linking only
    if (!updateResult || updateResult.length === 0) {
      console.warn(
        "Race condition detected: in-progress review was modified during publish. " +
          "Linking submitted_review_answers_id only, preserving newer draft state.",
      );

      const { error: fallbackError } = await supabase
        .from("review_answers_in_progress")
        .update({
          submitted_review_answers_id: submittedReview.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", in_progress_id);

      if (fallbackError) {
        console.error("Fallback update failed:", fallbackError);
      }
    } else if (updateError) {
      console.error("Failed to update in-progress tracking:", updateError);
      // Don't fail the request - the review was published successfully
    }

    // Step 8: Query all submitted reviews for aggregation
    const { data: allSubmittedReviews } = await supabaseServiceRole
      .from("review_answers_submitted")
      .select("data, reviewed_by")
      .eq("case_id", inProgressReview.case_id);

    let aggregated = false;

    // Step 9: Calculate and save aggregation if 3+ reviews
    if (allSubmittedReviews && allSubmittedReviews.length >= 3) {
      try {
        const { aggregation, resultScore } = buildAggregation(
          allSubmittedReviews.map((r) => ({
            data: r.data,
            reviewed_by: r.reviewed_by,
          })),
        );

        // Validate aggregation output against schema
        const validationResult = reviewAggregationSchema.safeParse(aggregation);
        if (!validationResult.success) {
          console.error("Aggregation validation failed:", validationResult.error);
          throw new Error("Aggregation output does not match schema");
        }

        const reviewerIds = allSubmittedReviews.map((r) => r.reviewed_by);

        const { error: aggregationError } = await supabaseServiceRole
          .from("review_aggregations")
          .upsert({
            case_id: inProgressReview.case_id,
            data: aggregation as never,
            result_score: resultScore,
            reviewer_ids: reviewerIds,
            calculated_at: new Date().toISOString(),
          }, {
            onConflict: "case_id",
          });

        if (aggregationError) {
          console.error("Failed to save aggregation:", aggregationError);
          // Don't fail the request - aggregation can be recalculated later
        } else {
          aggregated = true;
        }
      } catch (error) {
        console.error("Error during aggregation:", error);
        // Don't fail the request
      }
    }

    // Step 10: Return success response
    return new Response(
      JSON.stringify({
        saved: true,
        review_id: submittedReview.id,
        aggregated,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Unexpected error in set-review-answers-submitted:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
