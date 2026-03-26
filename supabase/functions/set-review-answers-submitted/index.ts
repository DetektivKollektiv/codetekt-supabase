/**
 * SET REVIEW ANSWERS SUBMITTED EDGE FUNCTION
 *
 * Publishes a reviewer's draft answers as a final submitted review.
 * Promotes in-progress draft to the submitted reviews table with strict validation.
 *
 * Process flow:
 * 1. Authenticates user and verifies draft ownership
 * 2. Fetches in-progress review by in_progress_id
 * 3. Validates data against strict submission schema (all required fields must be filled)
 * 4. Uses service role to write to protected review_answers_submitted table
 * 5. Updates in-progress tracking with optimistic locking (race condition protection)
 * 6. Links submitted review ID back to in-progress record
 *
 * Race condition handling:
 * - Captures updated_at timestamp before submission
 * - Uses optimistic locking when updating in-progress record
 * - If concurrent modification detected, preserves newer draft state
 * - Fallback: only links submitted_review_answers_id without clearing has_unpublished_changes
 *
 * Validation differences from in-progress:
 * - All required fields must be filled (strict schema)
 * - No partial submissions allowed
 * - Validation errors block submission
 *
 * Requirements:
 * - User must be authenticated
 * - User must own the draft (verified by reviewed_by field)
 * - Draft must exist with valid in_progress_id
 * - All required review fields must be completed
 *
 * Returns:
 * - Success response with saved: true and review_id
 * - Error if authentication fails
 * - Error if draft not found or user doesn't own it
 * - Error if validation fails (incomplete review)
 * - Error if database operations fail
 *
 * Database updates:
 * - Upserts to review_answers_submitted (on conflict: case_id, reviewed_by)
 * - Updates review_answers_in_progress: sets submitted_review_answers_id, clears has_unpublished_changes
 * - Uses service role key for writing to protected submitted table
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.1.13";
import { corsHeaders } from "../_shared/cors.ts";
import { Database } from "../_shared/types/database.types.ts";
import { validateSubmittedData } from "./validation.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const requestBodySchema = z.object({
  in_progress_id: z.string().uuid(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Step 1: Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    console.log("set-review-answers-submitted: Authenticating user");
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(
      token,
    );

    if (claimsError || !claims?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userId = claims.claims.sub;

    // Step 2: Parse and validate payload
    const body = await req.json();
    const parseResult = requestBodySchema.safeParse(body);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: parseResult.error.issues,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { in_progress_id } = parseResult.data;

    // Step 3: Fetch in-progress draft (verify ownership)
    const { data: inProgressReview, error: fetchError } = await supabase
      .from("review_answers_in_progress")
      .select("*")
      .eq("id", in_progress_id)
      .eq("reviewed_by", userId) // CRITICAL: Verify user owns the draft
      .single();

    if (fetchError || !inProgressReview) {
      return new Response(
        JSON.stringify({
          error: "Draft not found or you don't have permission to publish it",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Capture updated_at for optimistic locking (race condition protection)
    const originalUpdatedAt = inProgressReview.updated_at;

    // Step 3.5: Check if case has factcheck=true (skip strict review validation)
    const { data: factcheckData, error: factcheckError } = await supabase
      .from("case_factchecks")
      .select("has_factcheck")
      .eq("case_id", inProgressReview.case_id)
      .eq("has_factcheck", true)
      .maybeSingle();

    if (factcheckError) {
      return new Response(
        JSON.stringify({
          error: "Failed to check case factcheck status",
          details: factcheckError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const hasFactcheck = factcheckData?.has_factcheck === true;

    let submittedData: Record<string, unknown>;

    if (hasFactcheck) {
      const rawData = inProgressReview.data;
      submittedData =
        rawData && typeof rawData === "object" && !Array.isArray(rawData)
          ? rawData as Record<string, unknown>
          : {};
    } else {
      // Step 4: Fetch category for the case to select the correct schema
      const { data: categoryData, error: categoryError } = await supabase
        .from("case_categories")
        .select("value")
        .eq("case_id", inProgressReview.case_id)
        .maybeSingle();

      if (categoryError || !categoryData) {
        return new Response(
          JSON.stringify({
            error:
              "Case category not set. Please set the case category before publishing.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Step 4.1: Validate data with category-specific strict schema
      const validation = validateSubmittedData(
        inProgressReview.data as Record<string, unknown>,
        categoryData.value,
      );

      if (!validation.success) {
        return new Response(
          JSON.stringify(validation.error),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      submittedData = validation.validatedData;
    }

    // Step 5: Create service_role client for writing to protected table
    const supabaseServiceRole = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey,
    );

    // Step 6: Upsert to review_answers_submitted table
    const { data: submittedReview, error: upsertError } =
      await supabaseServiceRole
        .from("review_answers_submitted")
        .upsert({
          case_id: inProgressReview.case_id,
          reviewed_by: userId,
          data: submittedData as never,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "case_id,reviewed_by",
        })
        .select()
        .single();

    if (upsertError || !submittedReview) {
      console.error("Failed to upsert submitted review:", upsertError);
      return new Response(
        JSON.stringify({
          error: "Failed to publish review",
          details: upsertError?.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Step 7: Update in-progress tracking (with race condition protection)
    const { data: updateResult, error: updateError } = await supabase
      .from("review_answers_in_progress")
      .update({
        submitted_review_answers_id: submittedReview.id,
        has_unpublished_changes: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", in_progress_id)
      .eq("updated_at", originalUpdatedAt) // Optimistic lock
      .select("id");

    // If no rows updated (race condition), fallback to linking only
    if (!updateResult || updateResult.length === 0) {
      console.warn(
        "Race condition detected: in-progress review was modified during publish. " +
          "Linking submitted_review_answers_id only, preserving newer draft state.",
      );

      const { error: fallbackError } = await supabase
        .from("review_answers_in_progress")
        .update({
          submitted_review_answers_id: submittedReview.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", in_progress_id);

      if (fallbackError) {
        console.error("Fallback update failed:", fallbackError);
      }
    } else if (updateError) {
      console.error("Failed to update in-progress tracking:", updateError);
      // Don't fail the request - the review was published successfully
    }

    // Step 8: Return success response
    return new Response(
      JSON.stringify({
        saved: true,
        review_id: submittedReview.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Unexpected error in set-review-answers-submitted:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
