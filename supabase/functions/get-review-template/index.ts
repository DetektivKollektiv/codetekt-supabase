/**
 * GET REVIEW TEMPLATE EDGE FUNCTION
 *
 * Returns a personalized review template for a case based on:
 * - User's reviewer status (first reviewer vs. subsequent reviewers)
 * - Aggregated metadata from existing submitted reviews (title, keywords, content types)
 * - Resolved disputes (admin's final values lock fields and disable editing)
 * - User's in-progress review data (pre-populates answer values)
 *
 * Blocks access if:
 * - Case has open/pending disputes on any field
 * - User is not authenticated
 * - Case or template not found
 *
 * Metadata field behavior:
 * - First reviewer:
 *   - All metadata fields (title, keywords, content_type) are required and editable
 *   - No initial_answer_value set
 *
 * - Subsequent reviewers:
 *   - Title: initial_answer_value set from first reviewer's submission
 *   - Content type: initial_answer_value set from first reviewer's submission
 *   - Keywords: initial_answer_value set with all keywords from all reviewers (deduplicated), additional_option_count=3
 *   - All metadata fields: is_required=false, is_disabled=true, is_disputable=true
 *
 * - Resolved disputes (any field):
 *   - initial_answer_value set to admin's final_value
 *   - is_required=false, is_disabled=true, is_disputable=false (locked, non-disputable)
 */

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.1.13";
import { corsHeaders } from "../_shared/cors.ts";
import {
  chipFieldSchema,
  multiLineTextFieldSchema,
  textFieldSchema,
} from "../_shared/schemas/field-schemas.ts";
import { InProgressReviewAnswer } from "../_shared/schemas/review-schemas.ts";
import { ReviewTemplateInput } from "../_shared/schemas/template-schemas.ts";
import { Database } from "../_shared/types/database.types.ts";
import {
  aggregateContentTypes,
  aggregateKeywords,
  aggregateTitle,
  deepCloneTemplate,
  modifyContentTypeField,
  modifyFieldWithResolvedDispute,
  modifyKeywordsField,
  modifyTitleField,
  populateAnswerValues,
  replaceField,
} from "./template-modifier.ts";

type ChipField = z.infer<typeof chipFieldSchema>;
type MultiLineTextField = z.infer<typeof multiLineTextFieldSchema>;
type TextField = z.infer<typeof textFieldSchema>;

// Request validation schema
const requestSchema = z.object({
  case_id: z.string().uuid(),
});

// Environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

