// Test file for text field aggregation in set-review-aggregation
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

// Test: Text fields are aggregated into answer_values array
Deno.test({
    name:
        "text-field-aggregation - aggregates text/text-area fields into answer_values array",
    sanitizeResources: false,
    sanitizeOps: false,
    fn: async () => {
        const supabase = createServiceRoleClient();

        const { data: newCase, error: caseError } = await supabase
            .from("cases")
            .insert({
                submitted_by: TEST_USER_GORM,
                content: "http://example.com/text-field-test",
                content_type: "url",
                template_version: 1,
            })
            .select()
            .single();

        assert(!caseError);
        assertExists(newCase);

        try {
            // Add three reviews with different additional_comment values
            // Note: additional_rating must be < 3 to require additional_comment
            const comment1 =
                "This is the first reviewer's comment about the content.";
            const comment2 =
                "Second reviewer provides different feedback here.";
            const comment3 =
                "Third reviewer has their own perspective on this.";

            const { error: review1Error } = await supabase
                .from("review_answers_submitted")
                .insert({
                    case_id: newCase.id,
                    reviewed_by: TEST_USER_GORM,
                    data: {
                        title: "Test Title For Text Aggregation",
                        keyword_type: ["Test", "Aggregation"],
                        content_type: ["neutral"],
                        content_accuracy: 1,
                        content_sources: 1,
                        content_language: 1,
                        content_clarity: 1,
                        content_references: 1,
                        content_logic: 1,
                        content_advertising: 1,
                        additional_rating: 1, // < 3, so additional_comment is required
                        additional_comment: comment1,
                    },
                });

            assert(!review1Error);

            const { error: review2Error } = await supabase
                .from("review_answers_submitted")
                .insert({
                    case_id: newCase.id,
                    reviewed_by: TEST_USER_VALENTIN,
                    data: {
                        title: "Test Title For Text Aggregation",
                        keyword_type: ["Test", "Aggregation"],
                        content_type: ["neutral"],
                        content_accuracy: 2,
                        content_sources: 2,
                        content_language: 2,
                        content_clarity: 2,
                        content_references: 2,
                        content_logic: 2,
                        content_advertising: 2,
                        additional_rating: 2, // < 3, so additional_comment is required
                        additional_comment: comment2,
                    },
                });

            assert(!review2Error);

            const { error: review3Error } = await supabase
                .from("review_answers_submitted")
                .insert({
                    case_id: newCase.id,
                    reviewed_by: TEST_USER_CUNEYT,
                    data: {
                        title: "Test Title For Text Aggregation",
                        keyword_type: ["Test", "Aggregation"],
                        content_type: ["neutral"],
                        content_accuracy: 0,
                        content_sources: 0,
                        content_language: 0,
                        content_clarity: 0,
                        content_references: 0,
                        content_logic: 0,
                        content_advertising: 0,
                        additional_rating: 0, // < 3, so additional_comment is required
                        additional_comment: comment3,
                    },
                });

            assert(!review3Error);

            // Trigger aggregation
            const { response, data } = await invokeAggregation(newCase.id);

            // Log error if status is not 200
            if (response.status !== 200) {
                console.error("Error response:", data);
            }

            assertEquals(response.status, 200);
            assertEquals(data.success, true);

            // Verify aggregation data
            const { data: aggregation, error: aggError } = await supabase
                .from("review_aggregations")
                .select("*")
                .eq("case_id", newCase.id)
                .single();

            assert(!aggError);
            assertExists(aggregation);

            const aggData = aggregation.data as {
                questions: Array<{
                    id: string;
                    fields: Array<{
                        id: string;
                        type: string;
                        answer_values?: string[];
                    }>;
                }>;
            };

            // Find the additional_comment_question (which contains additional_comment field)
            const additionalCommentQuestion = aggData.questions.find(
                (q) => q.id === "additional_comment_question",
            );
            assertExists(
                additionalCommentQuestion,
                "additional_comment_question should exist in aggregation",
            );

            // Find the additional_comment field
            const additionalCommentField = additionalCommentQuestion.fields.find(
                (f) => f.id === "additional_comment",
            );
            assertExists(
                additionalCommentField,
                "additional_comment field should exist",
            );

            // Verify it's a text-area type
            assertEquals(additionalCommentField.type, "text-area");

            // Verify answer_values array exists
            assertExists(
                additionalCommentField.answer_values,
                "answer_values should exist for text field",
            );

            // Verify all three comments are in the array
            assertEquals(
                additionalCommentField.answer_values.length,
                3,
                "Should have 3 aggregated comment values",
            );

            // Verify the specific comments are present
            assert(
                additionalCommentField.answer_values.includes(comment1),
                "Should include first comment",
            );
            assert(
                additionalCommentField.answer_values.includes(comment2),
                "Should include second comment",
            );
            assert(
                additionalCommentField.answer_values.includes(comment3),
                "Should include third comment",
            );

            // Verify that submit_question is NOT in the aggregation (it's in SKIPPED_QUESTION_IDS)
            const submitQuestion = aggData.questions.find(
                (q) => q.id === "submit_question",
            );
            assertEquals(
                submitQuestion,
                undefined,
                "submit_question should be skipped and not in aggregation",
            );
        } finally {
            // Cleanup
            await supabase.from("cases").delete().eq("id", newCase.id);
        }
    },
});
