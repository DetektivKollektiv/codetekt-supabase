// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Database } from "../_shared/types/database.types.ts";
import { signUpSchema } from "./validation.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Step 1: Parse and validate payload
    const json = await req.json().catch(() => null);
    const parsed = signUpSchema.safeParse(json);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Ungültige Eingabe", issues: parsed.error.issues }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { email, password, username } = parsed.data;

    // Step 2: Create Supabase admin client
    const supabaseAdmin = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Step 3: Check if username is already taken
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from("profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking username:", checkError);
      return new Response(
        JSON.stringify({ error: "Datenbankfehler beim Prüfen des Benutzernamens" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "Benutzername bereits vergeben" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Step 4: Create user account
    const { data: authData, error: signUpError } = await supabaseAdmin.auth
      .admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email for simplicity
      });

    if (signUpError || !authData.user) {
      console.error("Sign up error:", signUpError);
      return new Response(
        JSON.stringify({ error: signUpError?.message || "Registrierung fehlgeschlagen" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Step 5: Update profile with username
    // The handle_new_user trigger already created the profile, we just need to update it
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ username, updated_at: new Date().toISOString() })
      .eq("id", authData.user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      // Try to clean up the created user if profile update fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({
          error: "Benutzername konnte nicht gesetzt werden. Bitte versuchen Sie es erneut.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Step 6: Create a proper session by signing in
    const supabaseClient = createClient<Database>(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data: signInData, error: signInError } = await supabaseClient.auth
      .signInWithPassword({
        email,
        password,
      });

    if (signInError || !signInData.session) {
      console.error("Error signing in after signup:", signInError);
      return new Response(
        JSON.stringify({
          error: "Konto erstellt, aber automatische Anmeldung fehlgeschlagen. Bitte melden Sie sich an.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Step 7: Return session data
    return new Response(
      JSON.stringify({
        user: signInData.user,
        session: signInData.session,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Interner Serverfehler" }),
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/sign-up' \
    --header 'Content-Type: application/json' \
    --data '{"email":"newuser@example.com","password":"securepassword123","username":"newuser"}'

*/
