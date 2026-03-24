/**
 * E2E test suite — Full Review Pipeline
 *
 * Mirrors test_e2e.sh but written in Deno TypeScript.
 *
 * Run:
 *   deno test --allow-net --allow-env test_e2e.ts
 */
import { assert, assertEquals, assertExists } from "jsr:@std/assert@1";

// ── Config ────────────────────────────────────────────────────────────────────
const API = "http://127.0.0.1:54321";

const ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

const SERVICE_ROLE_KEY = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";

const CASE_ID = "99999999-9999-4999-8999-999999999999";
const USER_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"; // gormlabenz (admin)
const USER_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"; // annaschmidt
const USER_C = "cccccccc-cccc-cccc-cccc-cccccccccccc"; // maxmueller
const USER_D = "dddddddd-dddd-dddd-dddd-dddddddddddd"; // lisaweber

// Valid review data for the 'report' category (all required fields)
const REVIEW_DATA = {
    content_accuracy: 3,
    content_sources: 2,
    content_language: 3,
    content_clarity: 3,
    content_references: 2,
    content_logic: 3,
    content_advertising: 3,
    content_rhetorical_manipulation: 3,
    content_objective_no_hate_no_panic: 3,
    content_headline_matches_article: 3,
    content_claims_not_debunked: 3,
    media_objectivity: 3,
    media_no_ai_or_staging_doubts: 3,
    media_visualizations_not_distorted: 3,
    media_visualization_data_traceable: 3,
    medium_no_aggressive_ads_or_trackers: 3,
    medium_impressum: 3,
    source_article_author_expertise: 3,
    source_claims_supported: 2,
    source_listed_and_verifiable: 3,
    source_claims_match_originals: 3,
    source_experts_verified: 2,
    quotes_experts_reputation: 3,
    quotes_identifiable_persons: 3,
    quotes_context_accurate: 3,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

interface RestOpts {
    token?: string;
    serviceRole?: boolean;
    body?: unknown;
    prefer?: string;
}

/** Generic REST helper — returns { status, data }. */
async function rest(
    method: string,
    path: string,
    opts: RestOpts = {},
): Promise<{ status: number; data: unknown }> {
    const apikey = opts.serviceRole ? SERVICE_ROLE_KEY : ANON_KEY;
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "apikey": apikey,
        "Accept": "application/json",
    };
    if (opts.token) {
        headers["Authorization"] = `Bearer ${opts.token}`;
    } else if (opts.serviceRole) {
        headers["Authorization"] = `Bearer ${SERVICE_ROLE_KEY}`;
    }
    if (opts.prefer) headers["Prefer"] = opts.prefer;

    const res = await fetch(`${API}${path}`, {
        method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
    const text = await res.text();
    let data: unknown = null;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }
    return { status: res.status, data };
}

/** Invoke an edge function with a user token. */
async function invoke(
    name: string,
    token: string,
    body: unknown,
): Promise<{ status: number; data: unknown }> {
    const res = await fetch(`${API}/functions/v1/${name}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            "apikey": ANON_KEY,
        },
        body: JSON.stringify(body),
    });
    const text = await res.text();
    let data: unknown = null;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }
    return { status: res.status, data };
}

/** Sign in a user and return their access token. */
async function signIn(email: string, password: string): Promise<string> {
    const { data } = await rest(
        "POST",
        "/auth/v1/token?grant_type=password",
        { body: { email, password } },
    );
    const d = data as Record<string, unknown>;
    if (!d.access_token) {
        throw new Error(`Sign in failed for ${email}: ${JSON.stringify(d)}`);
    }
    return d.access_token as string;
}

/** Get in-progress draft id for a user on a case. */
async function getDraftId(token: string, caseId: string): Promise<string> {
    const { data } = await rest(
        "GET",
        `/rest/v1/review_answers_in_progress?case_id=eq.${caseId}&select=id`,
        { token },
    );
    const rows = data as Array<{ id: string }>;
    assertExists(rows[0]?.id, "No draft found");
    return rows[0].id;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Test ──────────────────────────────────────────────────────────────────────
Deno.test({
    name: "E2E: Full Review Pipeline",
    sanitizeResources: false,
    sanitizeOps: false,
    fn: async (t) => {
        // Mutable shared state across steps (steps run sequentially)
        let tokenA = "";
        let tokenB = "";
        let tokenC = "";
        let tokenD = "";
        let commentId = "";
        let disputeId = "";

        // ── Setup ─────────────────────────────────────────────────────────────────
        await t.step("Setup: delete stale test case", async () => {
            // Cascades to all related tables
            await rest("DELETE", `/rest/v1/cases?id=eq.${CASE_ID}`, {
                serviceRole: true,
            });
        });

        await t.step("Setup: insert test case", async () => {
            const { status, data } = await rest("POST", "/rest/v1/cases", {
                serviceRole: true,
                prefer: "return=representation",
                body: {
                    id: CASE_ID,
                    submitted_by: USER_A,
                    content: "https://example.com/e2e-test-article",
                    content_type: "url",
                },
            });
            assert(
                status === 201,
                `Insert case failed (${status}): ${JSON.stringify(data)}`,
            );
        });

        await t.step("Setup: insert case metadata", async () => {
            const { status: s1 } = await rest("POST", "/rest/v1/case_titles", {
                serviceRole: true,
                body: {
                    case_id: CASE_ID,
                    value: "E2E Test Article",
                    created_by: USER_A,
                },
            });
            assert(s1 === 201, `Insert case_titles failed: ${s1}`);

            const { status: s2 } = await rest(
                "POST",
                "/rest/v1/case_categories",
                {
                    serviceRole: true,
                    body: {
                        case_id: CASE_ID,
                        value: "report",
                        created_by: USER_A,
                    },
                },
            );
            assert(s2 === 201, `Insert case_categories failed: ${s2}`);

            const { status: s3 } = await rest(
                "POST",
                "/rest/v1/case_keywords",
                {
                    serviceRole: true,
                    body: {
                        case_id: CASE_ID,
                        created_by: USER_A,
                        values: ["test", "e2e"],
                    },
                },
            );
            assert(s3 === 201, `Insert case_keywords failed: ${s3}`);
        });

        // ── Phase A: Auth ──────────────────────────────────────────────────────────
        await t.step("Phase A: sign in all test users", async () => {
            tokenA = await signIn("gorm-labenz@hotmail.com", "testpassword123");
            tokenB = await signIn(
                "anna.schmidt@example.com",
                "testpassword123",
            );
            tokenC = await signIn("max.mueller@example.com", "testpassword123");
            tokenD = await signIn("lisa.weber@example.com", "testpassword123");
        });

        // ── Phase B: get-review-template (before any reviews) ─────────────────────
        await t.step(
            "Phase B: get-review-template returns array of sections",
            async () => {
                const { status, data } = await invoke(
                    "get-review-template",
                    tokenB,
                    {
                        case_id: CASE_ID,
                    },
                );
                assertEquals(
                    status,
                    200,
                    `Expected 200, got ${status}: ${JSON.stringify(data)}`,
                );
                assert(
                    Array.isArray(data) && (data as unknown[]).length > 0,
                    "Expected non-empty array",
                );
            },
        );

        await t.step("Phase B: all sections have 'fields' key", async () => {
            const { data } = await invoke("get-review-template", tokenB, {
                case_id: CASE_ID,
            });
            assert(
                (data as Array<Record<string, unknown>>).every((s) =>
                    "fields" in s
                ),
                "Each section should have a 'fields' key",
            );
        });

        // ── Phase C: Review Flow ───────────────────────────────────────────────────
        await t.step("Phase C: User A saves draft", async () => {
            const { data } = await invoke(
                "set-review-answers-in-progress",
                tokenA,
                {
                    case_id: CASE_ID,
                    data: REVIEW_DATA,
                },
            );
            assertEquals((data as Record<string, unknown>).saved, true);
        });

        await t.step("Phase C: User A submits review", async () => {
            const draftId = await getDraftId(tokenA, CASE_ID);
            const { data } = await invoke(
                "set-review-answers-submitted",
                tokenA,
                {
                    in_progress_id: draftId,
                },
            );
            const d = data as Record<string, unknown>;
            assertEquals(d.saved, true);
            assertExists(d.review_id);
        });

        await t.step("Phase C: User B saves draft", async () => {
            const { data } = await invoke(
                "set-review-answers-in-progress",
                tokenB,
                {
                    case_id: CASE_ID,
                    data: REVIEW_DATA,
                },
            );
            assertEquals((data as Record<string, unknown>).saved, true);
        });

        await t.step("Phase C: User B submits review", async () => {
            const draftId = await getDraftId(tokenB, CASE_ID);
            const { data } = await invoke(
                "set-review-answers-submitted",
                tokenB,
                {
                    in_progress_id: draftId,
                },
            );
            assertEquals((data as Record<string, unknown>).saved, true);
        });

        await t.step(
            "Phase C: aggregation exists with 2 reviewer_ids after 2 reviews",
            async () => {
                await sleep(3000);
                const { data } = await rest(
                    "GET",
                    `/rest/v1/review_aggregations?case_id=eq.${CASE_ID}&select=case_id,result_score,reviewer_ids`,
                    { token: tokenA },
                );
                const aggs = data as Array<Record<string, unknown>>;
                assertEquals(aggs.length, 1, "Expected 1 aggregation row");
                assertEquals(
                    (aggs[0].reviewer_ids as unknown[]).length,
                    2,
                    "Expected 2 reviewer_ids",
                );
                assert(
                    !isNaN(parseFloat(aggs[0].result_score as string)),
                    "result_score should be numeric",
                );
            },
        );

        await t.step("Phase C: User C saves draft (3rd reviewer)", async () => {
            const { data } = await invoke(
                "set-review-answers-in-progress",
                tokenC,
                {
                    case_id: CASE_ID,
                    data: REVIEW_DATA,
                },
            );
            assertEquals((data as Record<string, unknown>).saved, true);
        });

        await t.step("Phase C: User C submits review", async () => {
            const draftId = await getDraftId(tokenC, CASE_ID);
            const { data } = await invoke(
                "set-review-answers-submitted",
                tokenC,
                {
                    in_progress_id: draftId,
                },
            );
            assertEquals((data as Record<string, unknown>).saved, true);
        });

        await t.step(
            "Phase C: aggregation updated to 3 reviewer_ids",
            async () => {
                await sleep(3000);
                const { data } = await rest(
                    "GET",
                    `/rest/v1/review_aggregations?case_id=eq.${CASE_ID}&select=reviewer_ids`,
                    { token: tokenA },
                );
                const aggs = data as Array<Record<string, unknown>>;
                assertEquals(
                    (aggs[0].reviewer_ids as unknown[]).length,
                    3,
                    "Expected 3 reviewer_ids",
                );
            },
        );

        // ── Phase D: Comment System ────────────────────────────────────────────────
        await t.step("Phase D: User B creates a comment", async () => {
            const { status, data } = await rest(
                "POST",
                "/rest/v1/case_comments",
                {
                    token: tokenB,
                    prefer: "return=representation",
                    body: {
                        case_id: CASE_ID,
                        author_id: USER_B,
                        content: "This is a test comment on the e2e case.",
                    },
                },
            );
            const rows = data as Array<Record<string, unknown>>;
            assert(
                status === 201,
                `Expected 201, got ${status}: ${JSON.stringify(data)}`,
            );
            assertExists(rows[0]?.id, "Comment should have an id");
            commentId = rows[0].id as string;
        });

        await t.step("Phase D: comment is publicly readable", async () => {
            const { data } = await rest(
                "GET",
                `/rest/v1/case_comments?case_id=eq.${CASE_ID}`,
                {},
            );
            const rows = data as Array<Record<string, unknown>>;
            assert(
                rows.some((c) => c.id === commentId),
                "Comment should appear in public read",
            );
        });

        await t.step("Phase D: User C likes the comment", async () => {
            const { status, data } = await rest(
                "POST",
                "/rest/v1/case_comment_likes",
                {
                    token: tokenC,
                    prefer: "return=representation",
                    body: { comment_id: commentId, user_id: USER_C },
                },
            );
            const rows = data as unknown[];
            assert(
                status === 201,
                `Expected 201, got ${status}: ${JSON.stringify(data)}`,
            );
            assertEquals(rows.length, 1);
        });

        await t.step("Phase D: User D reports the comment", async () => {
            const { status, data } = await rest(
                "POST",
                "/rest/v1/case_comment_reports",
                {
                    token: tokenD,
                    prefer: "return=representation",
                    body: {
                        comment_id: commentId,
                        reported_by: USER_D,
                        reason:
                            "This comment is part of an automated e2e test.",
                    },
                },
            );
            const rows = data as unknown[];
            assert(
                status === 201,
                `Expected 201, got ${status}: ${JSON.stringify(data)}`,
            );
            assertEquals(rows.length, 1);
        });

        await t.step("Phase D: User B edits the comment", async () => {
            const { status, data } = await rest(
                "PATCH",
                `/rest/v1/case_comments?id=eq.${commentId}`,
                {
                    token: tokenB,
                    prefer: "return=representation",
                    body: { content: "This is the edited test comment." },
                },
            );
            const rows = data as Array<Record<string, unknown>>;
            assert(
                status === 200,
                `Expected 200, got ${status}: ${JSON.stringify(data)}`,
            );
            assertEquals(rows[0]?.content, "This is the edited test comment.");
        });

        await t.step("Phase D: Admin moderates the comment", async () => {
            const { status, data } = await rest(
                "POST",
                "/rest/v1/case_comment_moderations",
                {
                    token: tokenA,
                    prefer: "return=representation",
                    body: {
                        comment_id: commentId,
                        reason: "Moderated as part of e2e test.",
                        moderated_by: USER_A,
                    },
                },
            );
            const rows = data as unknown[];
            assert(
                status === 201,
                `Expected 201, got ${status}: ${JSON.stringify(data)}`,
            );
            assertEquals(rows.length, 1);
        });

        await t.step(
            "Phase D: User B cannot edit a moderated comment",
            async () => {
                const { data } = await rest(
                    "PATCH",
                    `/rest/v1/case_comments?id=eq.${commentId}`,
                    {
                        token: tokenB,
                        prefer: "return=representation",
                        body: {
                            content: "Trying to edit a moderated comment.",
                        },
                    },
                );
                // RLS blocks the update — PostgREST returns an empty array (0 rows affected)
                const rows = data as unknown[];
                assertEquals(
                    rows.length,
                    0,
                    "Moderated comment should not be editable",
                );
            },
        );

        // ── Phase E: Dispute Flow ──────────────────────────────────────────────────
        await t.step("Phase E: User C creates a dispute", async () => {
            const { status, data } = await rest(
                "POST",
                "/rest/v1/cases_metadata_disputes",
                {
                    token: tokenC,
                    prefer: "return=representation",
                    body: {
                        case_id: CASE_ID,
                        metadata_field: "category",
                        original_value: "report",
                        disputed_by: USER_C,
                        reason: "Category seems incorrect for this content.",
                    },
                },
            );
            const rows = data as Array<Record<string, unknown>>;
            assert(
                status === 201,
                `Expected 201, got ${status}: ${JSON.stringify(data)}`,
            );
            assertExists(rows[0]?.id);
            disputeId = rows[0].id as string;
        });

        await t.step(
            "Phase E: get-review-template blocked (403) while dispute is open",
            async () => {
                const { status } = await invoke("get-review-template", tokenD, {
                    case_id: CASE_ID,
                });
                assertEquals(
                    status,
                    403,
                    `Expected 403 while dispute open, got ${status}`,
                );
            },
        );

        await t.step(
            "Phase E: Admin resolves dispute via service_role",
            async () => {
                const { status, data } = await rest(
                    "PATCH",
                    `/rest/v1/cases_metadata_disputes?id=eq.${disputeId}`,
                    {
                        serviceRole: true,
                        prefer: "return=representation",
                        body: {
                            resolution: "original_kept",
                            final_value: "report",
                            resolved_by: USER_A,
                            resolved_at: new Date().toISOString(),
                        },
                    },
                );
                assert(
                    status === 200,
                    `Dispute resolution failed (${status}): ${
                        JSON.stringify(data)
                    }`,
                );
            },
        );

        await t.step(
            "Phase E: get-review-template unblocked (200) after dispute resolved",
            async () => {
                const { status, data } = await invoke(
                    "get-review-template",
                    tokenD,
                    {
                        case_id: CASE_ID,
                    },
                );
                assertEquals(
                    status,
                    200,
                    `Expected 200 after dispute resolved, got ${status}: ${
                        JSON.stringify(data)
                    }`,
                );
            },
        );
    },
});
