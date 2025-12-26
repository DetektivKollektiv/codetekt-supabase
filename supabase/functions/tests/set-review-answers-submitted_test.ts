// supabase/functions/tests/set-review-answers-submitted_test.ts
import { assert, assertEquals, assertExists } from "jsr:@std/assert@1";
import { createClient } from "npm:@supabase/supabase-js@2";

// Load environment variables
import "jsr:@std/dotenv/load";

// Configuration
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "http://127.0.0.1:54321";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const testEmail = Deno.env.get("TEST_EMAIL") ?? "gorm-labenz@hotmail.com";
const testPassword = Deno.env.get("TEST_PASSWORD") ?? "testpassword123";
const testCaseId = Deno.env.get("TEST_CASE_ID") ??
  "11111111-1111-4111-8111-111111111111";

// Helper to create client with no auto-refresh
const createTestClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
};

// Helper to create complete review data
const createCompleteReviewData = (marker: string) => ({
  keyword_type: ["Ukraine", "Test"],
  content_type: ["nachrichtenartikel"],
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
  additional_comment: marker,
});

// Test 1: Successfully publish complete in-progress review
Deno.test("set-review-answers-submitted - publishes complete draft", async () => {
  const supabase = createTestClient();

  try {
    // Authenticate
    const { data: authData, error: authError } = await supabase.auth
      .signInWithPassword({ email: testEmail, password: testPassword });

    assert(!authError, `Authentication failed: ${authError?.message}`);
    const accessToken = authData.session!.access_token;
    const userId = authData.session!.user.id;

    const marker = `publish-test-${crypto.randomUUID()}`;

    // Step 1: Create in-progress review with complete data
    const inProgressPayload = {
      case_id: testCaseId,
      data: createCompleteReviewData(marker),
    };

    const { data: inProgressData, error: inProgressError } = await supabase
      .functions.invoke("set-review-answers-in-progress", {
        body: inProgressPayload,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

    assert(!inProgressError, "Failed to create in-progress review");
    assertEquals(inProgressData.saved, true);

    // Step 2: Get the in_progress_id
    const { data: inProgressReview, error: fetchError } = await supabase
      .from("review_answers_in_progress")
      .select("id, has_unpublished_changes, submitted_review_answers_id")
      .eq("case_id", testCaseId)
      .eq("reviewed_by", userId)
      .single();

    assert(!fetchError, "Failed to fetch in-progress review");
    assertExists(inProgressReview, "In-progress review not found");
    assertEquals(inProgressReview.has_unpublished_changes, true);

    // Step 3: Publish the draft
    const publishPayload = { in_progress_id: inProgressReview.id };
    const { data: publishData, error: publishError } = await supabase.functions
      .invoke("set-review-answers-submitted", {
        body: publishPayload,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

    assert(!publishError, `Publish failed: ${publishError?.message}`);
    assertEquals(publishData.saved, true);
    assertExists(publishData.review_id, "Review ID not returned");

    // Step 4: Verify submitted review in database
    const { data: submittedReview, error: submittedError } = await supabase
      .from("review_answers_submitted")
      .select("data, submitted_at")
      .eq("case_id", testCaseId)
      .eq("reviewed_by", userId)
      .single();

    assert(!submittedError, "Failed to fetch submitted review");
    assertExists(submittedReview, "Submitted review not found");
    assertExists(submittedReview.submitted_at, "submitted_at not set");

    const submittedData = submittedReview.data as Record<string, unknown>;
    assertEquals(submittedData.additional_comment, marker);

    // Step 5: Verify in-progress tracking updated
    const { data: updatedInProgress, error: updatedError } = await supabase
      .from("review_answers_in_progress")
      .select("has_unpublished_changes, submitted_review_answers_id")
      .eq("id", inProgressReview.id)
      .single();

    assert(!updatedError, "Failed to fetch updated in-progress");
    assertEquals(updatedInProgress.has_unpublished_changes, false);
    assertEquals(
      updatedInProgress.submitted_review_answers_id,
      publishData.review_id,
    );

    console.log("✓ Review successfully published and verified");
  } finally {
    await supabase.auth.signOut();
  }
});

// Test 2: Republish after making edits (upsert behavior)
Deno.test("set-review-answers-submitted - updates existing submitted review", async () => {
  const supabase = createTestClient();

  try {
    const { data: authData, error: authError } = await supabase.auth
      .signInWithPassword({ email: testEmail, password: testPassword });

    assert(!authError, `Authentication failed: ${authError?.message}`);
    const accessToken = authData.session!.access_token;
    const userId = authData.session!.user.id;

    const marker1 = `first-publish-${crypto.randomUUID()}`;
    const marker2 = `second-publish-${crypto.randomUUID()}`;

    // First publish
    const payload1 = {
      case_id: testCaseId,
      data: createCompleteReviewData(marker1),
    };

    await supabase.functions.invoke("set-review-answers-in-progress", {
      body: payload1,
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { data: inProgress1 } = await supabase
      .from("review_answers_in_progress")
      .select("id")
      .eq("case_id", testCaseId)
      .eq("reviewed_by", userId)
      .single();

    await supabase.functions.invoke("set-review-answers-submitted", {
      body: { in_progress_id: inProgress1!.id },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    // Make edits and publish again
    const payload2 = {
      case_id: testCaseId,
      data: createCompleteReviewData(marker2),
    };

    await supabase.functions.invoke("set-review-answers-in-progress", {
      body: payload2,
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const { data: inProgress2 } = await supabase
      .from("review_answers_in_progress")
      .select("id, has_unpublished_changes")
      .eq("case_id", testCaseId)
      .eq("reviewed_by", userId)
      .single();

    assertEquals(inProgress2!.has_unpublished_changes, true);

    // Second publish (upsert)
    const { data: publish2, error: publish2Error } = await supabase.functions
      .invoke("set-review-answers-submitted", {
        body: { in_progress_id: inProgress2!.id },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

    assert(!publish2Error, "Second publish failed");
    assertEquals(publish2.saved, true);

    // Verify updated data
    const { data: updated } = await supabase
      .from("review_answers_submitted")
      .select("data")
      .eq("case_id", testCaseId)
      .eq("reviewed_by", userId)
      .single();

    const updatedData = updated!.data as Record<string, unknown>;
    assertEquals(updatedData.additional_comment, marker2);

    console.log("✓ Review successfully updated via republish");
  } finally {
    await supabase.auth.signOut();
  }
});

// Test 3: Fails with incomplete data (validation error)
Deno.test({
  name: "set-review-answers-submitted - fails with incomplete data",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    try {
      const { data: authData, error: authError } = await supabase.auth
        .signInWithPassword({ email: testEmail, password: testPassword });

      assert(!authError, `Authentication failed: ${authError?.message}`);
      const accessToken = authData.session!.access_token;
      const userId = authData.session!.user.id;

      // Create in-progress with incomplete data
      const incompletePayload = {
        case_id: testCaseId,
        data: {
          grammar: 2,
          structure: 2,
          // Missing many required fields
        },
      };

      await supabase.functions.invoke("set-review-answers-in-progress", {
        body: incompletePayload,
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const { data: inProgress } = await supabase
        .from("review_answers_in_progress")
        .select("id")
        .eq("case_id", testCaseId)
        .eq("reviewed_by", userId)
        .single();

      // Try to publish incomplete data
      const { error } = await supabase.functions.invoke(
        "set-review-answers-submitted",
        {
          body: { in_progress_id: inProgress!.id },
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      assert(error, "Expected validation error for incomplete data");
      console.log("✓ Properly rejected incomplete data");
    } finally {
      await supabase.auth.signOut();
    }
  },
});

// Test 4: Fails without authentication
Deno.test({
  name: "set-review-answers-submitted - fails without authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    const { error } = await supabase.functions.invoke(
      "set-review-answers-submitted",
      {
        body: { in_progress_id: crypto.randomUUID() },
      },
    );

    assert(error, "Expected error for unauthenticated request");
    console.log("✓ Properly rejected unauthenticated request");
  },
});

// Test 5: Fails when user doesn't own the draft
Deno.test({
  name:
    "set-review-answers-submitted - fails when user doesn't own the draft",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    try {
      const { data: authData, error: authError } = await supabase.auth
        .signInWithPassword({ email: testEmail, password: testPassword });

      assert(!authError, `Authentication failed: ${authError?.message}`);
      const accessToken = authData.session!.access_token;

      // Try to publish a draft that doesn't belong to this user
      const randomId = crypto.randomUUID();
      const { error } = await supabase.functions.invoke(
        "set-review-answers-submitted",
        {
          body: { in_progress_id: randomId },
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      assert(error, "Expected error when user doesn't own draft");
      console.log("✓ Properly rejected unauthorized draft access");
    } finally {
      await supabase.auth.signOut();
    }
  },
});

// Test 6: Fails with invalid in_progress_id
Deno.test({
  name: "set-review-answers-submitted - fails with invalid in_progress_id",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    try {
      const { data: authData, error: authError } = await supabase.auth
        .signInWithPassword({ email: testEmail, password: testPassword });

      assert(!authError, `Authentication failed: ${authError?.message}`);
      const accessToken = authData.session!.access_token;

      const { error } = await supabase.functions.invoke(
        "set-review-answers-submitted",
        {
          body: { in_progress_id: "not-a-uuid" },
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      assert(error, "Expected error for invalid UUID");
      console.log("✓ Properly rejected invalid UUID");
    } finally {
      await supabase.auth.signOut();
    }
  },
});

// Test 7: Fails with missing in_progress_id
Deno.test({
  name: "set-review-answers-submitted - fails with missing in_progress_id",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    try {
      const { data: authData, error: authError } = await supabase.auth
        .signInWithPassword({ email: testEmail, password: testPassword });

      assert(!authError, `Authentication failed: ${authError?.message}`);
      const accessToken = authData.session!.access_token;

      const { error } = await supabase.functions.invoke(
        "set-review-answers-submitted",
        {
          body: {},
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      assert(error, "Expected error for missing in_progress_id");
      console.log("✓ Properly rejected missing in_progress_id");
    } finally {
      await supabase.auth.signOut();
    }
  },
});

// Test 8: Triggers aggregation when 3+ reviews exist
Deno.test({
  name: "set-review-answers-submitted - triggers aggregation with 3+ reviews",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    try {
      const { data: authData, error: authError } = await supabase.auth
        .signInWithPassword({ email: testEmail, password: testPassword });

      assert(!authError, `Authentication failed: ${authError?.message}`);
      const accessToken = authData.session!.access_token;
      const userId = authData.session!.user.id;

      // Check how many submitted reviews already exist
      const { data: existingReviews } = await supabase
        .from("review_answers_submitted")
        .select("id")
        .eq("case_id", testCaseId);

      const initialCount = existingReviews?.length ?? 0;

      // Create and publish a review
      const marker = `aggregation-test-${crypto.randomUUID()}`;
      await supabase.functions.invoke("set-review-answers-in-progress", {
        body: {
          case_id: testCaseId,
          data: createCompleteReviewData(marker),
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const { data: inProgress } = await supabase
        .from("review_answers_in_progress")
        .select("id")
        .eq("case_id", testCaseId)
        .eq("reviewed_by", userId)
        .single();

      const { data: publishData, error: publishError } = await supabase
        .functions.invoke("set-review-answers-submitted", {
          body: { in_progress_id: inProgress!.id },
          headers: { Authorization: `Bearer ${accessToken}` },
        });

      assert(!publishError, "Publish failed");

      // Check if aggregation was triggered
      if (initialCount + 1 >= 3) {
        assertEquals(
          publishData.aggregated,
          true,
          "Expected aggregation to be triggered",
        );

        // Verify aggregation exists in database
        const { data: aggregation, error: aggError } = await supabase
          .from("review_aggregations")
          .select("result_score, reviewer_ids")
          .eq("case_id", testCaseId)
          .single();

        assert(!aggError, "Failed to fetch aggregation");
        assertExists(aggregation, "Aggregation not found");
        assertExists(aggregation.result_score, "Result score not set");
        assert(
          Array.isArray(aggregation.reviewer_ids),
          "reviewer_ids should be array",
        );

        console.log("✓ Aggregation triggered and saved successfully");
      } else {
        assertEquals(
          publishData.aggregated,
          false,
          "Should not aggregate with less than 3 reviews",
        );
        console.log(
          `✓ No aggregation (only ${initialCount + 1} reviews exist)`,
        );
      }
    } finally {
      await supabase.auth.signOut();
    }
  },
});
