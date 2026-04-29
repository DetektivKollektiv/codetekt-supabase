import { timingSafeEqual } from "jsr:@std/crypto/timing-safe-equal";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { DOMParser } from "jsr:@b-fuze/deno-dom";
import { Database } from "../_shared/types/database.types.ts";
import {
  openGraphDataSchema,
  setOpenGraphDataRequestSchema,
  urlSchema,
} from "../_shared/schemas/index.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const enc = new TextEncoder();
const FETCH_TIMEOUT_MS = 5000;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set([
  "application/xhtml+xml",
  "text/html",
]);
const BLOCKED_HOSTNAMES = new Set([
  "host.containers.internal",
  "host.docker.internal",
  "localhost",
]);
const BLOCKED_HOSTNAME_SUFFIXES = [
  ".docker",
  ".home",
  ".internal",
  ".lan",
  ".local",
  ".localhost",
];

class OpenGraphFetchError extends Error {
  constructor(message: string, readonly statusCode: number | null = null) {
    super(message);
    this.name = "OpenGraphFetchError";
  }
}

function normalizeHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
}

function parseIpv4(hostname: string): number[] | null {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    return null;
  }

  const parts = hostname.split(".").map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return null;
  }

  return parts;
}

function isPrivateOrLocalIpv4(hostname: string) {
  const parts = parseIpv4(hostname);
  if (!parts) {
    return false;
  }

  const [first, second] = parts;
  return first === 10 ||
    first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168);
}

function isPrivateOrLocalIpv6(hostname: string) {
  const normalized = normalizeHostname(hostname);
  return normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb");
}

function isPrivateOrLocalIpLiteral(hostname: string) {
  return isPrivateOrLocalIpv4(hostname) || isPrivateOrLocalIpv6(hostname);
}

async function resolvePublicIpAddresses(hostname: string) {
  const resolvedAddresses = new Set<string>();

  for (const recordType of ["A", "AAAA"] as const) {
    try {
      const addresses = await Deno.resolveDns(hostname, recordType);
      for (const address of addresses) {
        resolvedAddresses.add(normalizeHostname(address));
      }
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) {
        continue;
      }

      throw new OpenGraphFetchError(
        `Could not resolve hostname: ${hostname}`,
      );
    }
  }

  if (resolvedAddresses.size === 0) {
    throw new OpenGraphFetchError(`Could not resolve hostname: ${hostname}`);
  }

  for (const address of resolvedAddresses) {
    if (isPrivateOrLocalIpLiteral(address)) {
      throw new OpenGraphFetchError(
        "Private, loopback, and link-local IP targets are not allowed",
      );
    }
  }
}

function isBlockedHostname(hostname: string) {
  const normalized = normalizeHostname(hostname);
  return normalized.length === 0 ||
    BLOCKED_HOSTNAMES.has(normalized) ||
    BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => normalized.endsWith(suffix)) ||
    !normalized.includes(".");
}

async function assertSafeOpenGraphUrl(rawUrl: string) {
  const parsedUrl = new URL(rawUrl);
  const hostname = normalizeHostname(parsedUrl.hostname);

  if (parsedUrl.protocol !== "https:") {
    throw new OpenGraphFetchError("Only https URLs are allowed");
  }

  if (isBlockedHostname(hostname)) {
    throw new OpenGraphFetchError("Internal hostnames are not allowed");
  }

  if (isPrivateOrLocalIpLiteral(hostname)) {
    throw new OpenGraphFetchError(
      "Private, loopback, and link-local IP targets are not allowed",
    );
  }

  await resolvePublicIpAddresses(hostname);
  return parsedUrl;
}

function isAllowedContentType(contentType: string | null) {
  if (!contentType) {
    return false;
  }

  const mimeType = contentType.split(";")[0].trim().toLowerCase();
  return ALLOWED_CONTENT_TYPES.has(mimeType);
}

