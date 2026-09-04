import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { levelToResultCode, scoreToLevel } from "../_wedium/aggregation.ts";
import { isSecretValid } from "../_wedium/auth.ts";
import {
  putWediumReviewBodySchema,
  wediumAggregationRequestSchema,
  wediumHashSchema,
} from "../_wedium/schemas.ts";
import { getSupabaseSecretKey } from "../_shared/supabase-api-keys.ts";
import { Database } from "../_shared/types/database.types.ts";

type WediumClient = SupabaseClient<Database>;

type ApiErrorCode =
  | "unauthorized"
  | "not_found"
  | "method_not_allowed"
  | "validation_error"
  | "internal_error";

type AggregationJoin = {
  post_hash: string;
  aggregation: {
    result_score: number;
    data:
      Database["public"]["Tables"]["wedium_review_aggregations"]["Row"]["data"];
    reviewer_ids: string[];
    calculated_at: string;
  } | null;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseSecretKey = getSupabaseSecretKey();

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function errorResponse(
  status: number,
  code: ApiErrorCode,
  message: string,
  issues?: unknown[],
): Response {
  return jsonResponse({
    error: {
      code,
      message,
      ...(issues ? { issues } : {}),
    },
  }, status);
}

function getRouteParts(requestUrl: string): string[] | null {
  const segments = new URL(requestUrl).pathname.split("/").filter(Boolean);
  const functionIndex = segments.lastIndexOf("wedium");

  if (functionIndex < 0) return null;

  try {
    return segments.slice(functionIndex + 1).map(decodeURIComponent);
  } catch {
    return null;
  }
}

function validateHash(hash: string, name: string): Response | null {
  const parsed = wediumHashSchema.safeParse(hash);
  if (parsed.success) return null;

  return errorResponse(422, "validation_error", `Invalid ${name}`, [{
    path: [name],
    message: parsed.error.issues[0]?.message ?? "Invalid hash",
  }]);
}

async function findUserId(
  supabase: WediumClient,
  userHash: string,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("wedium_users")
    .select("id")
    .eq("user_hash", userHash)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function findPostId(
  supabase: WediumClient,
  postHash: string,
): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from("wedium_posts")
    .select("id")
    .eq("post_hash", postHash)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function handleAggregationRequest(
  request: Request,
  supabase: WediumClient,
): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = wediumAggregationRequestSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      422,
      "validation_error",
      "Invalid aggregation request",
      parsed.error.issues,
    );
  }

  const postHashes = parsed.data.post_hashes;
  const { data, error } = await supabase
    .from("wedium_posts")
    .select(
      "post_hash, aggregation:wedium_review_aggregations(result_score, data, reviewer_ids, calculated_at)",
    )
    .in("post_hash", postHashes);

  if (error) {
    console.error("Failed to read Wedium aggregations:", error);
    return errorResponse(500, "internal_error", "Internal server error");
  }

  const byPostHash = new Map(
    ((data ?? []) as unknown as AggregationJoin[]).map((row) => [
      row.post_hash,
      row.aggregation,
    ]),
  );
  const results = [];
  const missingPostHashes = [];

  for (const postHash of postHashes) {
    const aggregation = byPostHash.get(postHash);
    if (!aggregation) {
      missingPostHashes.push(postHash);
      continue;
    }

    const resultScore = Number(aggregation.result_score);
    const resultLevel = scoreToLevel(resultScore);
    results.push({
      post_hash: postHash,
      review_count: aggregation.reviewer_ids.length,
      result_score: resultScore,
      result_level: resultLevel,
      result_code: levelToResultCode(resultLevel),
      data: aggregation.data,
      calculated_at: aggregation.calculated_at,
    });
  }

  return jsonResponse({
    results,
    missing_post_hashes: missingPostHashes,
  });
}

async function handlePutReview(
  request: Request,
  supabase: WediumClient,
  userHash: string,
  postHash: string,
): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = putWediumReviewBodySchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(
      422,
      "validation_error",
      "Invalid review",
      parsed.error.issues,
    );
  }

  const [userResult, postResult] = await Promise.all([
    supabase
      .from("wedium_users")
      .upsert({ user_hash: userHash }, { onConflict: "user_hash" })
      .select("id")
      .single(),
    supabase
      .from("wedium_posts")
      .upsert({ post_hash: postHash }, { onConflict: "post_hash" })
      .select("id")
      .single(),
  ]);

  if (userResult.error || postResult.error) {
    console.error(
      "Failed to resolve Wedium user or post:",
      userResult.error ?? postResult.error,
    );
    return errorResponse(500, "internal_error", "Internal server error");
  }

  const timestamp = new Date().toISOString();
  const { data: review, error } = await supabase
    .from("wedium_reviews")
    .upsert({
      reviewed_by: userResult.data.id,
      post_id: postResult.data.id,
      data: parsed.data.answers as never,
      submitted_at: timestamp,
      updated_at: timestamp,
    }, { onConflict: "post_id,reviewed_by" })
    .select("submitted_at, updated_at")
    .single();

  if (error) {
    console.error("Failed to save Wedium review:", error);
    return errorResponse(500, "internal_error", "Internal server error");
  }

  return jsonResponse({
    saved: true,
    submitted_at: review.submitted_at,
    updated_at: review.updated_at,
  });
}

