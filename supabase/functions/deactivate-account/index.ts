import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.1.13";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const requestBodySchema = z.object({
  confirmation: z.literal("DEAKTIVIEREN"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const body = await req.json();
    const parseResult = requestBodySchema.safeParse(body);

    if (!parseResult.success) {
      return new Response(
        JSON.stringify({
          error: "Ungültige Bestätigung. Bitte gib DEAKTIVIEREN ein.",
          details: parseResult.error.issues,
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await supabase.auth
      .getUser();

    if (userError || !userData?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const userId = userData.user.id;

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const now = new Date().toISOString();

    const { data: updatedProfile, error: profileUpdateError } =
      await supabaseAdmin
        .from("profiles")
        .update({
          is_deactivated: true,
          deactivated_at: now,
          username: "Deaktivierter Account",
          get_notifications: false,
          updated_at: now,
        })
        .eq("id", userId)
        .eq("is_deactivated", false)
        .select("id")
        .maybeSingle();

    if (profileUpdateError) {
      console.error(
        "deactivate-account profile update failed:",
        profileUpdateError,
      );
      return new Response(
        JSON.stringify({
          error: "Konto konnte nicht deaktiviert werden",
          details: profileUpdateError.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!updatedProfile) {
      return new Response(
        JSON.stringify({ error: "Konto wurde bereits deaktiviert." }),
        {
          status: 409,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { error: banError } = await supabaseAdmin.auth.admin
      .updateUserById(
        userId,
        {
          ban_duration: "876000h",
        },
      );

    if (banError) {
      console.error("deactivate-account auth ban failed:", banError);
      return new Response(
        JSON.stringify({
          error:
            "Konto wurde deaktiviert, aber Auth-Sperre fehlgeschlagen.",
          details: banError.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(
      JSON.stringify({ deactivated: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("deactivate-account unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Interner Serverfehler" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
