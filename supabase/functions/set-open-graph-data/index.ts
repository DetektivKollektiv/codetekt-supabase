import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.1.13";
import { DOMParser } from "jsr:@b-fuze/deno-dom";
import { Database } from "../_shared/types/database.types.ts";

const requestSchema = z.object({
  case_id: z.string().uuid("Invalid case_id: must be a valid UUID"),
});

const urlSchema = z.string().url("Invalid URL format");

const ogDataSchema = z.object({
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogUrl: z.string().url().optional(),
  ogType: z.string().optional(),
  ogSiteName: z.string().optional(),
  ogLocale: z.string().optional(),
  ogImage: z.union([
    z.string().url(),
    z.array(z.object({
      url: z.string().url(),
      width: z.string().optional(),
      height: z.string().optional(),
      type: z.string().optional(),
      alt: z.string().optional(),
    }))
  ]).optional(),
  success: z.boolean().optional(),
  charset: z.string().optional(),
  requestUrl: z.string().url().optional(),
}).passthrough();

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Helper function to extract Open Graph data from HTML
async function fetchOpenGraphData(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Codetekt/1.0; +https://codetekt.com/bot)",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  if (!doc) {
    throw new Error("Failed to parse HTML");
  }

  // Extract Open Graph meta tags
  const metaTags = doc.querySelectorAll("meta");
  const ogData: Record<string, string | string[]> = {};

  metaTags.forEach((tag) => {
    const property = tag.getAttribute("property") || tag.getAttribute("name");
    const content = tag.getAttribute("content");

    if (property && content) {
      // Handle Open Graph tags (og:*)
      if (property.startsWith("og:")) {
        const key = property.replace("og:", "");

        // Handle image tags specially (can be multiple)
        if (key === "image" || key === "image:url") {
          if (!ogData.ogImage) {
            ogData.ogImage = [];
          }
          (ogData.ogImage as string[]).push(content);
        } else if (key === "image:width") {
          ogData.ogImageWidth = content;
        } else if (key === "image:height") {
          ogData.ogImageHeight = content;
        } else if (key === "image:alt") {
          ogData.ogImageAlt = content;
        } else {
          // Convert to camelCase (e.g., og:site_name -> ogSiteName)
          const camelKey = "og" + key.split("_").map((part, i) =>
            i === 0 ? part.charAt(0).toUpperCase() + part.slice(1) :
            part.charAt(0).toUpperCase() + part.slice(1)
          ).join("");
          ogData[camelKey] = content;
        }
      }
    }
  });

  return {
    error: false,
    result: ogData,
    response: { status: response.status },
  };
}

Deno.serve(async (req) => {
  try {
    // Step 1: Parse and validate request payload
    const json = await req.json().catch(() => null);
    const parsed = requestSchema.safeParse(json);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request payload",
          details: parsed.error.issues,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const { case_id } = parsed.data;

    // Step 2: Create service role client
    const supabaseServiceRole = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey,
    );

    // Step 3: Fetch case data and verify it exists
    const { data: caseData, error: caseError } = await supabaseServiceRole
      .from("cases")
      .select("id, content, content_type")
      .eq("id", case_id)
      .single();

    if (caseError || !caseData) {
      console.error("Case not found:", caseError);
      return new Response(
        JSON.stringify({ error: "Case not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 4: Verify case is a URL type
    if (caseData.content_type !== "url") {
      console.error("Invalid case type:", caseData.content_type);
      return new Response(
        JSON.stringify({
          error: "Invalid case type",
          details: "Case must have content_type='url'",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 5: Validate URL format
    const urlValidation = urlSchema.safeParse(caseData.content);

    if (!urlValidation.success) {
      console.error("Invalid URL format:", urlValidation.error);

      // Store failed status with validation error
      await supabaseServiceRole
        .from("open_graph_data")
        .upsert(
          {
            case_id: case_id,
            fetch_status: "failed",
            fetch_error: `Invalid URL format: ${urlValidation.error.issues[0].message}`,
            last_fetched_at: new Date().toISOString(),
          },
          {
            onConflict: "case_id",
          },
        );

      return new Response(
        JSON.stringify({
          success: true,
          fetch_status: "failed",
          error: "Invalid URL format",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    const url = urlValidation.data;

    // Step 6: Fetch Open Graph data
    let ogData;
    let fetchStatus: "success" | "partial" | "failed" = "success";
    let fetchError: string | null = null;
    let httpStatusCode: number | null = null;

    try {
      const { error, result, response } = await fetchOpenGraphData(url);

      if (error) {
        fetchStatus = "failed";
        fetchError = "Failed to fetch Open Graph data";
        console.error("OG fetch error:", error);
      } else {
        ogData = result;
        httpStatusCode = response?.status || null;

        // Check if we got partial data (no essential OG tags)
        if (!result.ogTitle && !result.ogDescription && !result.ogImage) {
          fetchStatus = "partial";
          console.warn("Partial OG data - missing essential tags");
        }
      }
    } catch (err) {
      fetchStatus = "failed";
      fetchError = err instanceof Error ? err.message : "Unknown error";
      console.error("OG fetch exception:", err);
    }

    // Step 7: Validate OG data structure (informational only)
    if (ogData && fetchStatus !== "failed") {
      const validation = ogDataSchema.safeParse(ogData);

      if (!validation.success) {
        console.warn("OG data validation failed:", validation.error);
        // Don't fail the operation - just log the warning
        // Raw data will still be stored for debugging
      }
    }

    // Step 8: Upsert to database
    // Extract image data - could be string or array
    const imageData = ogData?.ogImage
      ? (Array.isArray(ogData.ogImage) ? ogData.ogImage[0] : ogData.ogImage)
      : null;

    const { error: upsertError } = await supabaseServiceRole
      .from("open_graph_data")
      .upsert(
        {
          case_id: case_id,
          og_title: ogData?.ogTitle || null,
          og_description: ogData?.ogDescription || null,
          og_image: imageData || null,
          og_image_alt: ogData?.ogImageAlt || null,
          og_image_width: ogData?.ogImageWidth
            ? parseInt(ogData.ogImageWidth as string)
            : null,
          og_image_height: ogData?.ogImageHeight
            ? parseInt(ogData.ogImageHeight as string)
            : null,
          og_url: ogData?.ogUrl || null,
          og_type: ogData?.ogType || null,
          og_site_name: ogData?.ogSiteName || null,
          og_locale: ogData?.ogLocale || null,
          raw_data: ogData || null,
          fetch_status: fetchStatus,
          fetch_error: fetchError,
          http_status_code: httpStatusCode,
          last_fetched_at: new Date().toISOString(),
        },
        {
          onConflict: "case_id",
        },
      );

    if (upsertError) {
      console.error("Failed to save OG data:", upsertError);
      return new Response(
        JSON.stringify({
          error: "Failed to save OG data to database",
          details: upsertError.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 9: Return success response
    return new Response(
      JSON.stringify({
        success: true,
        fetch_status: fetchStatus,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Unexpected error in set-open-graph-data:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/set-open-graph-data' \
    --header 'Content-Type: application/json' \
    --data '{"case_id":"11111111-1111-4111-8111-111111111111"}'

*/