async function handleGetReview(
  supabase: WediumClient,
  userHash: string,
  postHash: string,
): Promise<Response> {
  const [user, post] = await Promise.all([
    findUserId(supabase, userHash),
    findPostId(supabase, postHash),
  ]);

  if (!user || !post) {
    return errorResponse(404, "not_found", "Review not found");
  }

  const { data: review, error } = await supabase
    .from("wedium_reviews")
    .select("data, submitted_at, updated_at")
    .eq("reviewed_by", user.id)
    .eq("post_id", post.id)
    .maybeSingle();

  if (error) throw error;
  if (!review) {
    return errorResponse(404, "not_found", "Review not found");
  }

  return jsonResponse({
    post_hash: postHash,
    answers: review.data,
    submitted_at: review.submitted_at,
    updated_at: review.updated_at,
  });
}

async function handleDeleteReview(
  supabase: WediumClient,
  userHash: string,
  postHash: string,
): Promise<Response> {
  const [user, post] = await Promise.all([
    findUserId(supabase, userHash),
    findPostId(supabase, postHash),
  ]);

  if (!user || !post) return jsonResponse({ deleted: false });

  const { data, error } = await supabase
    .from("wedium_reviews")
    .delete()
    .eq("reviewed_by", user.id)
    .eq("post_id", post.id)
    .select("id");

  if (error) throw error;
  return jsonResponse({ deleted: (data?.length ?? 0) > 0 });
}

async function handleGetUser(
  supabase: WediumClient,
  userHash: string,
): Promise<Response> {
  const { data: user, error: userError } = await supabase
    .from("wedium_users")
    .select("id, created_at")
    .eq("user_hash", userHash)
    .maybeSingle();

  if (userError) throw userError;
  if (!user) {
    return errorResponse(404, "not_found", "User not found");
  }

  const { data: reviews, count, error: reviewsError } = await supabase
    .from("wedium_reviews")
    .select("updated_at", { count: "exact" })
    .eq("reviewed_by", user.id)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (reviewsError) throw reviewsError;

  return jsonResponse({
    user_hash: userHash,
    review_count: count ?? 0,
    created_at: user.created_at,
    last_reviewed_at: reviews?.[0]?.updated_at ?? null,
  });
}

async function handleDeleteUser(
  supabase: WediumClient,
  userHash: string,
): Promise<Response> {
  const user = await findUserId(supabase, userHash);
  if (!user) {
    return jsonResponse({
      deleted: false,
      deleted_review_count: 0,
      affected_post_count: 0,
    });
  }

  const { count, error: countError } = await supabase
    .from("wedium_reviews")
    .select("id", { count: "exact", head: true })
    .eq("reviewed_by", user.id);

  if (countError) throw countError;

  const { data: deletedUsers, error: deleteError } = await supabase
    .from("wedium_users")
    .delete()
    .eq("id", user.id)
    .select("id");

  if (deleteError) throw deleteError;

  const deleted = (deletedUsers?.length ?? 0) > 0;
  const deletedReviewCount = deleted ? count ?? 0 : 0;

  return jsonResponse({
    deleted,
    deleted_review_count: deletedReviewCount,
    // The unique (post_id, reviewed_by) constraint means both counts match.
    affected_post_count: deletedReviewCount,
  });
}

Deno.serve(async (request) => {
  if (
    !isSecretValid(
      Deno.env.get("WEDIUM_API_KEY") ?? "",
      request.headers.get("x-api-key") ?? "",
    )
  ) {
    return errorResponse(401, "unauthorized", "Unauthorized");
  }

  const routeParts = getRouteParts(request.url);
  if (!routeParts) {
    return errorResponse(404, "not_found", "Endpoint not found");
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseSecretKey);

  try {
    if (routeParts.length === 1 && routeParts[0] === "review-aggregations") {
      if (request.method !== "POST") {
        return errorResponse(405, "method_not_allowed", "Method not allowed");
      }
      return await handleAggregationRequest(request, supabase);
    }

    if (
      routeParts.length === 4 && routeParts[0] === "users" &&
      routeParts[2] === "reviews"
    ) {
      const userHash = routeParts[1];
      const postHash = routeParts[3];
      const invalidHash = validateHash(userHash, "user_hash") ??
        validateHash(postHash, "post_hash");
      if (invalidHash) return invalidHash;

      if (request.method === "PUT") {
        return await handlePutReview(
          request,
          supabase,
          userHash,
          postHash,
        );
      }
      if (request.method === "GET") {
        return await handleGetReview(supabase, userHash, postHash);
      }
      if (request.method === "DELETE") {
        return await handleDeleteReview(supabase, userHash, postHash);
      }
      return errorResponse(405, "method_not_allowed", "Method not allowed");
    }

    if (routeParts.length === 2 && routeParts[0] === "users") {
      const userHash = routeParts[1];
      const invalidHash = validateHash(userHash, "user_hash");
      if (invalidHash) return invalidHash;

      if (request.method === "GET") {
        return await handleGetUser(supabase, userHash);
      }
      if (request.method === "DELETE") {
        return await handleDeleteUser(supabase, userHash);
      }
      return errorResponse(405, "method_not_allowed", "Method not allowed");
    }

    return errorResponse(404, "not_found", "Endpoint not found");
  } catch (error) {
    console.error("Unexpected Wedium API error:", error);
    return errorResponse(500, "internal_error", "Internal server error");
  }
});
