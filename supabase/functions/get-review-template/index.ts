// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.1.13";
import { Database } from "../_shared/types/database.types.ts";
import { InProgressReviewAnswer } from "../_shared/schemas/review-schemas.ts";
import { ReviewTemplateInput } from "../_shared/schemas/template-schemas.ts";
import {
  aggregateContentTypes,
  aggregateKeywords,
  applyFieldModification,
  buildContentTypeModification,
  buildKeywordsModification,
  buildResolvedDisputeModification,
  deepCloneTemplate,
  populateAnswerValues,
} from "./template-modifier.ts";

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
  review_answers_in_progress: Array<{
    id: string;
    reviewed_by: string;
    data: InProgressReviewAnswer;
    submitted_review_answers_id: string | null;
    has_unpublished_changes: boolean;
  }> | null;
  review_answers_submitted: Array<{
    reviewed_by: string;
    data: unknown;
  }> | null;
  review_disputes: Array<{
    field_id: string;
    resolution: string | null;
    final_value: string | null;
  }> | null;
};

Deno.serve(async (req) => {
  try {
    // 1. Authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response("Missing Authorization header", { status: 401 });
    }

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      token,
    );

    if (userError || !user) {
      console.error("Error fetching user:", userError);
      return new Response("Unauthorized", { status: 401 });
    }

    console.log(
      `[get-review-template] User ${user.id} requesting template`,
    );

    // 2. Input Validation
    const json = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: parsed.error.issues,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { case_id } = parsed.data;
    console.log(`[get-review-template] Case ID: ${case_id}`);

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
      console.error("Case not found:", queryError);
      return new Response(
        JSON.stringify({ error: "Case not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const typedCaseData = caseData as unknown as CaseWithRelations;

    // Check if template exists
    if (
      !typedCaseData.review_templates ||
      !typedCaseData.review_templates.template
    ) {
      console.error("Template not found for case");
      return new Response(
        JSON.stringify({ error: "Template not found for case" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check for open disputes
    const openDisputes = typedCaseData.review_disputes?.filter(
      (dispute) => dispute.resolution === null,
    );

    if (openDisputes && openDisputes.length > 0) {
      console.error(`Case has ${openDisputes.length} pending disputes`);
      return new Response(
        JSON.stringify({
          error: "Case has pending disputes",
          dispute_count: openDisputes.length,
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // 5. Template Building Flow

    // STEP 1: Clone base template
    let template: ReviewTemplateInput[] = deepCloneTemplate(
      typedCaseData.review_templates.template,
    );

    // STEP 2: Get all submitted reviews
    const submittedReviews = typedCaseData.review_answers_submitted || [];

    console.log(
      `[get-review-template] Found ${submittedReviews.length} submitted reviews`,
    );

    // STEP 3: Aggregate metadata from submitted reviews
    const aggregatedKeywords = aggregateKeywords(submittedReviews);
    const aggregatedContentTypes = aggregateContentTypes(submittedReviews);

    console.log(
      `[get-review-template] Aggregated keywords: ${aggregatedKeywords.length}`,
    );
    console.log(
      `[get-review-template] Aggregated content types: ${aggregatedContentTypes.length}`,
    );

    // STEP 4: Build modifications based on reviewer status
    const keywordsMod = buildKeywordsModification(
      submittedReviews.length,
      aggregatedKeywords,
    );
    const contentTypeMod = buildContentTypeModification(
      submittedReviews.length,
      aggregatedContentTypes,
    );

    // STEP 5: Apply modifications to metadata fields
    template = applyFieldModification(template, "keyword_type", keywordsMod);
    template = applyFieldModification(template, "content_type", contentTypeMod);

    // STEP 5.5: Apply resolved dispute modifications (overrides aggregated values)
    const resolvedDisputes = typedCaseData.review_disputes?.filter(
      (dispute) => dispute.resolution !== null && dispute.final_value !== null,
    ) || [];

    console.log(
      `[get-review-template] Found ${resolvedDisputes.length} resolved disputes`,
    );

    for (const dispute of resolvedDisputes) {
      const disputeMod = buildResolvedDisputeModification(
        dispute.field_id,
        dispute.final_value!,
      );
      template = applyFieldModification(template, dispute.field_id, disputeMod);

      console.log(
        `[get-review-template] Applied resolved dispute for field: ${dispute.field_id}`,
      );
    }

    // STEP 6: Populate user's draft values if exists
    const userInProgressReview = typedCaseData.review_answers_in_progress?.find(
      (ra) => ra.reviewed_by === user.id,
    );

    if (userInProgressReview) {
      console.log(`[get-review-template] Populating in-progress values`);
      const inProgressData = userInProgressReview.data as Record<
        string,
        unknown
      >;
      template = populateAnswerValues(template, inProgressData);
    }

    // 6. Return Response
    return new Response(
      JSON.stringify(template),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
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
