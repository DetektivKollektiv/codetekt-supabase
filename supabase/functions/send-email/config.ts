// ─── Email Trigger Configuration ─────────────────────────────────────────────

/**
 * How many submitted reviews a case must reach before the case creator
 * receives a milestone notification email.
 *
 * The DB trigger fires on every INSERT into review_answers_submitted and
 * forwards the current count. This edge function only sends the email
 * when the count exactly equals this value.
 *
 * Change this number and redeploy the function — no DB migration needed.
 */
export const REVIEW_MILESTONE_COUNT = 5;