// Type definitions
type CaseWithRelations = {
  id: string;
  template_version: number;
  review_templates: {
    template: unknown;
  } | null;
  review_answers_in_progress:
    | Array<{
      id: string;
      reviewed_by: string;
      data: InProgressReviewAnswer;
      submitted_review_answers_id: string | null;
      has_unpublished_changes: boolean;
    }>
    | null;
  review_answers_submitted:
    | Array<{
      reviewed_by: string;
      data: unknown;
    }>
    | null;
  review_disputes:
    | Array<{
      field_id: string;
      resolution: string | null;
      final_value: string | null;
    }>
    | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authentication

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Missing Authorization header", {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Use getClaims() for ES256 token support (new JWT Signing Keys)
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(
      token,
    );

    if (claimsError || !claims?.claims?.sub) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = claims.claims.sub;

    // 2. Input Validation
    const json = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: parsed.error.issues,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { case_id } = parsed.data;

    // 3. Data Fetching (single optimized query)
    const { data: caseData, error: queryError } = await supabase
      .from("cases")
      .select(`
        id,
        template_version,
        review_templates!cases_template_version_fkey (
          template
        ),
        review_answers_in_progress!review_answers_in_progress_case_id_fkey (
          id,
          reviewed_by,
          data,
          submitted_review_answers_id,
          has_unpublished_changes
        ),
        review_answers_submitted!review_answers_submitted_case_id_fkey (
          reviewed_by,
          data
        ),
        review_disputes!review_disputes_case_id_fkey (
          field_id,
          resolution,
          final_value
        )
      `)
      .eq("id", case_id)
      .single();

    // 4. Authorization Checks

    // Check if case exists
    if (queryError || !caseData) {
      return new Response(
        JSON.stringify({ error: "Case not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const typedCaseData = caseData as unknown as CaseWithRelations;

    // Check if template exists
    if (
      !typedCaseData.review_templates ||
      !typedCaseData.review_templates.template
    ) {
      return new Response(
        JSON.stringify({ error: "Template not found for case" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check for open disputes (especially on metadata fields like title)
    const openDisputes = typedCaseData.review_disputes?.filter(
      (dispute) => dispute.resolution === null,
    );

    if (openDisputes && openDisputes.length > 0) {
      return new Response(
        JSON.stringify({
          error: "Case has pending disputes",
          dispute_count: openDisputes.length,
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 5. Template Building Flow

    // STEP 1: Clone base template
    let template: ReviewTemplateInput[] = deepCloneTemplate(
      typedCaseData.review_templates.template,
    );

    // STEP 2: Get all submitted reviews
    const submittedReviews = typedCaseData.review_answers_submitted || [];

    // STEP 3: Aggregate metadata from submitted reviews
    const aggregatedKeywords = aggregateKeywords(submittedReviews);
    const aggregatedContentTypes = aggregateContentTypes(submittedReviews);
    const aggregatedTitle = aggregateTitle(submittedReviews);

    // STEP 4: Modify metadata fields based on reviewer status
    // Find and modify title field
    for (const section of template) {
      const titleField = section.fields.find(
        (f) => f.id === "title" && f.type === "text",
      );
      if (titleField && titleField.type === "text") {
        const modifiedField = modifyTitleField(
          titleField,
          submittedReviews.length,
          aggregatedTitle,
        );
        template = replaceField(template, "title", modifiedField);
      }

      // Find and modify keywords field
      const keywordsField = section.fields.find(
        (f) => f.id === "keyword_type" && f.type === "multi-line-text",
      );
      if (keywordsField && keywordsField.type === "multi-line-text") {
        const modifiedField = modifyKeywordsField(
          keywordsField,
          submittedReviews.length,
          aggregatedKeywords,
        );
        template = replaceField(template, "keyword_type", modifiedField);
      }

      // Find and modify content type field
      const contentTypeField = section.fields.find(
        (f) => f.id === "content_type" && f.type === "chip",
      );
      if (contentTypeField && contentTypeField.type === "chip") {
        const modifiedField = modifyContentTypeField(
          contentTypeField,
          submittedReviews.length,
          aggregatedContentTypes,
        );
        template = replaceField(template, "content_type", modifiedField);
      }
    }

    // STEP 5: Apply resolved dispute modifications (overrides aggregated values)
    const resolvedDisputes = typedCaseData.review_disputes?.filter(
      (dispute) => dispute.resolution !== null && dispute.final_value !== null,
    ) || [];

    for (const dispute of resolvedDisputes) {
      // Find the field to modify
      for (const section of template) {
        const field = section.fields.find((f) => f.id === dispute.field_id);
        if (field) {
          const modifiedField = modifyFieldWithResolvedDispute(
            field,
            dispute.final_value!,
          );
          template = replaceField(
            template,
            dispute.field_id,
            modifiedField as ChipField | MultiLineTextField | TextField,
          );
          break;
        }
      }
    }

    // STEP 5.5: Disable comment field if user has already submitted a review
    const userHasSubmittedReview = submittedReviews.some(
      (review) => review.reviewed_by === userId,
    );

    if (userHasSubmittedReview) {
      for (const section of template) {
        const commentField = section.fields.find(
          (f) => f.id === "comment" && f.type === "text-area",
        );
        if (commentField) {
          commentField.is_disabled = true;
          commentField.is_required = false;
          // is_shown defaults to true, so field remains visible
          break;
        }
      }
    }

    // STEP 6: Populate user's draft values if exists
    const userInProgressReview = typedCaseData.review_answers_in_progress?.find(
      (ra) => ra.reviewed_by === userId,
    );

    if (userInProgressReview) {
      const inProgressData = userInProgressReview.data as Record<
        string,
        unknown
      >;
      template = populateAnswerValues(template, inProgressData);
    }

    // 6. Return Response
    return new Response(
      JSON.stringify(template),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-review-template' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiJhYWFhYWFhYS1hYWFhLWFhYWEtYWFhYS1hYWFhYWFhYWFhYWEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY1Mzg4NTkzLCJpYXQiOjE3NjUzODQ5OTMsImVtYWlsIjoiZ29ybS1sYWJlbnpAaG90bWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImZ1bGxfbmFtZSI6Ikdvcm0gTGFiZW56In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjUzODQ5OTN9XSwic2Vzc2lvbl9pZCI6ImNhMjI5ZWVmLWY5MmEtNDhmMy04MWQ3LTdjNWEyZjc2NzZmZCIsImlzX2Fub255bW91cyI6ZmFsc2V9.YWmrB9w8o7afDlMgk6Abo24qTInBTcZd2LJeTApuBZ4' \
    --header 'Content-Type: application/json' \
    --data '{"case_id":"11111111-1111-4111-8111-111111111111"}'

*/
