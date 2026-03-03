/**
 * SEND EMAIL EDGE FUNCTION
 *
 * Sends transactional emails via Mailgun. Called exclusively by database triggers
 * through pg_net — never directly by clients. Authenticated via a shared secret
 * (X-Db-Secret header) stored in Supabase Vault on the DB side and in
 * DB_WEBHOOK_SECRET env on the function side.
 *
 * Supported email types:
 *
 * - new_case: Notifies a fixed address (NEW_CASE_NOTIFICATION_EMAIL) when a new
 *   case is submitted. Triggered by the notify_new_case_email_trigger on public.cases.
 *
 * - dispute: Notifies all admins with get_notifications=true when a review dispute
 *   is created. Triggered by the notify_dispute_email_trigger on public.review_disputes.
 *
 * Security:
 * - verify_jwt = false in config.toml (no user JWT — DB calls use X-Db-Secret instead)
 * - timingSafeEqual comparison prevents timing-attack secret leaks
 * - Payload validated with Zod before any processing
 */

// Setup type definitions for built-in Supabase Runtime APIs
import { timingSafeEqual } from "jsr:@std/crypto/timing-safe-equal";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.1.13";
import { disputeEmail, newCaseEmail } from "./email-templates.ts";

const enc = new TextEncoder();

const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY")!;
const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://codetekt.org";
const NEW_CASE_NOTIFICATION_EMAIL = Deno.env.get(
  "NEW_CASE_NOTIFICATION_EMAIL",
)!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "";

// ─── Mailgun helper ───────────────────────────────────────────────────────────

async function sendMail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const form = new URLSearchParams();
  form.set("from", `Codetekt <noreply@${MAILGUN_DOMAIN}>`);
  form.set("to", to);
  form.set("subject", subject);
  form.set("html", html);

  const res = await fetch(
    `https://api.eu.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mailgun error ${res.status}: ${text}`);
  }
}

// ─── Payload schemas ─────────────────────────────────────────────────────────

const newCasePayloadSchema = z.object({
  type: z.literal("new_case"),
  caseNumber: z.number().int().positive(),
  caseId: z.string().uuid(),
});

const disputePayloadSchema = z.object({
  type: z.literal("dispute"),
  caseNumber: z.number().int().positive(),
  caseId: z.string().uuid(),
  disputedField: z.string().min(1), // field_id from review_disputes (e.g. keyword_type, content_type)
});

const payloadSchema = z.discriminatedUnion("type", [
  newCasePayloadSchema,
  disputePayloadSchema,
]);

type Payload = z.infer<typeof payloadSchema>;

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // ─── Auth: verify X-Db-Secret header ──────────────────────────────────────
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid payload", issues: parsed.error.issues }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const payload: Payload = parsed.data;

  try {
    if (payload.type === "new_case") {
      // ── Template 1: fixed notification email for new cases ──
      const { subject, html } = newCaseEmail({
        caseNumber: payload.caseNumber,
        caseId: payload.caseId,
        siteUrl: SITE_URL,
      });

      await sendMail(NEW_CASE_NOTIFICATION_EMAIL, subject, html);

      console.log(
        `[send-email] new_case – sent to ${NEW_CASE_NOTIFICATION_EMAIL}`,
      );
      return new Response(JSON.stringify({ sent: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (payload.type === "dispute") {
      // ── Template 2: notify admins with notifications enabled ──
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      const { data: admins, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_admin", true)
        .eq("get_notifications", true);

      if (error) throw new Error(`Failed to fetch admins: ${error.message}`);
      if (!admins || admins.length === 0) {
        return new Response(
          JSON.stringify({ error: "No admins with notifications enabled" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Fetch auth emails for each admin id via the admin API
      const adminEmails: string[] = [];
      for (const admin of admins) {
        const { data: userData, error: userError } = await supabase.auth.admin
          .getUserById(admin.id);
        if (userError || !userData.user?.email) {
          console.warn(
            `[send-email] Could not resolve email for admin ${admin.id}`,
          );
          continue;
        }
        adminEmails.push(userData.user.email);
      }

      if (adminEmails.length === 0) {
        return new Response(
          JSON.stringify({ error: "No admin emails resolved" }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const { subject, html } = disputeEmail({
        caseNumber: payload.caseNumber,
        caseId: payload.caseId,
        disputedField: payload.disputedField,
      });

      await Promise.all(
        adminEmails.map((email) => sendMail(email, subject, html)),
      );

      console.log(
        `[send-email] dispute – notified ${adminEmails.length} admin(s)`,
      );
      return new Response(JSON.stringify({ sent: adminEmails.length }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[send-email] Error:`, message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
