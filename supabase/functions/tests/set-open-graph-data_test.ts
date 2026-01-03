// supabase/functions/tests/set-open-graph-data_test.ts
import { assert, assertEquals, assertExists } from "jsr:@std/assert@1";
import { createClient } from "npm:@supabase/supabase-js@2";

// Load environment variables
import "jsr:@std/dotenv/load";

// Configuration
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "http://127.0.0.1:54321";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Test user UUIDs from seed data
const TEST_USER_GORM = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

// Helper to create service role client
const createServiceRoleClient = () => {
  return createClient(supabaseUrl, supabaseServiceRoleKey);
};

// Helper to invoke OG scraping edge function
const invokeOpenGraphScraper = async (case_id: string) => {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/set-open-graph-data`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ case_id }),
    },
  );

  const data = await response.json();
  return { response, data };
};

// Helper to wait for async trigger to complete
const waitForOGData = async (
  supabase: ReturnType<typeof createServiceRoleClient>,
  case_id: string,
  maxAttempts = 10,
) => {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await supabase
      .from("open_graph_data")
      .select("*")
      .eq("case_id", case_id)
      .maybeSingle();

    if (data) return data;

    // Wait 500ms before next attempt
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return null;
};

// Test 1: Success - Valid URL with OG tags
Deno.test({
  name: "set-open-graph-data - successfully fetches OG data from valid URL",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // Create test case with a real URL that has OG tags
    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "https://www.nytimes.com/",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError, `Failed to create test case: ${caseError?.message}`);
    assertExists(newCase, "Test case not created");

    try {
      // Call OG scraper function directly
      const { response, data } = await invokeOpenGraphScraper(newCase.id);

      assertEquals(response.status, 200, `Expected 200, got ${response.status}`);
      assertEquals(data.success, true);
      assertEquals(data.fetch_status, "success");

      // Verify OG data was saved to database
      const { data: ogData, error: ogError } = await supabase
        .from("open_graph_data")
        .select("*")
        .eq("case_id", newCase.id)
        .single();

      assert(!ogError, `Failed to fetch OG data: ${ogError?.message}`);
      assertExists(ogData, "OG data not found in database");
      assertEquals(ogData.fetch_status, "success");
      assertExists(ogData.og_title, "og_title not set");
      assertExists(ogData.og_description, "og_description not set");
      assertExists(ogData.og_image, "og_image not set");
      assertEquals(ogData.http_status_code, 200);
      assertExists(ogData.last_fetched_at, "last_fetched_at not set");
      assertExists(ogData.raw_data, "raw_data not set");

      console.log("✓ Successfully fetched OG data from valid URL");
      console.log(`  Title: ${ogData.og_title}`);
      console.log(`  Image: ${ogData.og_image}`);
    } finally {
      // Cleanup: Delete test case (cascade deletes OG data)
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});

// Test 2: Trigger - Automatic OG fetch on case INSERT
Deno.test({
  name: "set-open-graph-data - trigger automatically fetches OG data on case creation",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // Create test case - trigger should fire automatically
    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "https://github.com/",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError, `Failed to create test case: ${caseError?.message}`);
    assertExists(newCase, "Test case not created");

    try {
      // Wait for trigger to complete (async via pg_net)
      const ogData = await waitForOGData(supabase, newCase.id);

      assertExists(ogData, "Trigger did not create OG data");
      assertEquals(ogData.case_id, newCase.id);
      assertExists(ogData.fetch_status, "fetch_status not set");
      assertExists(ogData.last_fetched_at, "last_fetched_at not set");

      // Should have successfully fetched GitHub's OG data
      if (ogData.fetch_status === "success") {
        assertExists(ogData.og_title, "og_title not set");
        assertEquals(ogData.http_status_code, 200);
      }

      console.log(`✓ Trigger automatically fetched OG data (status: ${ogData.fetch_status})`);
    } finally {
      // Cleanup
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});

// Test 3: Trigger - Only fires for URL cases (not text)
Deno.test({
  name: "set-open-graph-data - trigger does NOT fire for text cases",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // Create TEXT case (trigger should NOT fire)
    const { data: textCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "This is plain text content, not a URL",
        content_type: "text",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError, `Failed to create test case: ${caseError?.message}`);
    assertExists(textCase, "Test case not created");

    try {
      // Wait a bit to see if trigger fires (it shouldn't)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify NO OG data was created
      const { data: ogData } = await supabase
        .from("open_graph_data")
        .select("*")
        .eq("case_id", textCase.id)
        .maybeSingle();

      assertEquals(ogData, null, "OG data should NOT be created for text cases");

      console.log("✓ Trigger correctly skipped text case");
    } finally {
      // Cleanup
      await supabase.from("cases").delete().eq("id", textCase.id);
    }
  },
});

// Test 4: Error - Invalid URL format
Deno.test({
  name: "set-open-graph-data - handles invalid URL format gracefully",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // Create case with malformed URL
    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "not-a-valid-url",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError, `Failed to create test case: ${caseError?.message}`);
    assertExists(newCase, "Test case not created");

    try {
      // Call OG scraper
      const { response, data } = await invokeOpenGraphScraper(newCase.id);

      assertEquals(response.status, 200, "Should return 200 even for invalid URL");
      assertEquals(data.success, true);
      assertEquals(data.fetch_status, "failed");

      // Verify failed status was saved
      const { data: ogData, error: ogError } = await supabase
        .from("open_graph_data")
        .select("*")
        .eq("case_id", newCase.id)
        .single();

      assert(!ogError, `Failed to fetch OG data: ${ogError?.message}`);
      assertExists(ogData, "OG data not found");
      assertEquals(ogData.fetch_status, "failed");
      assertExists(ogData.fetch_error, "fetch_error not set");
      assert(
        ogData.fetch_error?.includes("Invalid URL format"),
        `Expected 'Invalid URL format' error, got: ${ogData.fetch_error}`,
      );

      console.log("✓ Invalid URL handled gracefully with failed status");
      console.log(`  Error: ${ogData.fetch_error}`);
    } finally {
      // Cleanup
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});

// Test 5: Error - HTTP 404 (URL not found)
Deno.test({
  name: "set-open-graph-data - handles HTTP 404 gracefully",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // Create case with URL that returns 404
    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "https://example.com/this-page-does-not-exist-12345",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError, `Failed to create test case: ${caseError?.message}`);
    assertExists(newCase, "Test case not created");

    try {
      // Call OG scraper
      const { response, data } = await invokeOpenGraphScraper(newCase.id);

      assertEquals(response.status, 200, "Should return 200 even for 404 URL");
      assertEquals(data.success, true);
      assertEquals(data.fetch_status, "failed");

      // Verify failed status was saved
      const { data: ogData } = await supabase
        .from("open_graph_data")
        .select("*")
        .eq("case_id", newCase.id)
        .single();

      assertExists(ogData, "OG data not found");
      assertEquals(ogData.fetch_status, "failed");
      assertExists(ogData.fetch_error, "fetch_error not set");
      assert(
        ogData.fetch_error?.includes("404"),
        `Expected 404 error, got: ${ogData.fetch_error}`,
      );

      console.log("✓ HTTP 404 handled gracefully");
      console.log(`  Error: ${ogData.fetch_error}`);
    } finally {
      // Cleanup
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});

// Test 6: Error - Case not found
Deno.test("set-open-graph-data - rejects non-existent case_id", async () => {
  // Use a valid UUID v4 format that doesn't exist in database
  const nonExistentId = "10000000-0000-4000-8000-000000000001";
  const { response, data } = await invokeOpenGraphScraper(nonExistentId);

  assertEquals(response.status, 404);
  assertEquals(data.error, "Case not found");

  console.log("✓ Non-existent case_id rejected with 404");
});

// Test 7: Error - Text case (not URL)
Deno.test({
  name: "set-open-graph-data - rejects text cases",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // Create text case
    const { data: textCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "This is text content",
        content_type: "text",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError, `Failed to create test case: ${caseError?.message}`);
    assertExists(textCase, "Test case not created");

    try {
      // Try to scrape text case
      const { response, data } = await invokeOpenGraphScraper(textCase.id);

      assertEquals(response.status, 400);
      assertEquals(data.error, "Invalid case type");
      assertExists(data.details, "Error details not provided");
      assert(
        data.details.includes("content_type='url'"),
        "Error should mention content_type requirement",
      );

      console.log("✓ Text case rejected with 400");
    } finally {
      // Cleanup
      await supabase.from("cases").delete().eq("id", textCase.id);
    }
  },
});

// Test 8: Error - Invalid case_id format
Deno.test("set-open-graph-data - rejects invalid case_id format", async () => {
  const { response, data } = await invokeOpenGraphScraper("not-a-uuid");

  assertEquals(response.status, 400);
  assertEquals(data.error, "Invalid request payload");
  assertExists(data.details, "Error details not provided");

  console.log("✓ Invalid case_id format rejected with 400");
});

// Test 9: Error - Missing case_id
Deno.test("set-open-graph-data - rejects missing case_id", async () => {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/set-open-graph-data`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  const data = await response.json();

  assertEquals(response.status, 400);
  assertEquals(data.error, "Invalid request payload");
  assertExists(data.details, "Error details not provided");

  console.log("✓ Missing case_id rejected with 400");
});

