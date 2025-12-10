// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.1.13";
import { Database } from "../_shared/types/database.types.ts";
import {
  reviewAggregationSchema,
  reviewAnswerSchema,
} from "../_shared/zod-schemas.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Payload = z.infer<typeof payloadSchema>;
type ReviewAnswer = Database["public"]["Tables"]["review_answers"]["Row"];
type ReviewAggregationRow =
  Database["public"]["Tables"]["review_aggregations"]["Row"];

const payloadSchema = z.object({
  case_id: z.uuid(),
  data: reviewAnswerSchema,
});

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return new Response("Missing Authorization header", { status: 401 });
  }

  const supabase = createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: userError } = await supabase.auth.getUser(
    token,
  );

  if (userError || !user) {
    console.error("Error fetching user:", userError);
    return new Response("Unauthorized", { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.flatten() }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const { case_id, data } = parsed.data;

  // Upsert review answer for this user and case
  const { error: upsertError, data: review_answer } = await supabase
    .from("review_answers")
    .upsert({
      case_id,
      reviewed_by: user.id,
      data,
      status: "submitted",
      submitted_at: new Date().toISOString(),
    }, {
      onConflict: "case_id,reviewed_by",
    });

  if (upsertError) {
    console.error("Upsert review_answers error", upsertError);
    return new Response("Failed to save review answer", { status: 500 });
  }

  // Fetch submitted answers for this case
  const { data: submitted, error: selectError } = await supabase
    .from("review_answers")
    .select("data, reviewed_by")
    .eq("case_id", case_id)
    .eq("status", "submitted");

  if (selectError || !submitted) {
    console.error("Select review_answers error", selectError);
    return new Response("Failed to read review answers", { status: 500 });
  }

  // Only aggregate when at least 3 submitted answers exist
  if (submitted.length >= 3) {
    const { aggregation, resultScore } = buildAggregation(submitted);

    // Validate aggregation structure to match shared schema
    const validAggregation = reviewAggregationSchema.parse(aggregation);

    const serviceClient = createClient<Database>(
      supabaseUrl,
      supabaseServiceRoleKey,
    );

    const { error: aggError } = await serviceClient
      .from("review_aggregations")
      .upsert(
        {
          case_id,
          data: validAggregation,
          result_score: resultScore,
          reviewer_ids: submitted.map((row) => row.reviewed_by),
          calculated_at: new Date().toISOString(),
        } satisfies ReviewAggregationRow,
        {
          onConflict: "case_id",
        },
      );

    if (aggError) {
      console.error("Upsert review_aggregations error", aggError);
      return new Response("Failed to save aggregation", { status: 500 });
    }
  }

  return new Response(
    JSON.stringify(submitted),
    { headers: { "Content-Type": "application/json" } },
  );
});

type SubmittedAnswer = Pick<ReviewAnswer, "data" | "reviewed_by">;

const numericLabeledValues = [0, 1, 2, 3] as const;

function buildAggregation(
  submitted: SubmittedAnswer[],
): { aggregation: ReviewAggregationRow["data"]; resultScore: number } {
  const fields: Record<
    string,
    {
      counts: { 0: number; 1: number; 2: number; 3: number };
      percentages: { 0: number; 1: number; 2: number; 3: number };
      average: number;
      warnings: string[];
    }
  > = {};

  // Collect metadata from first answer if present
  const firstData = submitted[0]?.data as Record<string, unknown> | undefined;
  const metadata = {
    keywords: (firstData?.keywords as string[] | null | undefined) ?? null,
    content_type: (firstData?.content_type as string[] | null | undefined) ??
      null,
  };

  for (const { data } of submitted) {
    const answerRecord = data as Record<string, unknown>;

    for (const [fieldId, value] of Object.entries(answerRecord)) {
      // Only aggregate numeric answers (traffic-light / likert)
      if (
        typeof value !== "number" ||
        !numericLabeledValues.includes(
          value as (typeof numericLabeledValues)[number],
        )
      ) {
        continue;
      }

      // Initialize accumulator
      if (!fields[fieldId]) {
        fields[fieldId] = {
          counts: { 0: 0, 1: 0, 2: 0, 3: 0 },
          percentages: { 0: 0, 1: 0, 2: 0, 3: 0 },
          average: 0,
          warnings: [],
        };
      }

      const field = fields[fieldId];
      // Restrict to 0..3 as defined in AggregationFieldValue
      const bucket = Math.max(0, Math.min(3, value)) as 0 | 1 | 2 | 3;
      field.counts[bucket] += 1;
    }
  }

  // Calculate percentages and averages
  for (const field of Object.values(fields)) {
    const total = numericLabeledValues.reduce<number>(
      (sum, key) => sum + field.counts[key],
      0,
    );
    if (total > 0) {
      for (const key of numericLabeledValues) {
        field.percentages[key] = (field.counts[key] / total) * 100;
      }
      const sum = numericLabeledValues.reduce<number>(
        (s, key) => s + field.counts[key] * key,
        0,
      );
      field.average = sum / total;
      if (field.average < 2) {
        field.warnings.push("Warning");
      }
    }
  }

  const averages = Object.values(fields).map((f) => f.average);
  const resultScore = averages.length
    ? averages.reduce<number>((sum, v) => sum + v, 0) / averages.length
    : 0;

  return {
    aggregation: {
      metadata,
      fields,
    },
    resultScore,
  };
}

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/test-fucntion' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiJhYWFhYWFhYS1hYWFhLWFhYWEtYWFhYS1hYWFhYWFhYWFhYWEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY1MzU2MDU3LCJpYXQiOjE3NjUzNTI0NTcsImVtYWlsIjoiZ29ybS1sYWJlbnpAaG90bWFpbC5jb20iLCJwaG9uZSI6IiIsImFwcF9tZXRhZGF0YSI6eyJwcm92aWRlciI6ImVtYWlsIiwicHJvdmlkZXJzIjpbImVtYWlsIl19LCJ1c2VyX21ldGFkYXRhIjp7ImZ1bGxfbmFtZSI6Ikdvcm0gTGFiZW56In0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NjUzNTI0NTd9XSwic2Vzc2lvbl9pZCI6ImJkYzM1NzFkLTQwMTItNGFkMS1iMDY2LWY0YTliZDVmYjIyYSIsImlzX2Fub255bW91cyI6ZmFsc2V9.wr0NXS2wGwoMqspdufiYPzO_MKeZS7b-YHmP2BWZ5Pk' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
