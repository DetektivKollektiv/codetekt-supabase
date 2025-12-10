// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.1.13";
import { Database } from "../_shared/types/database.types.ts";
import {
  aggregateContentTypes,
  aggregateKeywords,
  applyFieldModification,
  buildContentTypeModification,
  buildKeywordsModification,
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
  review_answers: {
    status: string;
    reviewed_by: string;
    data: unknown;
  }[] | null;
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
        review_answers!review_answers_case_id_fkey (
          status,
          reviewed_by,
          data
        )
      `)
      .eq("id", case_id)
      .single();

    // 4. Authorization Checks
    if (queryError || !caseData) {
      console.error("Case not found:", queryError);
      return new Response(
        JSON.stringify({ error: "Case not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const typedCaseData = caseData as unknown as CaseWithRelations;

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

    // Check if user already submitted a review
    const userSubmittedReview = typedCaseData.review_answers?.find(
      (ra) => ra.reviewed_by === user.id && ra.status === "submitted",
    );

    if (userSubmittedReview) {
      return new Response(
        JSON.stringify({
          error: "You have already submitted a review for this case",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } },
      );
    }

    // 5. Template Processing
    let template = deepCloneTemplate(typedCaseData.review_templates.template);

    // Filter submitted reviews
    const submittedReviews = (typedCaseData.review_answers || []).filter(
      (ra) => ra.status === "submitted",
    );

    console.log(
      `[get-review-template] Found ${submittedReviews.length} submitted reviews`,
    );

    // Aggregate metadata separately
    const aggregatedKeywords = aggregateKeywords(submittedReviews);
    const aggregatedContentTypes = aggregateContentTypes(submittedReviews);

    console.log(
      `[get-review-template] Aggregated keywords: ${aggregatedKeywords.length}`,
    );
    console.log(
      `[get-review-template] Aggregated content types: ${aggregatedContentTypes.length}`,
    );

    // Build modifications based on reviewer status
    const keywordsMod = buildKeywordsModification(
      submittedReviews.length,
      aggregatedKeywords,
    );
    const contentTypeMod = buildContentTypeModification(
      submittedReviews.length,
      aggregatedContentTypes,
    );

    // Apply modifications separately for each field
    template = applyFieldModification(template, "keyword_type", keywordsMod);
    template = applyFieldModification(template, "content_type", contentTypeMod);

    // Populate in-progress values if exists (in answer_value!)
    const userInProgressReview = typedCaseData.review_answers?.find(
      (ra) => ra.reviewed_by === user.id && ra.status === "in_progress",
    );

    if (userInProgressReview) {
      console.log(`[get-review-template] User has in-progress review`);
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
