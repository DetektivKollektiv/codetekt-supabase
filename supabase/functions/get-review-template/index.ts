/**
 * GET REVIEW TEMPLATE EDGE FUNCTION
 *
 * Returns a personalized review template for a case.
 *
 * Blocks access if:
 * - Case metadata (title, keywords, category) is not yet set in the DB
 * - Case has open/pending disputes on any field
 * - User is not authenticated
 * - Case or template not found
 *
 * Template building:
 * - Resolved disputes: admin's final_value locks the affected field
 *   (is_required=false, is_disabled=true, is_disputable=false)
 * - User's in-progress draft values are pre-populated into answer_value fields
 */

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.1.13";
import { corsHeaders } from "../_shared/cors.ts";
import { Field } from "../_shared/schemas/field-schemas.ts";
import { ReviewTemplateInput } from "../_shared/schemas/template-schemas.ts";
import { Database } from "../_shared/types/database.types.ts";
import {
  deepCloneTemplate,
  modifyFieldWithResolvedDispute,
  populateAnswerValues,
  replaceField,
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
  review_answers_in_progress:
    | Array<{
      id: string;
      reviewed_by: string;
      data: Record<string, unknown>;
      submitted_review_answers_id: string | null;
      has_unpublished_changes: boolean;
    }>
    | null;
  case_disputes:
    | Array<{
      metadata_field: string;
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

    // 3. Data Fetching — check metadata completeness and fetch case data in parallel
    const [metadataResult, caseResult] = await Promise.all([
      Promise.all([
        supabase.from("case_titles").select("id").eq("case_id", case_id)
          .maybeSingle(),
        supabase.from("case_keywords").select("id").eq("case_id", case_id)
          .limit(1).maybeSingle(),
        supabase.from("case_categories").select("id").eq("case_id", case_id)
          .maybeSingle(),
      ]),
      supabase
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
          case_disputes:cases_metadata_disputes!review_disputes_case_id_fkey (
            metadata_field,
            resolution,
            final_value
          )
        `)
        .eq("id", case_id)
        .single(),
    ]);

    const [titleResult, keywordsResult, categoryResult] = metadataResult;
    const { data: caseData, error: queryError } = caseResult;

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

    // Check metadata completeness — all three must exist before a review can start
    const missing: string[] = [];
    if (!titleResult.data) missing.push("title");
    if (!keywordsResult.data) missing.push("keywords");
    if (!categoryResult.data) missing.push("category");

    if (missing.length > 0) {
      return new Response(
        JSON.stringify({ error: "Case metadata incomplete", missing }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Check for open disputes
    const openDisputes = typedCaseData.case_disputes?.filter(
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

    // STEP 2: Apply resolved dispute modifications (locks fields with admin's final value)
    const resolvedDisputes = typedCaseData.case_disputes?.filter(
      (dispute) => dispute.resolution !== null && dispute.final_value !== null,
    ) || [];

    for (const dispute of resolvedDisputes) {
      for (const section of template) {
        const field = section.fields.find((f) =>
          f.id === dispute.metadata_field
        );
        if (field) {
          const modifiedField = modifyFieldWithResolvedDispute(
            field,
            dispute.final_value!,
          );
          template = replaceField(
            template,
            dispute.metadata_field,
            modifiedField as Field,
          );
          break;
        }
      }
    }

    // STEP 3: Populate user's draft values if exists
    const userInProgressReview = typedCaseData.review_answers_in_progress?.find(
      (ra) => ra.reviewed_by === userId,
    );

    if (userInProgressReview) {
      template = populateAnswerValues(template, userInProgressReview.data);
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
