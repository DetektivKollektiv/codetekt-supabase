import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import {
  getSupabasePublishableKey,
  getSupabaseSecretKey,
} from "./supabase-api-keys.ts";

const PUBLISHABLE_KEYS_VARIABLE = "SUPABASE_PUBLISHABLE_KEYS";
const SECRET_KEYS_VARIABLE = "SUPABASE_SECRET_KEYS";

function restoreEnvironmentVariable(name: string, value: string | undefined) {
  if (value === undefined) {
    Deno.env.delete(name);
    return;
  }

  Deno.env.set(name, value);
}

Deno.test("reads default publishable and secret keys", () => {
  const previousPublishableKeys = Deno.env.get(PUBLISHABLE_KEYS_VARIABLE);
  const previousSecretKeys = Deno.env.get(SECRET_KEYS_VARIABLE);

  try {
    Deno.env.set(
      PUBLISHABLE_KEYS_VARIABLE,
      JSON.stringify({ default: "publishable-key", secondary: "other-key" }),
    );
    Deno.env.set(
      SECRET_KEYS_VARIABLE,
      JSON.stringify({ default: "secret-key" }),
    );

    assertEquals(getSupabasePublishableKey(), "publishable-key");
    assertEquals(getSupabaseSecretKey(), "secret-key");
  } finally {
    restoreEnvironmentVariable(
      PUBLISHABLE_KEYS_VARIABLE,
      previousPublishableKeys,
    );
    restoreEnvironmentVariable(SECRET_KEYS_VARIABLE, previousSecretKeys);
  }
});

Deno.test("rejects a key map without a default key", () => {
  const previousPublishableKeys = Deno.env.get(PUBLISHABLE_KEYS_VARIABLE);

  try {
    Deno.env.set(
      PUBLISHABLE_KEYS_VARIABLE,
      JSON.stringify({ secondary: "key" }),
    );

    assertThrows(
      getSupabasePublishableKey,
      Error,
      "must contain a non-empty default key",
    );
  } finally {
    restoreEnvironmentVariable(
      PUBLISHABLE_KEYS_VARIABLE,
      previousPublishableKeys,
    );
  }
});
