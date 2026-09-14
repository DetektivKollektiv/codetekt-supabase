import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  buildWediumAggregation,
  MIN_WEDIUM_REVIEWS,
} from "../_wedium/aggregation.ts";
import { isSecretValid } from "../_wedium/auth.ts";
import {
  wediumAggregationWorkerRequestSchema,
  wediumAnswersSchema,
} from "../_wedium/schemas.ts";
import { getSupabaseSecretKey } from "../_shared/supabase-api-keys.ts";
import { Database } from "../_shared/types/database.types.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseSecretKey = getSupabaseSecretKey();

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (
    !isSecretValid(
      Deno.env.get("DB_WEBHOOK_SECRET") ?? "",
      request.headers.get("x-db-secret") ?? "",
    )
  ) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const body = await request.json().catch(() => null);
  const parsedRequest = wediumAggregationWorkerRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return jsonResponse({
      error: "Invalid request payload",
      details: parsedRequest.error.issues,
    }, 422);
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseSecretKey);
  const { post_id: postId } = parsedRequest.data;

  const { data: post, error: postError } = await supabase
    .from("wedium_posts")
    .select("id, review_revision")
    .eq("id", postId)
    .maybeSingle();

  if (postError) {
    console.error("Failed to read Wedium post revision:", postError);
    return jsonResponse({ error: "Internal server error" }, 500);
  }

  if (!post) {
    return jsonResponse({ error: "Wedium post not found" }, 404);
  }

  const { data: storedReviews, error: reviewsError } = await supabase
    .from("wedium_reviews")
    .select("id, created_at, reviewed_by, data")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (reviewsError) {
    console.error("Failed to read Wedium reviews:", reviewsError);
    return jsonResponse({ error: "Internal server error" }, 500);
  }

  const reviews = [];
  for (const review of storedReviews ?? []) {
    const parsedAnswers = wediumAnswersSchema.safeParse(review.data);

    if (!parsedAnswers.success) {
      console.error(
        `Stored Wedium review ${review.id} failed validation:`,
        parsedAnswers.error.issues,
      );
      return jsonResponse({ error: "Stored review validation failed" }, 500);
    }

    reviews.push({
      reviewed_by: review.reviewed_by,
      data: parsedAnswers.data,
    });
  }

  if (reviews.length < MIN_WEDIUM_REVIEWS) {
    return jsonResponse({
      success: true,
      published: false,
      reason: "insufficient_reviews",
    });
  }

  const aggregation = buildWediumAggregation(reviews);
  const { data: published, error: publishError } = await supabase.rpc(
    "publish_wedium_review_aggregation",
    {
      p_post_id: postId,
      p_source_revision: post.review_revision,
      p_result_score: aggregation.resultScore,
      p_data: aggregation.data as never,
      p_reviewer_ids: aggregation.reviewerIds,
    },
  );

  if (publishError) {
    console.error("Failed to publish Wedium aggregation:", publishError);
    return jsonResponse({ error: "Internal server error" }, 500);
  }

  if (!published) {
    return jsonResponse({
      success: true,
      published: false,
      reason: "stale_revision",
    });
  }

  return jsonResponse({ success: true, published: true });
});
