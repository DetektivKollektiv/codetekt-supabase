import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { aggregateReviews, Review } from "../_shared/aggregation.ts";
import { Database } from "../_shared/database.types.ts";
import {
  ReviewData,
  TemplateField,
  validateFieldValue,
} from "../_shared/types.ts";

console.log("set-review function started");

interface SetReviewRequest {
  case_id: string;
  data: ReviewData;
  status?: "in_progress" | "submitted";
}

Deno.serve(async (req) => {
  try {
    // ============================================
    // 1. AUTH: Get user from JWT
    // ============================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    // Client mit User-Auth für Validation
    const supabaseClient = createClient<Database>(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    );

    // Get authenticated user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth
      .getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(`Processing review for user: ${user.id}`);

    // ============================================
    // 2. PARSE REQUEST
    // ============================================
    const { case_id, data, status = "submitted" }: SetReviewRequest = await req
      .json();

    if (!case_id || !data) {
      return new Response(
        JSON.stringify({ error: "case_id and data are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // ============================================
    // 3. VALIDATE: Load case and template
    // ============================================
    const { data: caseData, error: caseError } = await supabaseClient
      .from("cases")
      .select("id, template_version")
      .eq("id", case_id)
      .single();

    if (caseError || !caseData) {
      return new Response(
        JSON.stringify({ error: "Case not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Load template for validation
    const { data: template, error: templateError } = await supabaseClient
      .from("review_templates")
      .select("template")
      .eq("version", caseData.template_version)
      .single();

    if (templateError || !template) {
      return new Response(
        JSON.stringify({ error: "Template not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validate review data against template
    const validationErrors: Record<string, string> = {};
    const fields = (template.template as any).metadata?.fields || [];

    for (const field of fields as TemplateField[]) {
      const value = data[field.id];

      if (field.required && status === "submitted" && value === undefined) {
        validationErrors[field.id] = "Field is required";
        continue;
      }

      if (value !== undefined) {
        const validation = validateFieldValue(field, value);
        if (!validation.valid) {
          validationErrors[field.id] = validation.error!;
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          validation_errors: validationErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log("Validation passed");

    // ============================================
    // 4. UPSERT REVIEW (with service role to bypass RLS)
    // ============================================

    // WARUM SERVICE ROLE SICHER IST:
    // 1. User ist bereits via JWT authentifiziert (Zeile 34-46)
    // 2. Case ownership wird nicht geprüft (jeder darf reviewen)
    // 3. reviewed_by wird auf authenticated user.id gesetzt
    // 4. Service role wird NUR für den DB-Write verwendet
    // 5. Alle Business Logic (Validation, Auth) wurde vorher mit User-Context gemacht

    const supabaseAdmin = createClient<Database>(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const reviewData = {
      case_id,
      reviewed_by: user.id, // <- User aus JWT (authentifiziert!)
      status,
      data,
      submitted_at: status === "submitted" ? new Date().toISOString() : null,
    };

    const { data: review, error: reviewError } = await supabaseAdmin
      .from("reviews")
      .upsert(reviewData, {
        onConflict: "case_id,reviewed_by",
      })
      .select()
      .single();

    if (reviewError) {
      console.error("Error upserting review:", reviewError);
      return new Response(
        JSON.stringify({
          error: "Failed to save review",
          details: reviewError,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(`Review saved: ${review.id}`);

    // ============================================
    // 5. CHECK IF AGGREGATION NEEDED
    // ============================================
    if (status === "submitted") {
      const { count, error: countError } = await supabaseClient
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("case_id", case_id)
        .eq("status", "submitted");

      if (countError) {
        console.error("Error counting reviews:", countError);
        // Don't fail the request, review was saved successfully
        return new Response(
          JSON.stringify({
            success: true,
            review_id: review.id,
            message: "Review saved but aggregation check failed",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      console.log(`Submitted reviews count: ${count}`);

      // ============================================
      // 6. TRIGGER AGGREGATION IF >= 3 REVIEWS
      // ============================================
      if (count && count >= 3) {
        console.log("Triggering aggregation...");

        // Load all submitted reviews
        const { data: allReviews, error: reviewsError } = await supabaseClient
          .from("reviews")
          .select("id, reviewed_by, data")
          .eq("case_id", case_id)
          .eq("status", "submitted");

        if (reviewsError || !allReviews) {
          console.error("Error loading reviews for aggregation:", reviewsError);
          return new Response(
            JSON.stringify({
              success: true,
              review_id: review.id,
              message: "Review saved but aggregation failed",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        // Type assertion + filtering for null data
        const typedReviews: Review[] = allReviews
          .filter((r) => r.data != null)
          .map((r) => ({
            id: r.id,
            reviewed_by: r.reviewed_by,
            data: r.data as unknown as ReviewData,
          }));

        // Aggregate reviews using shared function
        let aggregationResult;
        try {
          aggregationResult = aggregateReviews(
            typedReviews,
            template.template as any,
          );
        } catch (error) {
          console.error("Aggregation failed:", error);
          return new Response(
            JSON.stringify({
              success: true,
              review_id: review.id,
              message: "Review saved but aggregation failed",
              error: error instanceof Error ? error.message : "Unknown error",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        console.log("Aggregation result:", aggregationResult);

        // ============================================
        // 7. SAVE AGGREGATED REVIEW (with service role)
        // ============================================

        // Service role wird hier benötigt weil:
        // - aggregated_reviews hat Policy "Only service role can insert"
        // - Das ist bewusst so: Nur automatische Aggregation darf schreiben
        // - Verhindert dass User manuell Aggregationen manipulieren

        // Type-safe insert object
        const aggregatedReviewInsert = {
          case_id,
          result_score: aggregationResult.result_score,
          data: aggregationResult
            .data as unknown as Database["public"]["Tables"][
              "aggregated_reviews"
            ]["Insert"]["data"],
          reviewer_ids: aggregationResult.reviewer_ids,
          calculated_at: new Date().toISOString(),
        };

        const { error: aggError } = await supabaseAdmin
          .from("aggregated_reviews")
          .upsert(aggregatedReviewInsert, {
            onConflict: "case_id",
          });
        if (aggError) {
          console.error("Error saving aggregated review:", aggError);
          return new Response(
            JSON.stringify({
              success: true,
              review_id: review.id,
              message: "Review saved but failed to save aggregation",
              error: aggError.message,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }

        console.log("Aggregation saved successfully");

        return new Response(
          JSON.stringify({
            success: true,
            review_id: review.id,
            aggregated: true,
            result_score: aggregationResult.result_score,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // ============================================
    // 8. SUCCESS (no aggregation needed)
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        review_id: review.id,
        aggregated: false,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in set-review:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start`
  2. Run `supabase functions serve set-review`
  3. Get a user auth token
  4. Make an HTTP request:

  # Login
  curl -X POST 'http://127.0.0.1:54321/auth/v1/token?grant_type=password' \
    --header 'apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"email": "gorm-labenz@hotmail.com", "password": "testpassword123"}'

  # Submit review (use access_token from login response)
  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/set-review' \
    --header 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
    --header 'Content-Type: application/json' \
    --data '{
      "case_id": "11111111-1111-1111-1111-111111111111",
      "status": "submitted",
      "data": {
        "keyword_type": ["Ukraine", "Krieg"],
        "content_type": ["nachrichtenartikel"],
        "grammar": 3,
        "structure": 3,
        "headline": 2
      }
    }'

*/
