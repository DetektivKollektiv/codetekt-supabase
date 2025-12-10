// supabase/functions/tests/set-review-answer-test.ts
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

// Test: Successful review submission
Deno.test("set-review-answer - upserts review for authenticated user", async () => {
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
    const marker = `auto-test-${crypto.randomUUID()}`;

    // Step 2: Prepare payload
    const payload = {
      case_id: testCaseId,
      data: {
        keyword_type: ["Ukraine", "Russland", "Krieg", "Putin", "Zelensky"],
        content_type: ["nachrichtenartikel"],
        grammar: 1,
        structure: 1,
        headline: 1,
        objectivity: 1,
        perspectives: 1,
        external_sources: 1,
        claims_match_sources: 1,
        public_media_match: 1,
        author_credentials: 1,
        images_quality: 1,
        additional_rating: 1,
        additional_comment: marker,
      },
    };

    // Step 3: Invoke edge function
    const { data, error } = await supabase.functions.invoke(
      "set-review-answer",
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
    assert(Array.isArray(data), "Expected array of submitted answers");

    // Type definition for clarity
    type SubmissionRow = {
      reviewed_by: string;
      data: Record<string, unknown>;
    };

    const submissions = data as SubmissionRow[];

    // Find submission for current user
    const ownSubmission = submissions.find((row) => row.reviewed_by === userId);
    assertExists(ownSubmission, "Missing submission for authenticated user");

    // Verify the data was persisted correctly
    const submittedData = ownSubmission.data as Record<string, unknown>;
    assertEquals(
      submittedData.additional_comment,
      marker,
      "Upsert did not persist new comment value",
    );

    // Verify other fields
    assertEquals(submittedData.grammar, 1, "Grammar rating not persisted");
    assertEquals(submittedData.structure, 1, "Structure rating not persisted");
    assertEquals(submittedData.headline, 1, "Headline rating not persisted");

    console.log("✓ Review successfully submitted and verified");
  } finally {
    // Clean up: sign out to prevent resource leaks
    await supabase.auth.signOut();
  }
});

// Test: Unauthenticated request should fail
Deno.test({
  name: "set-review-answer - fails without authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    const payload = {
      case_id: testCaseId,
      data: {
        keyword_type: ["Ukraine"],
        content_type: ["nachrichtenartikel"],
        grammar: 1,
      },
    };

    const { error } = await supabase.functions.invoke("set-review-answer", {
      body: payload,
    });

    // Should fail without authentication
    assert(error, "Expected error for unauthenticated request");
    console.log("✓ Properly rejected unauthenticated request");
  },
});

// Test: Invalid case_id should fail
Deno.test({
  name: "set-review-answer - fails with invalid case_id",
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

      const { error } = await supabase.functions.invoke("set-review-answer", {
        body: payload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      assert(error, "Expected error for invalid case_id");
      console.log("✓ Properly rejected invalid case_id");
    } finally {
      await supabase.auth.signOut();
    }
  },
});

// Test: Update existing review
Deno.test("set-review-answer - updates existing review (upsert behavior)", async () => {
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

    const marker1 = `test-1-${crypto.randomUUID()}`;
    const marker2 = `test-2-${crypto.randomUUID()}`;

    // First submission
    const payload1 = {
      case_id: testCaseId,
      data: {
        grammar: 1,
        additional_comment: marker1,
      },
    };

    const { data: data1, error: error1 } = await supabase.functions.invoke(
      "set-review-answer",
      {
        body: payload1,
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    assert(!error1, "First submission failed");

    type SubmissionRow = {
      reviewed_by: string;
      data: Record<string, unknown>;
    };

    const submissions1 = data1 as SubmissionRow[];
    const own1 = submissions1.find((row) => row.reviewed_by === userId);
    assertExists(own1, "First submission not found");
    assertEquals(
      (own1.data as Record<string, unknown>).additional_comment,
      marker1,
      "First comment not saved",
    );

    // Second submission (update)
    const payload2 = {
      case_id: testCaseId,
      data: {
        grammar: 2,
        additional_comment: marker2,
      },
    };

    const { data: data2, error: error2 } = await supabase.functions.invoke(
      "set-review-answer",
      {
        body: payload2,
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    assert(!error2, "Second submission failed");

    const submissions2 = data2 as SubmissionRow[];
    const own2 = submissions2.find((row) => row.reviewed_by === userId);
    assertExists(own2, "Second submission not found");

    // Verify the update happened
    assertEquals(
      (own2.data as Record<string, unknown>).additional_comment,
      marker2,
      "Comment was not updated",
    );
    assertEquals(
      (own2.data as Record<string, unknown>).grammar,
      2,
      "Grammar rating was not updated",
    );

    console.log("✓ Review successfully updated (upsert worked)");
  } finally {
    await supabase.auth.signOut();
  }
});
