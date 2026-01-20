// supabase/functions/tests/set-review-aggregation_test.ts
// Run with: deno test --allow-net --allow-env --allow-read supabase/functions/tests/set-review-aggregation_test.ts
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

    // Verify new aggregation structure
    assertExists(aggregation.data.questions, "questions array not set");
    assert(
      Array.isArray(aggregation.data.questions),
      "questions should be an array",
    );
    assert(
      aggregation.data.questions.length > 0,
      "questions array should not be empty",
    );
    assertExists(aggregation.data.metadata, "metadata not set");
    assertExists(aggregation.data.metadata.title, "metadata.title not set");
    assertExists(
      aggregation.data.metadata.keyword_type,
      "metadata.keyword_type not set",
    );
    assertExists(
      aggregation.data.metadata.content_type,
      "metadata.content_type not set",
    );

    // Verify question structure
    const firstQuestion = aggregation.data.questions[0];
    assertExists(firstQuestion.id, "question.id not set");
    assertExists(firstQuestion.metadata, "question.metadata not set");
    assertExists(firstQuestion.fields, "question.fields not set");
    assert(
      Array.isArray(firstQuestion.fields),
      "question.fields should be an array",
    );

    // Verify field structure
    if (firstQuestion.fields.length > 0) {
      const firstField = firstQuestion.fields[0];
      assertExists(firstField.id, "field.id not set");
      assertExists(firstField.type, "field.type not set");
      assertExists(firstField.question, "field.question not set");
      assertExists(firstField.counts, "field.counts not set");
      assertExists(firstField.percentages, "field.percentages not set");
      assertExists(firstField.average, "field.average not set");
      assertExists(
        firstField.tags,
        "field.tags not set (should replace warnings)",
      );
      assert(
        typeof firstField.tags === "object",
        "field.tags should be an object",
      );
      assertExists(firstField.tags["0"], "field.tags should have value for 0");
      assertExists(firstField.tags["3"], "field.tags should have value for 3");
    }

    console.log("✓ Successfully aggregated 2+ reviews with new structure");
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
      assertEquals(data.error, "Insufficient valid reviews for aggregation");
      assertEquals(data.valid_review_count, 0);
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
            title: "Test Title",
            content_accuracy: 2,
            content_sources: 2,
            content_language: 2,
            content_clarity: 2,
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
            additional_comment: null,
            keyword_type: ["Test"],
            content_type: ["nachrichtenartikel"],
          },
        });

      assert(!reviewError, `Failed to create review: ${reviewError?.message}`);

      // Try to aggregate
      const { response, data } = await invokeAggregation(newCase.id);

      assertEquals(response.status, 400);
      assertEquals(data.error, "Insufficient valid reviews for aggregation");
      assertEquals(data.valid_review_count, 1);
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
            title: "Test Title",
            content_accuracy: 3,
            content_sources: 3,
            content_language: 3,
            content_clarity: 3,
            content_references: 3,
            content_logic: 3,
            content_advertising: 3,
            additional_rating: 3,
            additional_comment: null,
            keyword_type: ["Test"],
            content_type: ["nachrichtenartikel"],
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_VALENTIN,
          data: {
            title: "Test Title",
            content_accuracy: 2,
            content_sources: 2,
            content_language: 2,
            content_clarity: 2,
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
            additional_comment: null,
            keyword_type: ["Test"],
            content_type: ["nachrichtenartikel"],
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_CUNEYT,
          data: {
            title: "Test Title",
            content_accuracy: 3,
            content_sources: 3,
            content_language: 2,
            content_clarity: 2,
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
            additional_comment: null,
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

// Test 8: Resolved Disputes Override Aggregated Metadata
Deno.test({
  name:
    "set-review-aggregation - resolved disputes override aggregated metadata",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // Create a test case
    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "http://example.com/dispute-test",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError, `Failed to create test case: ${caseError?.message}`);
    assertExists(newCase, "Test case not created");

    try {
      // Add two submitted reviews with initial metadata
      const reviews = [
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_GORM,
          data: {
            title: "Test Title",
            content_accuracy: 3,
            content_sources: 3,
            content_language: 3,
            content_clarity: 3,
            content_references: 3,
            content_logic: 3,
            content_advertising: 3,
            additional_rating: 3,
            additional_comment: null,
            keyword_type: ["Politik", "Deutschland"],
            content_type: ["nachrichtenartikel"],
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_VALENTIN,
          data: {
            title: "Test Title",
            content_accuracy: 2,
            content_sources: 2,
            content_language: 2,
            content_clarity: 2,
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
            additional_comment: null,
            keyword_type: ["Deutschland", "Bundestag"],
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

      // First aggregation - no disputes
      const { response: response1, data: data1 } = await invokeAggregation(
        newCase.id,
      );

      assertEquals(response1.status, 200);
      assertEquals(data1.success, true);

      // Verify initial aggregation
      const { data: agg1 } = await supabase
        .from("review_aggregations")
        .select("data")
        .eq("case_id", newCase.id)
        .single();

      assertExists(agg1, "First aggregation not found");
      const metadata1 = agg1.data.metadata;

      // Verify aggregated keywords include all unique keywords
      assert(
        Array.isArray(metadata1.keyword_type),
        "keyword_type should be an array",
      );
      assertEquals(
        metadata1.keyword_type.sort(),
        ["Bundestag", "Deutschland", "Politik"].sort(),
        "Initial keywords should be merged from all reviews",
      );
      assertEquals(
        metadata1.content_type,
        ["nachrichtenartikel"],
        "Initial content_type should be from first review",
      );
      assertExists(
        metadata1.title,
        "metadata.title should be set from first review",
      );

      console.log("✓ Initial aggregation without disputes verified");

      // Create resolved disputes using service role
      // Dispute 1: Change title
      const { error: titleDisputeError } = await supabase
        .from("review_disputes")
        .insert({
          case_id: newCase.id,
          template_version: 1,
          field_id: "title",
          original_value: JSON.stringify("Test Title"),
          disputed_by: TEST_USER_CUNEYT,
          reason: "Besserer Titel",
          resolved_by: TEST_USER_GORM, // Admin
          resolution: "changed",
          final_value: JSON.stringify("Admin Approved Title"),
          resolved_at: new Date().toISOString(),
        });

      assert(
        !titleDisputeError,
        `Failed to create title dispute: ${titleDisputeError?.message}`,
      );

      // Dispute 2: Change keyword_type
      const { error: dispute1Error } = await supabase
        .from("review_disputes")
        .insert({
          case_id: newCase.id,
          template_version: 1,
          field_id: "keyword_type",
          original_value: JSON.stringify([
            "Politik",
            "Deutschland",
            "Bundestag",
          ]),
          disputed_by: TEST_USER_CUNEYT,
          reason: "Wichtige Schlagwörter fehlen",
          resolved_by: TEST_USER_GORM, // Admin
          resolution: "changed",
          final_value: JSON.stringify([
            "Politik",
            "Deutschland",
            "Bundesregierung",
          ]), // Changed keywords
          resolved_at: new Date().toISOString(),
        });

      assert(
        !dispute1Error,
        `Failed to create keyword dispute: ${dispute1Error?.message}`,
      );

      // Dispute 3: Change content_type
      const { error: dispute2Error } = await supabase
        .from("review_disputes")
        .insert({
          case_id: newCase.id,
          template_version: 1,
          field_id: "content_type",
          original_value: JSON.stringify(["nachrichtenartikel"]),
          disputed_by: TEST_USER_CUNEYT,
          reason: "Dies ist ein Kommentar",
          resolved_by: TEST_USER_GORM, // Admin
          resolution: "changed",
          final_value: JSON.stringify(["kommentar"]), // Changed content type
          resolved_at: new Date().toISOString(),
        });

      assert(
        !dispute2Error,
        `Failed to create content_type dispute: ${dispute2Error?.message}`,
      );

      console.log("✓ Created three resolved disputes (all changed)");

      // Second aggregation - with disputes
      const { response: response2, data: data2 } = await invokeAggregation(
        newCase.id,
      );

      assertEquals(response2.status, 200);
      assertEquals(data2.success, true);

      // Verify aggregation now reflects admin's final values
      const { data: agg2 } = await supabase
        .from("review_aggregations")
        .select("data")
        .eq("case_id", newCase.id)
        .single();

      assertExists(agg2, "Second aggregation not found");
      const metadata2 = agg2.data.metadata;

      // Verify title uses admin's final_value
      assertEquals(
        metadata2.title,
        "Admin Approved Title",
        "Title should reflect admin's final_value from dispute",
      );

      // Verify keyword_type uses admin's final_value (not aggregated keywords)
      assertEquals(
        metadata2.keyword_type.sort(),
        ["Bundesregierung", "Deutschland", "Politik"].sort(),
        "Keywords should reflect admin's final_value from dispute",
      );

      // Verify content_type uses admin's final_value
      assertEquals(
        metadata2.content_type,
        ["kommentar"],
        "Content type should reflect admin's final_value from dispute",
      );

      console.log(
        "✓ Aggregation with resolved disputes verified - admin decisions override aggregated values",
      );

      // Test 'original_kept' resolution
      // Delete the keyword dispute and create one with 'original_kept'
      await supabase
        .from("review_disputes")
        .delete()
        .eq("case_id", newCase.id)
        .eq("field_id", "keyword_type");

      const { error: dispute3Error } = await supabase
        .from("review_disputes")
        .insert({
          case_id: newCase.id,
          template_version: 1,
          field_id: "keyword_type",
          original_value: JSON.stringify([
            "Politik",
            "Deutschland",
            "Bundestag",
          ]),
          disputed_by: TEST_USER_CUNEYT,
          reason: "Keywords prüfen",
          resolved_by: TEST_USER_GORM,
          resolution: "original_kept",
          final_value: JSON.stringify([
            "Bundestag",
            "Deutschland",
            "Politik",
          ]), // Keep original
          resolved_at: new Date().toISOString(),
        });

      assert(
        !dispute3Error,
        `Failed to create original_kept dispute: ${dispute3Error?.message}`,
      );

      // Third aggregation
      const { response: response3, data: data3 } = await invokeAggregation(
        newCase.id,
      );

      assertEquals(response3.status, 200);
      assertEquals(data3.success, true);

      const { data: agg3 } = await supabase
        .from("review_aggregations")
        .select("data")
        .eq("case_id", newCase.id)
        .single();

      assertExists(agg3, "Third aggregation not found");
      const metadata3 = agg3.data.metadata;

      // Verify keyword_type uses admin's final_value even for 'original_kept'
      assertEquals(
        metadata3.keyword_type.sort(),
        ["Bundestag", "Deutschland", "Politik"].sort(),
        "Keywords should still use admin's final_value for 'original_kept'",
      );

      console.log(
        "✓ 'original_kept' resolution also applies admin's final_value",
      );
    } finally {
      // Cleanup: Delete test case (cascade deletes reviews, disputes, and aggregation)
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});

// Test 9: Conditional validation - content_type "neutral" requires content_accuracy
Deno.test({
  name:
    "set-review-aggregation - filters out reviews missing content_accuracy for neutral content",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // Create a test case
    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "http://example.com/neutral-validation",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError, `Failed to create test case: ${caseError?.message}`);
    assertExists(newCase, "Test case not created");

    try {
      // Add three reviews: 2 valid, 1 invalid (neutral without content_accuracy)
      const reviews = [
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_GORM,
          data: {
            title: "Valid Review 1",
            keyword_type: ["Test"],
            content_type: ["neutral"],
            content_accuracy: 2, // Required for neutral
            content_sources: 2,
            content_language: 2,
            content_clarity: 2,
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_VALENTIN,
          data: {
            title: "Invalid Review - Missing content_accuracy",
            keyword_type: ["Test"],
            content_type: ["neutral"],
            // content_accuracy missing - INVALID
            content_sources: 2,
            content_language: 2,
            content_clarity: 2,
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_CUNEYT,
          data: {
            title: "Valid Review 2",
            keyword_type: ["Test"],
            content_type: ["neutral"],
            content_accuracy: 3, // Required for neutral
            content_sources: 3,
            content_language: 3,
            content_clarity: 3,
            content_references: 3,
            content_logic: 3,
            content_advertising: 3,
            additional_rating: 3,
          },
        },
      ];

      // Insert reviews directly (bypassing validation)
      const { error: reviewsError } = await supabase
        .from("review_answers_submitted")
        .insert(reviews);

      assert(
        !reviewsError,
        `Failed to insert reviews: ${reviewsError?.message}`,
      );

      // Aggregate - should succeed with 2 valid reviews
      const { response, data } = await invokeAggregation(newCase.id);

      assertEquals(response.status, 200);
      assertEquals(data.success, true);

      // Verify aggregation details
      const { data: aggregation } = await supabase
        .from("review_aggregations")
        .select("*")
        .eq("case_id", newCase.id)
        .single();

      assertExists(aggregation);
      assertEquals(
        aggregation.reviewer_ids.length,
        2,
        "Should only include 2 valid reviews",
      );

      console.log(
        "✓ Invalid review (neutral without content_accuracy) filtered out, aggregation successful with 2 valid reviews",
      );
    } finally {
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});

// Test 10: Conditional validation - content_type "opinion" requires content_sources
Deno.test({
  name:
    "set-review-aggregation - filters out reviews missing content_sources for opinion content",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "http://example.com/opinion-validation",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError);
    assertExists(newCase);

    try {
      const reviews = [
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_GORM,
          data: {
            title: "Valid Opinion Review",
            keyword_type: ["Test"],
            content_type: ["opinion"],
            content_sources: 2, // Required for opinion
            content_language: 2,
            content_clarity: 2,
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_VALENTIN,
          data: {
            title: "Invalid Opinion Review",
            keyword_type: ["Test"],
            content_type: ["opinion"],
            // content_sources missing - INVALID
            content_language: 2,
            content_clarity: 2,
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_CUNEYT,
          data: {
            title: "Another Valid Review",
            keyword_type: ["Test"],
            content_type: ["opinion"],
            content_sources: 3, // Required for opinion
            content_language: 3,
            content_clarity: 3,
            content_references: 3,
            content_logic: 3,
            content_advertising: 3,
            additional_rating: 3,
          },
        },
      ];

      const { error: reviewsError } = await supabase
        .from("review_answers_submitted")
        .insert(reviews);

      assert(!reviewsError);

      const { response, data } = await invokeAggregation(newCase.id);

      assertEquals(response.status, 200);
      assertEquals(data.success, true);

      const { data: aggregation } = await supabase
        .from("review_aggregations")
        .select("reviewer_ids")
        .eq("case_id", newCase.id)
        .single();

      assertEquals(aggregation!.reviewer_ids.length, 2);

      console.log(
        "✓ Invalid review (opinion without content_sources) filtered out",
      );
    } finally {
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});

// Test 11: Conditional validation - additional_rating < 3 requires additional_comment
Deno.test({
  name:
    "set-review-aggregation - filters out reviews with low rating but missing comment",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "http://example.com/rating-validation",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError);
    assertExists(newCase);

    try {
      const reviews = [
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_GORM,
          data: {
            title: "Valid Low Rating Review",
            keyword_type: ["Test"],
            content_type: ["nachrichtenartikel"],
            additional_rating: 2, // Low rating
            additional_comment: "This is why it's low rated", // Comment provided - VALID
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_VALENTIN,
          data: {
            title: "Invalid Low Rating Review",
            keyword_type: ["Test"],
            content_type: ["nachrichtenartikel"],
            additional_rating: 1, // Low rating
            // additional_comment missing - INVALID
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_CUNEYT,
          data: {
            title: "Valid High Rating Review",
            keyword_type: ["Test"],
            content_type: ["nachrichtenartikel"],
            additional_rating: 3, // High rating - no comment needed
          },
        },
      ];

      const { error: reviewsError } = await supabase
        .from("review_answers_submitted")
        .insert(reviews);

      assert(!reviewsError);

      const { response, data } = await invokeAggregation(newCase.id);

      assertEquals(response.status, 200);
      assertEquals(data.success, true);

      const { data: aggregation } = await supabase
        .from("review_aggregations")
        .select("reviewer_ids")
        .eq("case_id", newCase.id)
        .single();

      assertEquals(aggregation!.reviewer_ids.length, 2);

      console.log("✓ Invalid review (low rating without comment) filtered out");
    } finally {
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});

// Test 12: Conditional validation - aggregation fails when too many reviews are invalid
Deno.test({
  name:
    "set-review-aggregation - fails when insufficient valid reviews after filtering",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "http://example.com/insufficient-valid",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError);
    assertExists(newCase);

    try {
      // Add 3 reviews, but only 1 is valid
      const reviews = [
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_GORM,
          data: {
            title: "Valid Review",
            keyword_type: ["Test"],
            content_type: ["nachrichtenartikel"],
            additional_rating: 3,
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_VALENTIN,
          data: {
            title: "Invalid - neutral without content_accuracy",
            keyword_type: ["Test"],
            content_type: ["neutral"],
            // Missing content_accuracy
            content_sources: 2,
            content_language: 2,
            content_clarity: 2,
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_CUNEYT,
          data: {
            title: "Invalid - low rating without comment",
            keyword_type: ["Test"],
            content_type: ["nachrichtenartikel"],
            additional_rating: 2,
            // Missing additional_comment
          },
        },
      ];

      const { error: reviewsError } = await supabase
        .from("review_answers_submitted")
        .insert(reviews);

      assert(!reviewsError);

      // Should fail - only 1 valid review
      const { response, data } = await invokeAggregation(newCase.id);

      assertEquals(response.status, 400);
      assertEquals(data.error, "Insufficient valid reviews for aggregation");
      assertEquals(data.valid_review_count, 1);
      assertEquals(data.invalid_review_count, 2);
      assertEquals(data.required_count, 2);
      assertExists(data.invalid_reviews);
      assertEquals(data.invalid_reviews.length, 2);

      console.log(
        "✓ Aggregation correctly fails when only 1 valid review remains after filtering",
      );
    } finally {
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});

// Test 13: Conditional validation - content_type "text_message" requires all content fields
Deno.test({
  name:
    "set-review-aggregation - filters out text_message reviews missing content fields",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "http://example.com/text-message-validation",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError);
    assertExists(newCase);

    try {
      const reviews = [
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_GORM,
          data: {
            title: "Valid text_message",
            keyword_type: ["Test"],
            content_type: ["text_message"],
            content_language: 2,
            content_clarity: 2,
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_VALENTIN,
          data: {
            title: "Invalid text_message - missing content_clarity",
            keyword_type: ["Test"],
            content_type: ["text_message"],
            content_language: 2,
            // content_clarity missing - INVALID
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_CUNEYT,
          data: {
            title: "Another valid text_message",
            keyword_type: ["Test"],
            content_type: ["text_message"],
            content_language: 3,
            content_clarity: 3,
            content_references: 3,
            content_logic: 3,
            content_advertising: 3,
            additional_rating: 3,
          },
        },
      ];

      const { error: reviewsError } = await supabase
        .from("review_answers_submitted")
        .insert(reviews);

      assert(!reviewsError);

      const { response, data } = await invokeAggregation(newCase.id);

      assertEquals(response.status, 200);
      assertEquals(data.success, true);

      const { data: aggregation } = await supabase
        .from("review_aggregations")
        .select("reviewer_ids")
        .eq("case_id", newCase.id)
        .single();

      assertEquals(aggregation!.reviewer_ids.length, 2);

      console.log(
        "✓ Invalid review (text_message without content_clarity) filtered out",
      );
    } finally {
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});
