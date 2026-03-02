// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY")!;
const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN")!;

Deno.serve(async (_req) => {
  const form = new URLSearchParams();
  form.set("from", `Codetekt <noreply@${MAILGUN_DOMAIN}>`);
  form.set("to", "gorm-labenz@hotmail.com"); // your test recipient
  form.set("subject", "Hello from Supabase Edge Function");
  form.set(
    "text",
    "It works! Email sent via Mailgun from a Supabase Edge Function.",
  );

  console.log("Sending email via Mailgun...", MAILGUN_DOMAIN);

  // Use EU endpoint — mg.codetekt.org is hosted on Mailgun EU
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

  console.log("Mailgun response status:", res.status);

  // Mailgun may return plain text on errors, handle both cases
  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  return new Response(JSON.stringify({ status: res.status, mailgun: data }), {
    status: res.ok ? 200 : 500,
    headers: { "Content-Type": "application/json" },
  });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
