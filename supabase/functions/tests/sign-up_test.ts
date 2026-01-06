// supabase/functions/tests/sign-up_test.ts
import { assert, assertEquals, assertExists } from "jsr:@std/assert@1";
import { createClient } from "npm:@supabase/supabase-js@2";

// Load environment variables
import "jsr:@std/dotenv/load";

// Configuration
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "http://127.0.0.1:54321";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Helper to create client with no auto-refresh
const createTestClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
};

// Helper to create admin client for cleanup
const createAdminClient = () => {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

// Helper to generate unique test data
const generateTestData = () => {
  const uniqueId = crypto.randomUUID().slice(0, 8);
  return {
    email: `test-${uniqueId}@example.com`,
    username: `testuser${uniqueId}`,
    password: "testpassword123",
  };
};

// Helper to clean up test user
const cleanupTestUser = async (email: string) => {
  const adminClient = createAdminClient();
  try {
    // Find user by email
    const { data: { users }, error: listError } = await adminClient.auth.admin
      .listUsers();

    if (listError) {
      console.error("Error listing users:", listError);
      return;
    }

    const user = users.find((u) => u.email === email);
    if (user) {
      // Delete user (cascade will delete profile)
      await adminClient.auth.admin.deleteUser(user.id);
      console.log(`Cleaned up test user: ${email}`);
    }
  } catch (err) {
    console.error("Cleanup error:", err);
  }
};

// Test: Successful sign-up with valid data
Deno.test("sign-up - successfully creates user with valid data", async () => {
  const supabase = createTestClient();
  const testData = generateTestData();

  try {
    // Step 1: Invoke sign-up function
    const { data, error } = await supabase.functions.invoke("sign-up", {
      body: {
        email: testData.email,
        password: testData.password,
        username: testData.username,
      },
    });

    // Step 2: Verify success
    assert(!error, `Sign-up failed: ${error?.message ?? "unknown error"}`);
    assertExists(data, "Expected response data");

    // Step 3: Verify user object
    assertExists(data.user, "Expected user object in response");
    assertEquals(data.user.email, testData.email, "Email mismatch");
    assertExists(data.user.id, "Expected user ID");

    // Step 4: Verify session object
    assertExists(data.session, "Expected session object in response");
    assertExists(data.session.access_token, "Expected access token");
    assertExists(data.session.refresh_token, "Expected refresh token");
    assertEquals(data.session.token_type, "bearer", "Expected bearer token type");

    // Step 5: Verify profile was created with username
    const adminClient = createAdminClient();
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("username, is_admin")
      .eq("id", data.user.id)
      .single();

    assert(!profileError, `Failed to query profile: ${profileError?.message}`);
    assertExists(profile, "Profile not found");
    assertEquals(profile.username, testData.username, "Username not set correctly");
    assertEquals(profile.is_admin, false, "is_admin should default to false");

    console.log("✓ User successfully created with username and session");
  } finally {
    // Clean up
    await cleanupTestUser(testData.email);
  }
});

// Test: Sign-up with duplicate username
Deno.test({
  name: "sign-up - fails with duplicate username",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();
    const testData = generateTestData();

    try {
      // Step 1: Create first user
      const { data: data1, error: error1 } = await supabase.functions.invoke(
        "sign-up",
        {
          body: {
            email: testData.email,
            password: testData.password,
            username: testData.username,
          },
        },
      );

      assert(!error1, "First sign-up failed");
      assertExists(data1.user, "First user not created");

      // Step 2: Try to create second user with same username
      const testData2 = generateTestData();
      const { data: data2, error: error2 } = await supabase.functions.invoke(
        "sign-up",
        {
          body: {
            email: testData2.email, // Different email
            password: testData2.password,
            username: testData.username, // Same username
          },
        },
      );

      // Step 3: Verify it failed
      assert(
        error2 || (data2 && data2.error),
        "Expected error for duplicate username",
      );

      if (data2 && data2.error) {
        assertEquals(
          data2.error,
          "Username already taken",
          "Expected specific error message",
        );
      }

      console.log("✓ Properly rejected duplicate username");
    } finally {
      // Clean up (only first user was created)
      await cleanupTestUser(testData.email);
    }
  },
});