// Test 10: Idempotency - Multiple calls update existing record
Deno.test({
  name: "set-open-graph-data - idempotent upsert behavior",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // Create test case
    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "https://www.wikipedia.org/",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError, `Failed to create test case: ${caseError?.message}`);
    assertExists(newCase, "Test case not created");

    try {
      // First call
      const { response: response1, data: data1 } = await invokeOpenGraphScraper(
        newCase.id,
      );
      assertEquals(response1.status, 200);
      assertEquals(data1.success, true);

      // Get first fetch timestamp
      const { data: ogData1 } = await supabase
        .from("open_graph_data")
        .select("last_fetched_at, fetch_status")
        .eq("case_id", newCase.id)
        .single();

      assertExists(ogData1, "First OG data not found");
      const firstTimestamp = ogData1.last_fetched_at;

      // Wait to ensure timestamp would change
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Second call (should upsert, not duplicate)
      const { response: response2, data: data2 } = await invokeOpenGraphScraper(
        newCase.id,
      );
      assertEquals(response2.status, 200);
      assertEquals(data2.success, true);

      // Verify only ONE record exists (not duplicated)
      const { data: allOgData, error: allError } = await supabase
        .from("open_graph_data")
        .select("*")
        .eq("case_id", newCase.id);

      assert(!allError, "Failed to fetch all OG data");
      assertEquals(
        allOgData.length,
        1,
        "Should have exactly 1 OG data record (upserted, not duplicated)",
      );

      // Verify timestamp was updated
      const ogData2 = allOgData[0];
      assert(
        ogData2.last_fetched_at !== firstTimestamp,
        "last_fetched_at should be updated on re-fetch",
      );

      console.log("✓ Idempotent upsert behavior verified");
    } finally {
      // Cleanup
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});

