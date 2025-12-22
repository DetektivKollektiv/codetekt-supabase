// supabase/functions/tests/set-review-answers-in-progress_test.ts
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

// Test: Save partial data (in-progress review)
Deno.test("set-review-answers-in-progress - saves partial review data", async () => {
  const supabase = createTestClient();

  try {
    // Step 1: Authenticate user
    const { data: authData, error: authError } = await supabase.auth
      .signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

    assert(
      !authError,
      `Authentication failed: ${authError?.message ?? "unknown error"}`,
    );
    assertExists(
      authData.session?.access_token,
      "No access token received from auth",
    );

    const userId = authData.session!.user.id;
    const accessToken = authData.session!.access_token;

    // Generate unique marker for this test run
    const marker = `test-partial-${crypto.randomUUID()}`;

    // Step 2: Prepare payload with partial data
    const payload = {
      case_id: testCaseId,
      data: {
        grammar: 2,
        structure: 3,
        headline: 1,
      },
    };

    // Step 3: Invoke edge function
    const { data, error } = await supabase.functions.invoke(
      "set-review-answers-in-progress",
      {
        body: payload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    // Step 4: Assertions
    assert(
      !error,
      `Function invocation failed: ${error?.message ?? "unknown error"}`,
    );

    // Verify response structure
    assertExists(data, "Expected response data");
    assertEquals(data.saved, true, "Expected saved to be true");

    // Step 5: Verify data was persisted in in_progress table
    const { data: dbData, error: dbError } = await supabase
      .from("review_answers_in_progress")
      .select("data, has_unpublished_changes, updated_at, submitted_review_answers_id")
      .eq("case_id", testCaseId)
      .eq("reviewed_by", userId)
      .single();

    assert(!dbError, `Failed to query review_answers_in_progress: ${dbError?.message}`);
    assertExists(dbData, "No in-progress review found in database");

    assertEquals(dbData.has_unpublished_changes, true, "has_unpublished_changes should be true");
    assertExists(dbData.updated_at, "updated_at should be set");

    const inProgressData = dbData.data as Record<string, unknown>;
    assertEquals(inProgressData.grammar, 2, "Grammar rating not persisted");
    assertEquals(inProgressData.structure, 3, "Structure rating not persisted");
    assertEquals(inProgressData.headline, 1, "Headline rating not persisted");

    console.log("✓ Partial review successfully saved to in_progress table");
  } finally {
    // Clean up: sign out to prevent resource leaks
    await supabase.auth.signOut();
  }
});

// Test: Save empty data (minimal valid payload)
Deno.test("set-review-answers-in-progress - saves empty review data", async () => {
  const supabase = createTestClient();

  try {
    const { data: authData, error: authError } = await supabase.auth
      .signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

    assert(!authError, `Authentication failed: ${authError?.message}`);
    const accessToken = authData.session!.access_token;
    const userId = authData.session!.user.id;

    // Submit empty data object (all fields optional in in-progress schema)
    const payload = {
      case_id: testCaseId,
      data: {},
    };

    const { data, error } = await supabase.functions.invoke(
      "set-review-answers-in-progress",
      {
        body: payload,
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    assert(!error, `Empty data submission failed: ${error?.message}`);
    assertEquals(data.saved, true, "Expected saved to be true");

    // Verify in database
    const { data: dbData, error: dbError } = await supabase
      .from("review_answers_in_progress")
      .select("data, has_unpublished_changes")
      .eq("case_id", testCaseId)
      .eq("reviewed_by", userId)
      .single();

    assert(!dbError, "Failed to query in_progress table");
    assertExists(dbData, "Review not found");
    assertEquals(dbData.has_unpublished_changes, true, "has_unpublished_changes should be true");

    console.log("✓ Empty review data successfully saved");
  } finally {
    await supabase.auth.signOut();
  }
});

// Test: Upsert behavior (update existing in-progress review)
Deno.test("set-review-answers-in-progress - updates existing review (upsert)", async () => {
  const supabase = createTestClient();

  try {
    const { data: authData, error: authError } = await supabase.auth
      .signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

    assert(!authError, `Authentication failed: ${authError?.message}`);
    const accessToken = authData.session!.access_token;
    const userId = authData.session!.user.id;

    // First submission
    const payload1 = {
      case_id: testCaseId,
      data: {
        grammar: 1,
        structure: 2,
      },
    };

    const { data: data1, error: error1 } = await supabase.functions.invoke(
      "set-review-answers-in-progress",
      {
        body: payload1,
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    assert(!error1, "First submission failed");
    assertEquals(data1.saved, true);

    // Verify first submission
    const { data: db1 } = await supabase
      .from("review_answers_in_progress")
      .select("data, updated_at")
      .eq("case_id", testCaseId)
      .eq("reviewed_by", userId)
      .single();

    assertExists(db1, "First submission not found");
    const firstData = db1.data as Record<string, unknown>;
    assertEquals(firstData.grammar, 1, "First grammar value incorrect");

    const firstUpdatedAt = db1.updated_at;

    // Wait a bit to ensure updated_at changes
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Second submission (update)
    const payload2 = {
      case_id: testCaseId,
      data: {
        grammar: 3,
        structure: 2,
        headline: 3,
      },
    };

    const { data: data2, error: error2 } = await supabase.functions.invoke(
      "set-review-answers-in-progress",
      {
        body: payload2,
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    assert(!error2, "Second submission failed");
    assertEquals(data2.saved, true);

    // Verify second submission updated the row
    const { data: db2 } = await supabase
      .from("review_answers_in_progress")
      .select("data, updated_at")
      .eq("case_id", testCaseId)
      .eq("reviewed_by", userId)
      .single();

    assertExists(db2, "Second submission not found");
    const secondData = db2.data as Record<string, unknown>;
    assertEquals(secondData.grammar, 3, "Grammar was not updated");
    assertEquals(secondData.headline, 3, "Headline was not added");

    // Verify updated_at changed
    assert(
      db2.updated_at !== firstUpdatedAt,
      "updated_at should change on update"
    );

    console.log("✓ Review successfully updated via upsert");
  } finally {
    await supabase.auth.signOut();
  }
});

// Test: Unauthenticated request should fail
Deno.test({
  name: "set-review-answers-in-progress - fails without authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    const payload = {
      case_id: testCaseId,
      data: {
        grammar: 1,
      },
    };

    const { error } = await supabase.functions.invoke(
      "set-review-answers-in-progress",
      {
        body: payload,
      },
    );

    // Should fail without authentication
    assert(error, "Expected error for unauthenticated request");
    console.log("✓ Properly rejected unauthenticated request");
  },
});

// Test: Invalid case_id should fail
Deno.test({
  name: "set-review-answers-in-progress - fails with invalid case_id",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    try {
      const { data: authData, error: authError } = await supabase.auth
        .signInWithPassword({
          email: testEmail,
          password: testPassword,
        });

      assert(!authError, `Authentication failed: ${authError?.message}`);
      const accessToken = authData.session!.access_token;

      const payload = {
        case_id: "invalid-uuid",
        data: {
          grammar: 1,
        },
      };

      const { error } = await supabase.functions.invoke(
        "set-review-answers-in-progress",
        {
          body: payload,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      assert(error, "Expected error for invalid case_id");
      console.log("✓ Properly rejected invalid case_id");
    } finally {
      await supabase.auth.signOut();
    }
  },
});

// Test: Invalid data type should fail validation
Deno.test({
  name: "set-review-answers-in-progress - fails with invalid data types",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    try {
      const { data: authData, error: authError } = await supabase.auth
        .signInWithPassword({
          email: testEmail,
          password: testPassword,
        });

      assert(!authError, `Authentication failed: ${authError?.message}`);
      const accessToken = authData.session!.access_token;

      // Invalid grammar value (string instead of number)
      const payload = {
        case_id: testCaseId,
        data: {
          grammar: "invalid",
        },
      };

      const { data, error } = await supabase.functions.invoke(
        "set-review-answers-in-progress",
        {
          body: payload,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      // Should return validation error (400) not function error
      assert(error || (data && data.error), "Expected validation error for invalid data type");
      console.log("✓ Properly rejected invalid data type");
    } finally {
      await supabase.auth.signOut();
    }
  },
});

// Test: Verify has_unpublished_changes is always set to true
Deno.test("set-review-answers-in-progress - always sets has_unpublished_changes to true", async () => {
  const supabase = createTestClient();

  try {
    const { data: authData, error: authError } = await supabase.auth
      .signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

    assert(!authError, `Authentication failed: ${authError?.message}`);
    const accessToken = authData.session!.access_token;
    const userId = authData.session!.user.id;

    // Submit data
    const payload = {
      case_id: testCaseId,
      data: {
        grammar: 2,
      },
    };

    const { error } = await supabase.functions.invoke(
      "set-review-answers-in-progress",
      {
        body: payload,
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    assert(!error, "Submission failed");

    // Verify has_unpublished_changes is true
    const { data: dbData } = await supabase
      .from("review_answers_in_progress")
      .select("has_unpublished_changes")
      .eq("case_id", testCaseId)
      .eq("reviewed_by", userId)
      .single();

    assertExists(dbData, "Review not found");
    assertEquals(
      dbData.has_unpublished_changes,
      true,
      "has_unpublished_changes should always be true on save"
    );

    console.log("✓ has_unpublished_changes correctly set to true");
  } finally {
    await supabase.auth.signOut();
  }
});
