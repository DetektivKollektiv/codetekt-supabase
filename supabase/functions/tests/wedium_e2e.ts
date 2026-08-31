import { assert, assertEquals } from "jsr:@std/assert@1";

const API = Deno.env.get("SUPABASE_API_URL") ?? "http://127.0.0.1:54321";
const WEDIUM_API_KEY = readRequiredEnv("WEDIUM_API_KEY");

const USER_A = "a".repeat(64);
const USER_B = "b".repeat(64);
const POST_A = "c".repeat(64);

function readRequiredEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

type ApiResponse = {
  status: number;
  data: Record<string, unknown>;
};

async function apiRequest(
  method: string,
  path: string,
  body?: unknown,
  apiKey = WEDIUM_API_KEY,
): Promise<ApiResponse> {
  const response = await fetch(`${API}/functions/v1/wedium${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  return { status: response.status, data };
}

function answers(overrides: Record<string, number> = {}) {
  return {
    placeholder_question_1: 0,
    placeholder_question_2: 0,
    placeholder_question_3: 0,
    placeholder_question_4: 0,
    placeholder_question_5: 0,
    ...overrides,
  };
}

async function waitForAggregation(
  expectedScore: number,
  timeoutMilliseconds = 10_000,
): Promise<Record<string, unknown>> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMilliseconds) {
    const response = await apiRequest("POST", "/review-aggregations", {
      post_hashes: [POST_A],
    });
    const results = response.data.results as Record<string, unknown>[];
    if (results?.[0]?.result_score === expectedScore) return results[0];
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Timed out waiting for result_score ${expectedScore}`);
}