// Test 11: Partial data - URL with minimal OG tags
Deno.test({
  name: "set-open-graph-data - handles partial OG data (minimal tags)",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createServiceRoleClient();

    // Create case with URL that might have minimal/no OG tags
    const { data: newCase, error: caseError } = await supabase
      .from("cases")
      .insert({
        submitted_by: TEST_USER_GORM,
        content: "https://example.com/",
        content_type: "url",
        template_version: 1,
      })
      .select()
      .single();

    assert(!caseError, `Failed to create test case: ${caseError?.message}`);
    assertExists(newCase, "Test case not created");

    try {
      // Call OG scraper
      const { response, data } = await invokeOpenGraphScraper(newCase.id);

      assertEquals(response.status, 200);
      assertEquals(data.success, true);

      // Verify OG data was saved (even if partial)
      const { data: ogData } = await supabase
        .from("open_graph_data")
        .select("*")
        .eq("case_id", newCase.id)
        .single();

      assertExists(ogData, "OG data not found");
      assertExists(ogData.fetch_status, "fetch_status not set");

      // Status could be 'success' or 'partial' depending on example.com's tags
      assert(
        ogData.fetch_status === "success" || ogData.fetch_status === "partial",
        `Expected success or partial, got: ${ogData.fetch_status}`,
      );

      console.log(`✓ Partial/minimal OG data handled (status: ${ogData.fetch_status})`);
    } finally {
      // Cleanup
      await supabase.from("cases").delete().eq("id", newCase.id);
    }
  },
});
