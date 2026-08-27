type SupabaseApiKeyEnvironmentVariable =
  | "SUPABASE_PUBLISHABLE_KEYS"
  | "SUPABASE_SECRET_KEYS";

function getDefaultApiKey(
  variableName: SupabaseApiKeyEnvironmentVariable,
): string {
  const rawKeys = Deno.env.get(variableName);
  if (!rawKeys) {
    throw new Error(`Missing ${variableName}`);
  }

  let parsedKeys: unknown;
  try {
    parsedKeys = JSON.parse(rawKeys);
  } catch {
    throw new Error(`${variableName} must contain valid JSON`);
  }

  if (typeof parsedKeys !== "object" || parsedKeys === null) {
    throw new Error(`${variableName} must contain a key map`);
  }

  const defaultKey = (parsedKeys as Record<string, unknown>).default;
  if (typeof defaultKey !== "string" || defaultKey.length === 0) {
    throw new Error(`${variableName} must contain a non-empty default key`);
  }

  return defaultKey;
}

export function getSupabasePublishableKey(): string {
  return getDefaultApiKey("SUPABASE_PUBLISHABLE_KEYS");
}

export function getSupabaseSecretKey(): string {
  return getDefaultApiKey("SUPABASE_SECRET_KEYS");
}
