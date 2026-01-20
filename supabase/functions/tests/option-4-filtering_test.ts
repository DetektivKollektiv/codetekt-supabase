// Test file for option 4 filtering logic in set-review-aggregation
import { assert, assertEquals, assertExists } from "jsr:@std/assert@1";
import { createClient } from "npm:@supabase/supabase-js@2";
import "jsr:@std/dotenv/load";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "http://127.0.0.1:54321";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const TEST_USER_GORM = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const TEST_USER_VALENTIN = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const TEST_USER_CUNEYT = "cccccccc-cccc-cccc-cccc-cccccccccccc";

const createServiceRoleClient = () => {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
};

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

// Test 1: Field with ≥50% option 4 is excluded
Deno.test({
  name:
    "option-4-filtering - excludes fields where ≥50% chose option 4 (not applicable)",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "http://example.com/option-4-filtering",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError);
    assertExists(newCase);

    try {
      // Add two reviews where content_clarity has 50% option 4 (should be filtered out)
      // and content_logic has <50% option 4 (should be kept)
      const { error: review1Error } = await supabase
        .from("review_answers_submitted")
        .insert({
          case_id: newCase.id,
          reviewed_by: TEST_USER_GORM,
          data: {
            title: "Test Title For Review",
            keyword_type: ["Test"],
            content_type: ["neutral"],
            content_accuracy: 2,
            content_sources: 2,
            content_language: 2,
            content_clarity: 4, // Option 4 - not applicable
            content_references: 2,
            content_logic: 1,
            content_advertising: 2,
            additional_rating: 3,
            additional_comment: null,
          },
        });

      assert(!review1Error, `Failed to insert review 1: ${review1Error?.message}`);

      const { error: review2Error } = await supabase
        .from("review_answers_submitted")
        .insert({
          case_id: newCase.id,
          reviewed_by: TEST_USER_VALENTIN,
          data: {
            title: "Test Title For Review",
            keyword_type: ["Test"],
            content_type: ["neutral"],
            content_accuracy: 1,
            content_sources: 1,
            content_language: 1,
            content_clarity: 4, // Option 4 - not applicable (50% total)
            content_references: 1,
            content_logic: 2,
            content_advertising: 1,
            additional_rating: 3,
            additional_comment: null,
          },
        });

      assert(!review2Error, `Failed to insert review 2: ${review2Error?.message}`);

      // Aggregate
      const { response, data } = await invokeAggregation(newCase.id);
      if (response.status !== 200) {
        console.error("Aggregation failed:", JSON.stringify(data, null, 2));
      }
      assertEquals(response.status, 200);
      assertEquals(data.success, true);

      // Verify aggregation
      const { data: aggregation } = await supabase
        .from("review_aggregations")
        .select("data")
        .eq("case_id", newCase.id)
        .single();

      assertExists(aggregation);
      const contentQuestion = aggregation.data.questions.find(
        (q: { id: string }) => q.id === "content_question",
      );
      assertExists(contentQuestion, "content_question should exist");

      // content_clarity should be filtered out (50% chose option 4)
      const clarityField = contentQuestion.fields.find(
        (f: { id: string }) => f.id === "content_clarity",
      );
      assertEquals(
        clarityField,
        undefined,
        "content_clarity should be filtered out (≥50% option 4)",
      );

      // content_logic should be kept (0% chose option 4)
      const logicField = contentQuestion.fields.find(
        (f: { id: string }) => f.id === "content_logic",
      );
      assertExists(logicField, "content_logic should be kept");
      assertEquals(logicField.counts[1], 1);
      assertEquals(logicField.counts[2], 1);

      console.log(
        "✓ Field with ≥50% option 4 filtered out, other fields kept",
      );
    } finally {
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});

// Test 2: Entire question removed if all fields filtered
Deno.test({
  name:
    "option-4-filtering - removes entire question when all fields have ≥50% option 4",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "http://example.com/all-option-4",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError);
    assertExists(newCase);

    try {
      // Add two reviews where ALL content fields are option 4
      const reviews = [
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_GORM,
          data: {
            title: "Test Title For Review",
            keyword_type: ["Test"],
            content_type: ["neutral"],
            content_accuracy: 4,
            content_sources: 4,
            content_language: 4,
            content_clarity: 4,
            content_references: 4,
            content_logic: 4,
            content_advertising: 4,
            additional_rating: 3,
            additional_comment: null,
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_VALENTIN,
          data: {
            title: "Test Title For Review",
            keyword_type: ["Test"],
            content_type: ["neutral"],
            content_accuracy: 4,
            content_sources: 4,
            content_language: 4,
            content_clarity: 4,
            content_references: 4,
            content_logic: 4,
            content_advertising: 4,
            additional_rating: 3,
            additional_comment: null,
          },
        },
      ];

      await supabase.from("review_answers_submitted").insert(reviews);

      // Aggregate
      const { response, data } = await invokeAggregation(newCase.id);
      assertEquals(response.status, 200);
      assertEquals(data.success, true);

      // Verify aggregation
      const { data: aggregation } = await supabase
        .from("review_aggregations")
        .select("data")
        .eq("case_id", newCase.id)
        .single();

      assertExists(aggregation);

      // content_question should be entirely removed (all fields filtered)
      const contentQuestion = aggregation.data.questions.find(
        (q: { id: string }) => q.id === "content_question",
      );
      assertEquals(
        contentQuestion,
        undefined,
        "content_question should be removed entirely when all fields filtered",
      );

      console.log(
        "✓ Question removed entirely when all fields have ≥50% option 4",
      );
    } finally {
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});

