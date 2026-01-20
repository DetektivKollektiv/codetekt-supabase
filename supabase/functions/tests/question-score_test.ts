// Test file for question score calculation in set-review-aggregation
import { assert, assertEquals, assertExists } from "jsr:@std/assert@1";
import "jsr:@std/dotenv/load";
import { createClient } from "npm:@supabase/supabase-js@2";

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

// Test: Question score is the lowest average among all fields in the question
Deno.test({
    name:
        "question-score - calculates question score as lowest field average in question",
    sanitizeResources: false,
    sanitizeOps: false,
    fn: async () => {
        const supabase = createServiceRoleClient();

        const { data: newCase, error: caseError } = await supabase
            .from("cases")
            .insert({
                submitted_by: TEST_USER_GORM,
                content: "http://example.com/question-score-test",
                content_type: "url",
                template_version: 1,
            })
            .select()
            .single();

        assert(!caseError);
        assertExists(newCase);

        try {
            // Add three reviews with different values
            // content_logic: reviewer 1=0, reviewer 2=1, reviewer 3=2 -> average 1.0
            // content_clarity: reviewer 1=1, reviewer 2=2, reviewer 3=3 -> average 2.0
            // content_sources: reviewer 1=0, reviewer 2=0, reviewer 3=1 -> average 0.33
            // Expected question score: min(1.0, 2.0, 0.33, ...) = lowest average
            const { error: review1Error } = await supabase
                .from("review_answers_submitted")
                .insert({
                    case_id: newCase.id,
                    reviewed_by: TEST_USER_GORM,
                    data: {
                        title: "Test Title For Review Score",
                        keyword_type: ["Test"],
                        content_type: ["neutral"],
                        content_accuracy: 0,
                        content_sources: 0, // Will be lowest
                        content_language: 1,
                        content_clarity: 1,
                        content_references: 1,
                        content_logic: 0,
                        content_advertising: 1,
                        additional_rating: 3,
                        additional_comment: null,
                    },
                });

            assert(!review1Error);

            const { error: review2Error } = await supabase
                .from("review_answers_submitted")
                .insert({
                    case_id: newCase.id,
                    reviewed_by: TEST_USER_VALENTIN,
                    data: {
                        title: "Test Title For Review Score",
                        keyword_type: ["Test"],
                        content_type: ["neutral"],
                        content_accuracy: 0,
                        content_sources: 0, // Will be lowest
                        content_language: 1,
                        content_clarity: 2,
                        content_references: 1,
                        content_logic: 1,
                        content_advertising: 1,
                        additional_rating: 3,
                        additional_comment: null,
                    },
                });

            assert(!review2Error);

            const { error: review3Error } = await supabase
                .from("review_answers_submitted")
                .insert({
                    case_id: newCase.id,
                    reviewed_by: TEST_USER_CUNEYT,
                    data: {
                        title: "Test Title For Review Score",
                        keyword_type: ["Test"],
                        content_type: ["neutral"],
                        content_accuracy: 1,
                        content_sources: 1, // Will be lowest
                        content_language: 2,
                        content_clarity: 3,
                        content_references: 2,
                        content_logic: 2,
                        content_advertising: 2,
                        additional_rating: 3,
                        additional_comment: null,
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
                    score: number;
                    fields: Array<{
                        id: string;
                        average: number;
                    }>;
                }>;
            };

            // Find the content_question
            const contentQuestion = aggData.questions.find(
                (q) => q.id === "content_question",
            );
            assertExists(contentQuestion, "content_question should exist");
            assertExists(contentQuestion.score, "question score should exist");

            // Verify score is the lowest average among all fields
            const fieldAverages = contentQuestion.fields.map((f) => f.average);
            const expectedScore = Math.min(...fieldAverages);

            assertEquals(
                contentQuestion.score,
                expectedScore,
                `Question score should be ${expectedScore} (lowest field average), got ${contentQuestion.score}`,
            );

            // Find content_sources field and verify it has the lowest average
            const sourcesField = contentQuestion.fields.find(
                (f) => f.id === "content_sources",
            );
            assertExists(sourcesField, "content_sources field should exist");

            // content_sources: 0, 0, 1 -> average 0.33...
            const expectedSourcesAverage = (0 + 0 + 1) / 3;
            assertEquals(
                Math.round(sourcesField.average * 100) / 100,
                Math.round(expectedSourcesAverage * 100) / 100,
                "content_sources should have average ~0.33",
            );

            // Verify question score equals the lowest field average (content_sources)
            assertEquals(
                Math.round(contentQuestion.score * 100) / 100,
                Math.round(expectedSourcesAverage * 100) / 100,
                "Question score should equal lowest field average (content_sources)",
            );
        } finally {
            // Cleanup
            await supabase.from("cases").delete().eq("id", newCase.id);
        }
    },
});