// Test: Sign-up with duplicate email
Deno.test({
  name: "sign-up - fails with duplicate email",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();
    const testData = generateTestData();

    try {
      // Step 1: Create first user
      const { data: data1, error: error1 } = await supabase.functions.invoke(
        "sign-up",
        {
          body: {
            email: testData.email,
            password: testData.password,
            username: testData.username,
          },
        },
      );

      assert(!error1, "First sign-up failed");
      assertExists(data1.user, "First user not created");

      // Step 2: Try to create second user with same email
      const testData2 = generateTestData();
      const { data: data2, error: error2 } = await supabase.functions.invoke(
        "sign-up",
        {
          body: {
            email: testData.email, // Same email
            password: testData2.password,
            username: testData2.username, // Different username
          },
        },
      );

      // Step 3: Verify it failed
      assert(
        error2 || (data2 && data2.error),
        "Expected error for duplicate email",
      );

      console.log("✓ Properly rejected duplicate email");
    } finally {
      // Clean up
      await cleanupTestUser(testData.email);
    }
  },
});

// Test: Invalid email format
Deno.test({
  name: "sign-up - fails with invalid email format",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();
    const testData = generateTestData();

    const { data, error } = await supabase.functions.invoke("sign-up", {
      body: {
        email: "invalid-email", // Invalid format
        password: testData.password,
        username: testData.username,
      },
    });

    // Verify validation error
    assert(
      error || (data && data.error),
      "Expected validation error for invalid email",
    );

    if (data && data.issues) {
      const emailIssue = data.issues.find((i: { path: string[] }) =>
        i.path.includes("email")
      );
      assertExists(emailIssue, "Expected email validation issue");
    }

    console.log("✓ Properly rejected invalid email format");
  },
});

// Test: Password too short
Deno.test({
  name: "sign-up - fails with password too short",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();
    const testData = generateTestData();

    const { data, error } = await supabase.functions.invoke("sign-up", {
      body: {
        email: testData.email,
        password: "short", // Less than 8 characters
        username: testData.username,
      },
    });

    // Verify validation error
    assert(
      error || (data && data.error),
      "Expected validation error for short password",
    );

    if (data && data.issues) {
      const passwordIssue = data.issues.find((i: { path: string[] }) =>
        i.path.includes("password")
      );
      assertExists(passwordIssue, "Expected password validation issue");
    }

    console.log("✓ Properly rejected short password");
  },
});

// Test: Username too short
Deno.test({
  name: "sign-up - fails with username too short",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();
    const testData = generateTestData();

    const { data, error } = await supabase.functions.invoke("sign-up", {
      body: {
        email: testData.email,
        password: testData.password,
        username: "ab", // Less than 3 characters
      },
    });

    // Verify validation error
    assert(
      error || (data && data.error),
      "Expected validation error for short username",
    );

    if (data && data.issues) {
      const usernameIssue = data.issues.find((i: { path: string[] }) =>
        i.path.includes("username")
      );
      assertExists(usernameIssue, "Expected username validation issue");
    }

    console.log("✓ Properly rejected short username");
  },
});

// Test: Username with invalid characters
Deno.test({
  name: "sign-up - fails with invalid username characters",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();
    const testData = generateTestData();

    const { data, error } = await supabase.functions.invoke("sign-up", {
      body: {
        email: testData.email,
        password: testData.password,
        username: "user name", // Contains space (invalid)
      },
    });

    // Verify validation error
    assert(
      error || (data && data.error),
      "Expected validation error for invalid username characters",
    );

    if (data && data.issues) {
      const usernameIssue = data.issues.find((i: { path: string[] }) =>
        i.path.includes("username")
      );
      assertExists(usernameIssue, "Expected username validation issue");
    }

    console.log("✓ Properly rejected username with invalid characters");
  },
});

// Test: Username with special characters (should fail)
Deno.test({
  name: "sign-up - fails with special characters in username",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();
    const testData = generateTestData();

    const { data, error } = await supabase.functions.invoke("sign-up", {
      body: {
        email: testData.email,
        password: testData.password,
        username: "user@name!", // Contains @ and ! (invalid)
      },
    });

    // Verify validation error
    assert(
      error || (data && data.error),
      "Expected validation error for special characters",
    );

    console.log("✓ Properly rejected username with special characters");
  },
});

