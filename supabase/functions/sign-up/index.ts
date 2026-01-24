/**
 * SIGN-UP EDGE FUNCTION
 *
 * Handles user registration with email, password, and username.
 * Creates authenticated user account and returns session for immediate login.
 *
 * Process flow:
 * 1. Validates input (email, password, username)
 * 2. Checks username availability (must be unique)
 * 3. Creates user account using admin client (service role key)
 * 5. Updates profile with username (profile created by handle_new_user trigger)
 * 6. Signs in user to create session
 * 7. Returns user and session data for immediate authentication
 *
 * Error handling and cleanup:
 * - Username collision: Returns error before creating account
 * - Profile update failure: Deletes created user account (rollback)
 * - Sign-in failure after signup: Returns success but prompts manual login
 *
 * CORS support:
 * - Handles OPTIONS preflight requests
 * - Allows cross-origin requests (Access-Control-Allow-Origin: *)
 * - Supports authorization, x-client-info, apikey, content-type headers
 *
 * Requirements:
 * - Valid email format
 * - Password meeting validation requirements
 * - Unique username (checked against profiles table)
 *
 * Returns:
 * - Success: user object and session data (access_token, refresh_token)
 * - Error: validation errors, username collision, or server errors
 *
 * Database updates:
 * - Creates user in auth.users (via admin.createUser)
 * - Updates profiles table with username (profile auto-created by trigger)
 * - Rollback: Deletes user if profile update fails
 */

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { Database } from "../_shared/types/database.types.ts";
import { signUpSchema } from "./validation.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
        JSON.stringify({
          error: "Ungültige Eingabe",
          issues: parsed.error.issues,
        }),
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
        JSON.stringify({
          error: "Datenbankfehler beim Prüfen des Benutzernamens",
        }),
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

    // Step 4: Create user with normal signUp (sends email automatically!)
    const supabaseClient = createClient<Database>(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );

    const siteUrl = Deno.env.get("SITE_URL") ||
      "https://codetekt-frontend.vercel.app";

    const { data: authData, error: signUpError } = await supabaseClient.auth
      .signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/`,
        },
      });

    if (signUpError || !authData.user) {
      console.error("Sign up error:", signUpError);
      return new Response(
        JSON.stringify({
          error: signUpError?.message || "Registrierung fehlgeschlagen",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Step 5: Update profile with username (using admin client)
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ username, updated_at: new Date().toISOString() })
      .eq("id", authData.user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      // Clean up user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({
          error: "Benutzername konnte nicht gesetzt werden.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Signup email sent to:", email);

    // Step 6: Return success
    return new Response(
      JSON.stringify({
        success: true,
        message:
          "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mails.",
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
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