Deno.test({
  name: "Wedium API review, aggregation, and deletion flow",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    await apiRequest("DELETE", `/users/${USER_A}`);
    await apiRequest("DELETE", `/users/${USER_B}`);

    const unauthorized = await apiRequest(
      "POST",
      "/review-aggregations",
      { post_hashes: [POST_A] },
      "wrong-key",
    );
    assertEquals(unauthorized.status, 401);

    const invalidReview = await apiRequest(
      "PUT",
      `/users/${USER_A}/reviews/${POST_A}`,
      { answers: { placeholder_question_1: 0 } },
    );
    assertEquals(invalidReview.status, 422);

    const firstReview = await apiRequest(
      "PUT",
      `/users/${USER_A}/reviews/${POST_A}`,
      {
        answers: answers({
          placeholder_question_1: 0,
          placeholder_question_2: 4,
        }),
      },
    );
    assertEquals(firstReview.status, 200);
    assertEquals(firstReview.data.saved, true);
    const firstSubmittedAt = firstReview.data.submitted_at;

    const storedReview = await apiRequest(
      "GET",
      `/users/${USER_A}/reviews/${POST_A}`,
    );
    assertEquals(storedReview.status, 200);
    assertEquals(
      (storedReview.data.answers as Record<string, number>)
        .placeholder_question_2,
      4,
    );

    const user = await apiRequest("GET", `/users/${USER_A}`);
    assertEquals(user.status, 200);
    assertEquals(user.data.review_count, 1);
    assert(typeof user.data.last_reviewed_at === "string");
    const firstUserCreatedAt = user.data.created_at;

    const missingAggregation = await apiRequest(
      "POST",
      "/review-aggregations",
      { post_hashes: [POST_A] },
    );
    assertEquals(missingAggregation.status, 200);
    assertEquals(missingAggregation.data.results, []);
    assertEquals(missingAggregation.data.missing_post_hashes, [POST_A]);

    const secondReview = await apiRequest(
      "PUT",
      `/users/${USER_B}/reviews/${POST_A}`,
      {
        answers: answers({
          placeholder_question_1: 2,
          placeholder_question_2: 2,
        }),
      },
    );
    assertEquals(secondReview.status, 200);

    const firstAggregation = await waitForAggregation(1);
    assertEquals(firstAggregation.review_count, 2);
    assertEquals(firstAggregation.result_level, 1);
    assertEquals(firstAggregation.result_code, "rather_trustworthy");

    const questions = (firstAggregation.data as {
      questions: Array<{ id: string }>;
    }).questions;
    assertEquals(
      questions.some(({ id }) => id === "placeholder_question_2"),
      false,
    );

    const updatedReview = await apiRequest(
      "PUT",
      `/users/${USER_A}/reviews/${POST_A}`,
      {
        answers: answers({
          placeholder_question_1: 3,
          placeholder_question_2: 4,
        }),
      },
    );
    assertEquals(updatedReview.status, 200);
    assert(updatedReview.data.submitted_at !== firstSubmittedAt);
    const updatedAggregation = await waitForAggregation(2.5);
    assertEquals(updatedAggregation.result_level, 3);
    assertEquals(updatedAggregation.result_code, "not_trustworthy");

    const updatedUser = await apiRequest("GET", `/users/${USER_A}`);
    assertEquals(updatedUser.data.created_at, firstUserCreatedAt);
    assertEquals(
      updatedUser.data.last_reviewed_at,
      updatedReview.data.updated_at,
    );

    const missingBefore = "d".repeat(64);
    const missingAfter = "e".repeat(64);
    const mixedBatch = await apiRequest("POST", "/review-aggregations", {
      post_hashes: [missingBefore, POST_A, missingAfter],
    });
    assertEquals(
      (mixedBatch.data.results as Record<string, unknown>[])[0].post_hash,
      POST_A,
    );
    assertEquals(mixedBatch.data.missing_post_hashes, [
      missingBefore,
      missingAfter,
    ]);

    const duplicateBatch = await apiRequest(
      "POST",
      "/review-aggregations",
      { post_hashes: [POST_A, POST_A] },
    );
    assertEquals(duplicateBatch.status, 422);

    const hundredMissingHashes = Array.from(
      { length: 100 },
      (_, index) => index.toString(16).padStart(64, "0"),
    );
    const fullBatch = await apiRequest("POST", "/review-aggregations", {
      post_hashes: hundredMissingHashes,
    });
    assertEquals(fullBatch.status, 200);
    assertEquals(
      (fullBatch.data.missing_post_hashes as string[]).length,
      100,
    );

    const deleteReview = await apiRequest(
      "DELETE",
      `/users/${USER_A}/reviews/${POST_A}`,
    );
    assertEquals(deleteReview.status, 200);
    assertEquals(deleteReview.data.deleted, true);

    const immediatelyMissing = await apiRequest(
      "POST",
      "/review-aggregations",
      { post_hashes: [POST_A] },
    );
    assertEquals(immediatelyMissing.data.results, []);
    assertEquals(immediatelyMissing.data.missing_post_hashes, [POST_A]);

    const repeatedDelete = await apiRequest(
      "DELETE",
      `/users/${USER_A}/reviews/${POST_A}`,
    );
    assertEquals(repeatedDelete.data.deleted, false);

    const userAfterReviewDelete = await apiRequest("GET", `/users/${USER_A}`);
    assertEquals(userAfterReviewDelete.status, 200);
    assertEquals(userAfterReviewDelete.data.review_count, 0);
    assertEquals(userAfterReviewDelete.data.last_reviewed_at, null);

    const deleteUserB = await apiRequest("DELETE", `/users/${USER_B}`);
    assertEquals(deleteUserB.data, {
      deleted: true,
      deleted_review_count: 1,
      affected_post_count: 1,
    });

    const repeatedUserDelete = await apiRequest("DELETE", `/users/${USER_B}`);
    assertEquals(repeatedUserDelete.data, {
      deleted: false,
      deleted_review_count: 0,
      affected_post_count: 0,
    });

    const deleteUserA = await apiRequest("DELETE", `/users/${USER_A}`);
    assertEquals(deleteUserA.data.deleted, true);
    assertEquals(deleteUserA.data.deleted_review_count, 0);
  },
});