// Test: Valid username with underscores and hyphens
Deno.test("sign-up - accepts username with underscores and hyphens", async () => {
  const supabase = createTestClient();
  const uniqueId = crypto.randomUUID().slice(0, 8);
  const testData = {
    email: `test-${uniqueId}@example.com`,
    username: `test_user-${uniqueId}`, // Valid: underscores and hyphens
    password: "testpassword123",
  };

  try {
    const { data, error } = await supabase.functions.invoke("sign-up", {
      body: testData,
    });

    assert(
      !error,
      `Sign-up with valid username failed: ${error?.message ?? "unknown error"}`,
    );
    assertExists(data.user, "User not created");

    // Verify profile has correct username
    const adminClient = createAdminClient();
    const { data: profile } = await adminClient
      .from("profiles")
      .select("username")
      .eq("id", data.user.id)
      .single();

    assertExists(profile, "Profile not found");
    assertEquals(
      profile.username,
      testData.username,
      "Username not set correctly",
    );

    console.log("✓ Username with underscores and hyphens accepted");
  } finally {
    await cleanupTestUser(testData.email);
  }
});

// Test: Missing required fields
Deno.test({
  name: "sign-up - fails with missing email",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();
    const testData = generateTestData();

    const { data, error } = await supabase.functions.invoke("sign-up", {
      body: {
        // email missing
        password: testData.password,
        username: testData.username,
      },
    });

    assert(
      error || (data && data.error),
      "Expected validation error for missing email",
    );

    console.log("✓ Properly rejected missing email");
  },
});

// Test: Missing password
Deno.test({
  name: "sign-up - fails with missing password",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();
    const testData = generateTestData();

    const { data, error } = await supabase.functions.invoke("sign-up", {
      body: {
        email: testData.email,
        // password missing
        username: testData.username,
      },
    });

    assert(
      error || (data && data.error),
      "Expected validation error for missing password",
    );

    console.log("✓ Properly rejected missing password");
  },
});

// Test: Missing username
Deno.test({
  name: "sign-up - fails with missing username",
  sanitizeResources: false,
  sanitizeOps: false,
  fn: async () => {
    const supabase = createTestClient();
    const testData = generateTestData();

    const { data, error } = await supabase.functions.invoke("sign-up", {
      body: {
        email: testData.email,
        password: testData.password,
        // username missing
      },
    });

    assert(
      error || (data && data.error),
      "Expected validation error for missing username",
    );

    console.log("✓ Properly rejected missing username");
  },
});

// Test: Session is valid and can be used
Deno.test("sign-up - returned session is valid and can be used", async () => {
  const supabase = createTestClient();
  const testData = generateTestData();

  try {
    // Step 1: Sign up
    const { data: signUpData, error: signUpError } = await supabase.functions
      .invoke("sign-up", {
        body: testData,
      });

    assert(!signUpError, "Sign-up failed");
    assertExists(signUpData.session, "Session not returned");

    // Step 2: Set session in client
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token: signUpData.session.access_token,
      refresh_token: signUpData.session.refresh_token,
    });

    assert(!setSessionError, "Failed to set session");

    // Step 3: Verify session by getting user
    const { data: { user }, error: getUserError } = await supabase.auth
      .getUser();

    assert(!getUserError, "Failed to get user with session");
    assertExists(user, "User not found");
    assertEquals(user.email, testData.email, "User email mismatch");

    console.log("✓ Returned session is valid and usable");
  } finally {
    await supabase.auth.signOut();
    await cleanupTestUser(testData.email);
  }
});

// Test: Username uniqueness is case-sensitive
Deno.test("sign-up - username uniqueness is case-sensitive", async () => {
  const supabase = createTestClient();
  const testData1 = generateTestData();
  const testData2 = generateTestData();

  // Use same username but different case
  testData2.username = testData1.username.toUpperCase();

  try {
    // Step 1: Create first user
    const { data: data1, error: error1 } = await supabase.functions.invoke(
      "sign-up",
      {
        body: testData1,
      },
    );

    assert(!error1, "First sign-up failed");
    assertExists(data1.user, "First user not created");

    // Step 2: Create second user with uppercase username
    const { data: data2, error: error2 } = await supabase.functions.invoke(
      "sign-up",
      {
        body: testData2,
      },
    );

    // Should succeed because username is case-sensitive
    assert(
      !error2,
      `Second sign-up should succeed with different case: ${
        error2?.message ?? data2?.error
      }`,
    );
    assertExists(data2.user, "Second user not created");

    console.log("✓ Username uniqueness is case-sensitive (both users created)");
  } finally {
    await cleanupTestUser(testData1.email);
    await cleanupTestUser(testData2.email);
  }
});
