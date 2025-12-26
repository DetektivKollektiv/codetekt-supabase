// supabase/functions/tests/get-review-template_test.ts
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

// Second user for subsequent reviewer tests (must exist in seeds and NOT have submitted for case 11111111)
const testEmail2 = "lisa.weber@example.com";
const testPassword2 = "testpassword123";

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

// Test: Unauthenticated request should fail
Deno.test({
  name: "get-review-template - fails without authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    const payload = {
      case_id: testCaseId,
    };

    const { error } = await supabase.functions.invoke(
      "get-review-template",
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
  name: "get-review-template - fails with invalid case_id",
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
      };

      const { error } = await supabase.functions.invoke(
        "get-review-template",
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

// Test: Non-existent case should return 404
Deno.test({
  name: "get-review-template - returns 404 for non-existent case",
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
        case_id: "99999999-9999-9999-9999-999999999999",
      };

      const { data, error } = await supabase.functions.invoke(
        "get-review-template",
        {
          body: payload,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      // Should return 404 - check either error object or data.error
      const hasError = error || (data && data.error);
      assert(hasError, "Expected error for non-existent case");
      console.log("✓ Properly returned 404 for non-existent case");
    } finally {
      await supabase.auth.signOut();
    }
  },
});

// Test: User who already submitted should still get template
Deno.test({
  name: "get-review-template - returns template even if user already submitted review",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    try {
      // User gorm-labenz@hotmail.com has already submitted a review for this case (from seeds)
      const { data: authData, error: authError } = await supabase.auth
        .signInWithPassword({
          email: testEmail,
          password: testPassword,
        });

      assert(!authError, `Authentication failed: ${authError?.message}`);
      const accessToken = authData.session!.access_token;

      const payload = {
        case_id: testCaseId,
      };

      const { data, error } = await supabase.functions.invoke(
        "get-review-template",
        {
          body: payload,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      assert(!error, `Function invocation failed: ${error?.message}`);
      assertExists(data, "Expected response data");
      assert(Array.isArray(data), "Expected template to be an array");
      console.log("✓ Returns template even for user with submitted review");
    } finally {
      await supabase.auth.signOut();
    }
  },
});

// Test: First reviewer gets template with required metadata fields
Deno.test({
  name:
    "get-review-template - first reviewer gets template with is_required=true for metadata",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    try {
      // Create a new case with no reviews
      const { data: authData, error: authError } = await supabase.auth
        .signInWithPassword({
          email: testEmail2,
          password: testPassword2,
        });

      assert(!authError, `Authentication failed: ${authError?.message}`);
      const accessToken = authData.session!.access_token;

      // Create new case
      const newCaseId = crypto.randomUUID();
      const { error: caseError } = await supabase
        .from("cases")
        .insert({
          id: newCaseId,
          submitted_by: authData.session!.user.id,
          content: "Test content",
          content_type: "url",
          template_version: 1,
        });

      assert(!caseError, `Failed to create test case: ${caseError?.message}`);

      // Get template
      const { data, error } = await supabase.functions.invoke(
        "get-review-template",
        {
          body: { case_id: newCaseId },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      assert(!error, `Function invocation failed: ${error?.message}`);
      assertExists(data, "Expected response data");
      assert(Array.isArray(data), "Expected template to be an array");

      // Find keywords_question section
      const keywordsSection = data.find((s: { id: string }) =>
        s.id === "keywords_question"
      );
      assertExists(keywordsSection, "keywords_question section not found");

      // Find keyword_type field
      const keywordField = keywordsSection.fields.find((f: { id: string }) =>
        f.id === "keyword_type"
      );
      assertExists(keywordField, "keyword_type field not found");

      // Verify is_required is true (first reviewer)
      assertEquals(
        keywordField.is_required,
        true,
        "keyword_type should be required for first reviewer",
      );

      // Find content_type_question section
      const contentTypeSection = data.find((s: { id: string }) =>
        s.id === "content_type_question"
      );
      assertExists(contentTypeSection, "content_type_question section not found");

      // Find content_type field
      const contentTypeField = contentTypeSection.fields.find((
        f: { id: string },
      ) => f.id === "content_type");
      assertExists(contentTypeField, "content_type field not found");

      // Verify is_required is true (first reviewer)
      assertEquals(
        contentTypeField.is_required,
        true,
        "content_type should be required for first reviewer",
      );

      // Verify no prefilled values (can be undefined or null from template)
      assert(
        keywordField.prefilled_answer_value === undefined ||
          keywordField.prefilled_answer_value === null,
        "keyword_type should not have prefilled values for first reviewer",
      );
      assert(
        contentTypeField.prefilled_answer_value === undefined ||
          contentTypeField.prefilled_answer_value === null,
        "content_type should not have prefilled values for first reviewer",
      );

      console.log("✓ First reviewer template correctly configured");

      // Cleanup
      await supabase.from("cases").delete().eq("id", newCaseId);
    } finally {
      await supabase.auth.signOut();
    }
  },
});

// Test: Subsequent reviewer gets template with disabled metadata fields
Deno.test({
  name:
    "get-review-template - subsequent reviewer gets disabled metadata fields with prefilled values",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    try {
      // Login as second user (bob@example.com has not submitted for case 11111111...)
      const { data: authData, error: authError } = await supabase.auth
        .signInWithPassword({
          email: testEmail2,
          password: testPassword2,
        });

      assert(!authError, `Authentication failed: ${authError?.message}`);
      const accessToken = authData.session!.access_token;

      // Clean up any existing in-progress reviews for this user/case
      await supabase
        .from("review_answers_in_progress")
        .delete()
        .eq("case_id", testCaseId)
        .eq("reviewed_by", authData.session!.user.id);

      // Get template for case that already has submitted reviews
      const { data, error } = await supabase.functions.invoke(
        "get-review-template",
        {
          body: { case_id: testCaseId },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      assert(!error, `Function invocation failed: ${error?.message}`);
      assertExists(data, "Expected response data");
      assert(Array.isArray(data), "Expected template to be an array");

      // Find keywords_question section
      const keywordsSection = data.find((s: { id: string }) =>
        s.id === "keywords_question"
      );
      assertExists(keywordsSection, "keywords_question section not found");

      // Find keyword_type field
      const keywordField = keywordsSection.fields.find((f: { id: string }) =>
        f.id === "keyword_type"
      );
      assertExists(keywordField, "keyword_type field not found");

      // Verify subsequent reviewer configuration for keywords
      assertEquals(
        keywordField.is_required,
        false,
        "keyword_type should not be required for subsequent reviewer",
      );
      assertEquals(
        keywordField.is_disputable,
        true,
        "keyword_type should be disputable for subsequent reviewer",
      );
      assertEquals(
        keywordField.additonal_option_count,
        3,
        "keyword_type should allow 3 additional keywords for subsequent reviewer",
      );
      assertExists(
        keywordField.options,
        "keyword_type should have options array",
      );
      assert(
        Array.isArray(keywordField.options),
        "keyword_type options should be an array",
      );
      assert(
        keywordField.options.length > 0,
        "keyword_type options should not be empty",
      );
      // Verify options have is_disabled set to true
      assert(
        keywordField.options.every((opt: { is_disabled: boolean }) => opt.is_disabled === true),
        "All aggregated keyword options should be disabled",
      );

      // Find content_type_question section
      const contentTypeSection = data.find((s: { id: string }) =>
        s.id === "content_type_question"
      );
      assertExists(contentTypeSection, "content_type_question section not found");

      // Find content_type field
      const contentTypeField = contentTypeSection.fields.find((
        f: { id: string },
      ) => f.id === "content_type");
      assertExists(contentTypeField, "content_type field not found");

      // Verify subsequent reviewer configuration
      assertEquals(
        contentTypeField.is_required,
        false,
        "content_type should not be required for subsequent reviewer",
      );
      assertEquals(
        contentTypeField.is_disabled,
        true,
        "content_type should be disabled for subsequent reviewer",
      );
      assertEquals(
        contentTypeField.is_disputable,
        true,
        "content_type should be disputable for subsequent reviewer",
      );
      assertExists(
        contentTypeField.prefilled_answer_value,
        "content_type should have prefilled values",
      );
      assert(
        Array.isArray(contentTypeField.prefilled_answer_value),
        "prefilled content_type should be an array",
      );

      console.log("✓ Subsequent reviewer template correctly configured");
      console.log(
        `  - Aggregated ${keywordField.options.length} keywords as disabled options`,
      );
      console.log(
        `  - Aggregated ${contentTypeField.prefilled_answer_value.length} content types`,
      );
    } finally {
      await supabase.auth.signOut();
    }
  },
});

// Test: User with in-progress review gets answer_value populated
Deno.test({
  name:
    "get-review-template - user with in-progress review gets answer_value populated",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    try {
      const { data: authData, error: authError } = await supabase.auth
        .signInWithPassword({
          email: testEmail2,
          password: testPassword2,
        });

      assert(!authError, `Authentication failed: ${authError?.message}`);
      const accessToken = authData.session!.access_token;
      const userId = authData.session!.user.id;

      // Create new case
      const newCaseId = crypto.randomUUID();
      const { error: caseError } = await supabase
        .from("cases")
        .insert({
          id: newCaseId,
          submitted_by: userId,
          content: "Test content",
          content_type: "url",
          template_version: 1,
        });

      assert(!caseError, `Failed to create test case: ${caseError?.message}`);

      // Create in-progress review
      const inProgressData = {
        grammar: 2,
        structure: 1,
        additional_comment: "test-in-progress",
      };

      const { error: reviewError } = await supabase
        .from("review_answers_in_progress")
        .insert({
          case_id: newCaseId,
          reviewed_by: userId,
          data: inProgressData,
          has_unpublished_changes: true,
          submitted_review_answers_id: null,
        });

      assert(
        !reviewError,
        `Failed to create in-progress review: ${reviewError?.message}`,
      );

      // Get template
      const { data, error } = await supabase.functions.invoke(
        "get-review-template",
        {
          body: { case_id: newCaseId },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      assert(!error, `Function invocation failed: ${error?.message}`);
      assertExists(data, "Expected response data");
      assert(Array.isArray(data), "Expected template to be an array");

      // Find grammar field
      const contentSection = data.find((s: { id: string }) =>
        s.id === "content_criteria_question"
      );
      assertExists(contentSection, "content_criteria_question section not found");

      const grammarField = contentSection.fields.find((f: { id: string }) =>
        f.id === "grammar"
      );
      assertExists(grammarField, "grammar field not found");

      // Verify answer_value is populated from in-progress review
      assertEquals(
        grammarField.answer_value,
        2,
        "grammar answer_value should be populated from in-progress review",
      );

      // Find structure field
      const structureField = contentSection.fields.find((f: { id: string }) =>
        f.id === "structure"
      );
      assertExists(structureField, "structure field not found");

      assertEquals(
        structureField.answer_value,
        1,
        "structure answer_value should be populated from in-progress review",
      );

      console.log("✓ In-progress review values correctly populated");

      // Cleanup
      await supabase.from("review_answers_in_progress").delete().eq("case_id", newCaseId);
      await supabase.from("cases").delete().eq("id", newCaseId);
    } finally {
      await supabase.auth.signOut();
    }
  },
});

// Test: Template structure is valid
Deno.test({
  name: "get-review-template - returns valid template structure",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();

    try {
      const { data: authData, error: authError } = await supabase.auth
        .signInWithPassword({
          email: testEmail2,
          password: testPassword2,
        });

      assert(!authError, `Authentication failed: ${authError?.message}`);
      const accessToken = authData.session!.access_token;
      const userId = authData.session!.user.id;

      // Create new case
      const newCaseId = crypto.randomUUID();
      const { error: caseError } = await supabase
        .from("cases")
        .insert({
          id: newCaseId,
          submitted_by: userId,
          content: "Test content",
          content_type: "url",
          template_version: 1,
        });

      assert(!caseError, `Failed to create test case: ${caseError?.message}`);

      // Get template
      const { data, error } = await supabase.functions.invoke(
        "get-review-template",
        {
          body: { case_id: newCaseId },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      assert(!error, `Function invocation failed: ${error?.message}`);
      assertExists(data, "Expected response data");
      assert(Array.isArray(data), "Expected template to be an array");
      assert(data.length > 0, "Template should not be empty");

      // Verify each section has required structure
      for (const section of data) {
        assertExists(section.id, "Section should have id");
        assertExists(section.metadata, "Section should have metadata");
        assertExists(section.metadata.title, "Section metadata should have title");
        assertExists(section.fields, "Section should have fields array");
        assert(
          Array.isArray(section.fields),
          "Section fields should be an array",
        );

        // Verify each field has required properties
        for (const field of section.fields) {
          assertExists(field.id, "Field should have id");
          assertExists(field.type, "Field should have type");
        }
      }

      console.log("✓ Template structure is valid");
      console.log(`  - ${data.length} sections`);
      console.log(
        `  - ${data.reduce((acc: number, s: { fields: unknown[] }) => acc + s.fields.length, 0)} total fields`,
      );

      // Cleanup
      await supabase.from("cases").delete().eq("id", newCaseId);
    } finally {
      await supabase.auth.signOut();
    }
  },
});
