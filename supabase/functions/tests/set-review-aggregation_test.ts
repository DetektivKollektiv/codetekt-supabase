// supabase/functions/tests/set-review-aggregation_test.ts
import { assert, assertEquals, assertExists } from "jsr:@std/assert@1";
import { createClient } from "npm:@supabase/supabase-js@2";

// Load environment variables
import "jsr:@std/dotenv/load";

// Configuration
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "http://127.0.0.1:54321";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const testCaseId = Deno.env.get("TEST_CASE_ID") ??
  "11111111-1111-4111-8111-111111111111";

// Test user UUIDs from seed data
const TEST_USER_GORM = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const TEST_USER_VALENTIN = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const TEST_USER_CUNEYT = "cccccccc-cccc-cccc-cccc-cccccccccccc";

// Helper to create service role client
const createServiceRoleClient = () => {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
};

// Helper to invoke edge function without auth
const invokeAggregation = async (case_id: string) => {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/set-review-aggregation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ case_id }),
    },
  );

  const data = await response.json();
  return { response, data };
};

// Test 1: Success - Aggregate 2 reviews
Deno.test({
  name: "set-review-aggregation - successfully aggregates 2 reviews",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // Verify test case has at least 2 submitted reviews
    const { data: reviews, error: reviewsError } = await supabase
      .from("review_answers_submitted")
      .select("reviewed_by")
      .eq("case_id", testCaseId);

    assert(!reviewsError, `Failed to fetch reviews: ${reviewsError?.message}`);
    assert(
      reviews && reviews.length >= 2,
      `Test case needs at least 2 reviews, found ${reviews?.length ?? 0}`,
    );

    // Call aggregation function
    const { response, data } = await invokeAggregation(testCaseId);

    assertEquals(response.status, 200, `Expected 200, got ${response.status}`);
    assertEquals(data.success, true);

    // Verify aggregation was saved to database
    const { data: aggregation, error: aggError } = await supabase
      .from("review_aggregations")
      .select("*")
      .eq("case_id", testCaseId)
      .single();

    assert(!aggError, `Failed to fetch aggregation: ${aggError?.message}`);
    assertExists(aggregation, "Aggregation not found in database");
    assertExists(aggregation.result_score, "result_score not set");
    assertExists(aggregation.reviewer_ids, "reviewer_ids not set");
    assertExists(aggregation.calculated_at, "calculated_at not set");
    assertEquals(
      aggregation.reviewer_ids.length,
      reviews.length,
      "reviewer_ids length mismatch",
    );

    console.log("✓ Successfully aggregated 2+ reviews");
  },
});

// Test 2: Success - Idempotency (call twice, verify upsert)
Deno.test({
  name: "set-review-aggregation - idempotent upsert behavior",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // First call
    const { response: response1, data: data1 } = await invokeAggregation(
      testCaseId,
    );
    assertEquals(response1.status, 200);
    assertEquals(data1.success, true);

    // Get first aggregation timestamp
    const { data: agg1 } = await supabase
      .from("review_aggregations")
      .select("calculated_at, result_score")
      .eq("case_id", testCaseId)
      .single();

    assertExists(agg1, "First aggregation not found");
    const firstTimestamp = agg1.calculated_at;
    const firstScore = agg1.result_score;

    // Wait a bit to ensure timestamp would change
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Second call (should upsert)
    const { response: response2, data: data2 } = await invokeAggregation(
      testCaseId,
    );
    assertEquals(response2.status, 200);
    assertEquals(data2.success, true);

    // Verify aggregation was updated (not duplicated)
    const { data: agg2, error: agg2Error } = await supabase
      .from("review_aggregations")
      .select("calculated_at, result_score")
      .eq("case_id", testCaseId)
      .single();

    assert(!agg2Error, "Second aggregation fetch failed");
    assertExists(agg2, "Second aggregation not found");

    // Verify timestamp was updated
    assert(
      agg2.calculated_at !== firstTimestamp,
      "calculated_at should be updated on re-aggregation",
    );

    // Verify result_score is same (data hasn't changed)
    assertEquals(
      agg2.result_score,
      firstScore,
      "result_score should remain consistent",
    );

    console.log("✓ Idempotent upsert behavior verified");
  },
});

// Test 3: Error - Invalid case_id format
Deno.test("set-review-aggregation - rejects invalid case_id format", async () => {
  const { response, data } = await invokeAggregation("not-a-uuid");

  assertEquals(response.status, 400);
  assertEquals(data.error, "Invalid request payload");
  assertExists(data.details, "Error details not provided");

  console.log("✓ Invalid case_id rejected with 400");
});

