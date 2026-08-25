import { assertEquals } from "jsr:@std/assert@1";
import {
  putWediumReviewBodySchema,
  wediumAggregationRequestSchema,
} from "./schemas.ts";

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

const validAnswers = {
  placeholder_question_1: 0,
  placeholder_question_2: 1,
  placeholder_question_3: 2,
  placeholder_question_4: 3,
  placeholder_question_5: 4,
};

Deno.test("Wedium review schema accepts all five rating values", () => {
  assertEquals(
    putWediumReviewBodySchema.safeParse({ answers: validAnswers }).success,
    true,
  );
});

Deno.test("Wedium review schema requires every placeholder question", () => {
  const { placeholder_question_5: _removed, ...incompleteAnswers } =
    validAnswers;

  assertEquals(
    putWediumReviewBodySchema.safeParse({ answers: incompleteAnswers }).success,
    false,
  );
});

Deno.test("Wedium review schema rejects unknown fields and invalid values", () => {
  assertEquals(
    putWediumReviewBodySchema.safeParse({
      answers: { ...validAnswers, another_question: 1 },
    }).success,
    false,
  );
  assertEquals(
    putWediumReviewBodySchema.safeParse({
      answers: { ...validAnswers, placeholder_question_1: 5 },
    }).success,
    false,
  );
  assertEquals(
    putWediumReviewBodySchema.safeParse({
      answers: { ...validAnswers, placeholder_question_1: null },
    }).success,
    false,
  );
});

Deno.test("Wedium aggregation request accepts one to one hundred unique hashes", () => {
  assertEquals(
    wediumAggregationRequestSchema.safeParse({ post_hashes: [HASH_A, HASH_B] })
      .success,
    true,
  );
  assertEquals(
    wediumAggregationRequestSchema.safeParse({
      post_hashes: Array.from(
        { length: 100 },
        (_, index) => index.toString(16).padStart(64, "0"),
      ),
    }).success,
    true,
  );
});

Deno.test("Wedium aggregation request rejects duplicates and invalid sizes", () => {
  assertEquals(
    wediumAggregationRequestSchema.safeParse({ post_hashes: [HASH_A, HASH_A] })
      .success,
    false,
  );
  assertEquals(
    wediumAggregationRequestSchema.safeParse({ post_hashes: [] }).success,
    false,
  );
  assertEquals(
    wediumAggregationRequestSchema.safeParse({
      post_hashes: Array.from(
        { length: 101 },
        (_, index) => index.toString(16).padStart(64, "0"),
      ),
    }).success,
    false,
  );
});

Deno.test("Wedium aggregation request rejects non-canonical hashes", () => {
  assertEquals(
    wediumAggregationRequestSchema.safeParse({
      post_hashes: ["A".repeat(64)],
    }).success,
    false,
  );
  assertEquals(
    wediumAggregationRequestSchema.safeParse({ post_hashes: ["a".repeat(63)] })
      .success,
    false,
  );
});