async function readResponseTextWithLimit(response: Response) {
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const parsedLength = Number.parseInt(contentLength, 10);
    if (!Number.isNaN(parsedLength) && parsedLength > MAX_RESPONSE_BYTES) {
      throw new OpenGraphFetchError(
        `Response body exceeds ${MAX_RESPONSE_BYTES} bytes`,
        response.status,
      );
    }
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return "";
  }

  const decoder = new TextDecoder();
  let totalBytes = 0;
  let html = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    totalBytes += value.byteLength;
    if (totalBytes > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw new OpenGraphFetchError(
        `Response body exceeds ${MAX_RESPONSE_BYTES} bytes`,
        response.status,
      );
    }

    html += decoder.decode(value, { stream: true });
  }

  html += decoder.decode();
  return html;
}

// Helper function to extract Open Graph data from HTML
async function fetchOpenGraphData(url: string) {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Codetekt/1.0; +https://codetekt.com/bot)",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "AbortError" || error.name === "TimeoutError")
    ) {
      throw new OpenGraphFetchError(
        `Request timed out after ${FETCH_TIMEOUT_MS}ms`,
      );
    }
    throw error;
  }

  if (response.status >= 300 && response.status < 400) {
    throw new OpenGraphFetchError("Redirects are not allowed", response.status);
  }

  if (!response.ok) {
    throw new OpenGraphFetchError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status,
    );
  }

  const contentType = response.headers.get("content-type");
  if (!isAllowedContentType(contentType)) {
    throw new OpenGraphFetchError(
      `Unsupported content-type: ${contentType ?? "missing"}`,
      response.status,
    );
  }

  const html = await readResponseTextWithLimit(response);
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  if (!doc) {
    throw new OpenGraphFetchError("Failed to parse HTML", response.status);
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
    const expected = Deno.env.get("DB_WEBHOOK_SECRET") ?? "";
    const incoming = req.headers.get("x-db-secret") ?? "";
    const expectedBytes = enc.encode(expected);
    const incomingBytes = enc.encode(incoming);
    const authorized = expectedBytes.length > 0 &&
      expectedBytes.length === incomingBytes.length &&
      timingSafeEqual(expectedBytes, incomingBytes);

    if (!authorized) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Step 1: Parse and validate request payload
    const json = await req.json().catch(() => null);
    const parsed = setOpenGraphDataRequestSchema.safeParse(json);

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
    let safeUrl: URL;
    try {
      safeUrl = await assertSafeOpenGraphUrl(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unsafe URL";

      await supabaseServiceRole
        .from("open_graph_data")
        .upsert(
          {
            case_id: case_id,
            fetch_status: "failed",
            fetch_error: message,
            last_fetched_at: new Date().toISOString(),
          } as never,
          {
            onConflict: "case_id",
          },
        );

      return new Response(
        JSON.stringify({
          success: true,
          fetch_status: "failed",
          error: message,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    // Step 6: Fetch Open Graph data
    let ogData;
    let fetchStatus: "success" | "partial" | "failed" = "success";
    let fetchError: string | null = null;
    let httpStatusCode: number | null = null;

    try {
      const { result, response } = await fetchOpenGraphData(safeUrl.toString());
      ogData = result;
      httpStatusCode = response.status;

      // Check if we got partial data (no essential OG tags)
      if (!result.ogTitle && !result.ogDescription && !result.ogImage) {
        fetchStatus = "partial";
        console.warn("Partial OG data - missing essential tags");
      }
    } catch (err) {
      fetchStatus = "failed";
      fetchError = err instanceof Error ? err.message : "Unknown error";
      if (err instanceof OpenGraphFetchError) {
        httpStatusCode = err.statusCode;
      }
      console.error("OG fetch exception:", err);
    }

    // Step 7: Validate OG data structure (informational only)
    if (ogData && fetchStatus !== "failed") {
      const validation = openGraphDataSchema.safeParse(ogData);

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
        } as never,
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
    --header 'x-db-secret: super-secret-db-webhook-key-123' \
    --data '{"case_id":"11111111-1111-4111-8111-111111111111"}'

*/