// Test 3: Option 4 exclusion from average calculation
Deno.test({
  name:
    "option-4-filtering - excludes option 4 from average calculation",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "http://example.com/option-4-average",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError);
    assertExists(newCase);

    try {
      // Add 4 reviews: 1 option 4 (25%), others 0,1,2 → should be kept, average = (0+1+2)/3 = 1.0
      const reviews = [
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_GORM,
          data: {
            title: "Test Title For Review",
            keyword_type: ["Test"],
            content_type: ["neutral"],
            content_accuracy: 2,
            content_sources: 0, // Testing this field
            content_language: 2,
            content_clarity: 2,
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
            additional_comment: null,
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_VALENTIN,
          data: {
            title: "Test Title For Review",
            keyword_type: ["Test"],
            content_type: ["neutral"],
            content_accuracy: 2,
            content_sources: 1, // Testing this field
            content_language: 2,
            content_clarity: 2,
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
            additional_comment: null,
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: TEST_USER_CUNEYT,
          data: {
            title: "Test Title For Review",
            keyword_type: ["Test"],
            content_type: ["neutral"],
            content_accuracy: 2,
            content_sources: 2, // Testing this field
            content_language: 2,
            content_clarity: 2,
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
            additional_comment: null,
          },
        },
        {
          case_id: newCase.id,
          reviewed_by: "dddddddd-dddd-dddd-dddd-dddddddddddd",
          data: {
            title: "Test Title For Review",
            keyword_type: ["Test"],
            content_type: ["neutral"],
            content_accuracy: 2,
            content_sources: 4, // Option 4 - should be excluded from average
            content_language: 2,
            content_clarity: 2,
            content_references: 2,
            content_logic: 2,
            content_advertising: 2,
            additional_rating: 3,
            additional_comment: null,
          },
        },
      ];

      await supabase.from("review_answers_submitted").insert(reviews);

      // Aggregate
      const { response, data } = await invokeAggregation(newCase.id);
      assertEquals(response.status, 200);
      assertEquals(data.success, true);

      // Verify aggregation
      const { data: aggregation } = await supabase
        .from("review_aggregations")
        .select("data")
        .eq("case_id", newCase.id)
        .single();

      assertExists(aggregation);
      const contentQuestion = aggregation.data.questions.find(
        (q: { id: string }) => q.id === "content_question",
      );
      assertExists(contentQuestion);

      const sourcesField = contentQuestion.fields.find(
        (f: { id: string }) => f.id === "content_sources",
      );
      assertExists(sourcesField, "content_sources should be kept (25% option 4)");

      // Verify counts (option 4 should not be in output)
      assertEquals(sourcesField.counts[0], 1);
      assertEquals(sourcesField.counts[1], 1);
      assertEquals(sourcesField.counts[2], 1);
      assertEquals(sourcesField.counts[3], 0);
      assert(
        sourcesField.counts[4] === undefined,
        "Option 4 should not be in output counts",
      );

      // Verify average excludes option 4: (0 + 1 + 2) / 3 = 1.0
      assertEquals(
        sourcesField.average,
        1.0,
        "Average should exclude option 4 votes",
      );

      // Verify percentages are normalized (without option 4): 33.33%, 33.33%, 33.33%
      assert(
        Math.abs(sourcesField.percentages[0] - 33.33) < 0.1,
        "Percentage should be normalized without option 4",
      );
      assert(
        Math.abs(sourcesField.percentages[1] - 33.33) < 0.1,
        "Percentage should be normalized without option 4",
      );
      assert(
        Math.abs(sourcesField.percentages[2] - 33.33) < 0.1,
        "Percentage should be normalized without option 4",
      );

      console.log(
        `✓ Option 4 excluded from average: ${sourcesField.average} (expected 1.0)`,
      );
    } finally {
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});