// Test 4: Error - Missing case_id
Deno.test("set-review-aggregation - rejects missing case_id", async () => {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/set-review-aggregation`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  const data = await response.json();

  assertEquals(response.status, 400);
  assertEquals(data.error, "Invalid request payload");
  assertExists(data.details, "Error details not provided");

  console.log("✓ Missing case_id rejected with 400");
});

// Test 5: Error - Below threshold (0 reviews)
Deno.test({
  name: "set-review-aggregation - rejects case with 0 reviews",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // Create a test case with no reviews
    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "http://example.com/no-reviews",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError, `Failed to create test case: ${caseError?.message}`);
    assertExists(newCase, "Test case not created");

    try {
      const { response, data } = await invokeAggregation(newCase.id);

      assertEquals(response.status, 400);
      assertEquals(data.error, "Insufficient reviews for aggregation");
      assertEquals(data.review_count, 0);
      assertEquals(data.required_count, 2);
      assertExists(data.details, "Error details not provided");

      console.log("✓ Case with 0 reviews rejected with 400");
    } finally {
      // Cleanup: Delete test case
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});

// Test 6: Error - Below threshold (1 review)
Deno.test({
  name: "set-review-aggregation - rejects case with 1 review",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // Create a test case
    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "http://example.com/one-review",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError, `Failed to create test case: ${caseError?.message}`);
    assertExists(newCase, "Test case not created");

    try {
      // Add one submitted review
      const { error: reviewError } = await supabase
        .from("review_answers_submitted")
        .insert({
          case_id: newCase.id,
          reviewed_by: TEST_USER_GORM,
          data: {
            grammar: 2,
            structure: 2,
            headline: 2,
            objectivity: 2,
            perspectives: 2,
            external_sources: 2,
            claims_match_sources: 2,
            public_media_match: 2,
            author_credentials: 2,
            images_quality: 2,
            additional_rating: 3,
            keyword_type: ["Test"],
            content_type: ["nachrichtenartikel"],
          },
        });

      assert(!reviewError, `Failed to create review: ${reviewError?.message}`);

      // Try to aggregate
      const { response, data } = await invokeAggregation(newCase.id);

      assertEquals(response.status, 400);
      assertEquals(data.error, "Insufficient reviews for aggregation");
      assertEquals(data.review_count, 1);
      assertEquals(data.required_count, 2);

      console.log("✓ Case with 1 review rejected with 400");
    } finally {
      // Cleanup: Delete test case (cascade deletes reviews)
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});

// Test 7: Success - Aggregate 3+ reviews
Deno.test({
  name: "set-review-aggregation - successfully aggregates 3+ reviews",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // Create a test case
    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "http://example.com/three-reviews",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError, `Failed to create test case: ${caseError?.message}`);
    assertExists(newCase, "Test case not created");

    try {
      // Add three submitted reviews with different scores
      const reviews = [
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_GORM,
          data: {
            grammar: 3,
            structure: 3,
            headline: 3,
            objectivity: 3,
            perspectives: 3,
            external_sources: 3,
            claims_match_sources: 3,
            public_media_match: 3,
            author_credentials: 3,
            images_quality: 3,
            additional_rating: 3,
            keyword_type: ["Test"],
            content_type: ["nachrichtenartikel"],
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_VALENTIN,
          data: {
            grammar: 2,
            structure: 2,
            headline: 2,
            objectivity: 2,
            perspectives: 2,
            external_sources: 2,
            claims_match_sources: 2,
            public_media_match: 2,
            author_credentials: 2,
            images_quality: 2,
            additional_rating: 3,
            keyword_type: ["Test"],
            content_type: ["nachrichtenartikel"],
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_CUNEYT,
          data: {
            grammar: 3,
            structure: 3,
            headline: 2,
            objectivity: 2,
            perspectives: 2,
            external_sources: 2,
            claims_match_sources: 2,
            public_media_match: 2,
            author_credentials: 2,
            images_quality: 2,
            additional_rating: 3,
            keyword_type: ["Test"],
            content_type: ["nachrichtenartikel"],
          },
        },
      ];

      const { error: reviewsError } = await supabase
        .from("review_answers_submitted")
        .insert(reviews);

      assert(
        !reviewsError,
        `Failed to create reviews: ${reviewsError?.message}`,
      );

      // Aggregate
      const { response, data } = await invokeAggregation(newCase.id);

      assertEquals(response.status, 200);
      assertEquals(data.success, true);

      // Verify aggregation
      const { data: aggregation, error: aggError } = await supabase
        .from("review_aggregations")
        .select("*")
        .eq("case_id", newCase.id)
        .single();

      assert(!aggError, `Failed to fetch aggregation: ${aggError?.message}`);
      assertExists(aggregation, "Aggregation not found");
      assertEquals(aggregation.reviewer_ids.length, 3);

      // Verify result_score is calculated correctly
      // Grammar: (3+2+3)/3 = 2.67
      // Structure: (3+2+3)/3 = 2.67
      // Others: (3+2+2)/3 = 2.33, (2+2+2)/3 = 2.0
      // Result score should be average of all field averages
      assert(
        aggregation.result_score > 2.0 && aggregation.result_score < 3.0,
        `Expected result_score between 2.0 and 3.0, got ${aggregation.result_score}`,
      );

      console.log(
        `✓ Successfully aggregated 3 reviews, result_score: ${aggregation.result_score}`,
      );
    } finally {
      // Cleanup: Delete test case (cascade deletes reviews and aggregation)
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});
