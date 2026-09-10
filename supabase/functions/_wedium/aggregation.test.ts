import { assertEquals } from "jsr:@std/assert@1";
import {
  buildWediumAggregation,
  levelToResultCode,
  scoreToLevel,
} from "./aggregation.ts";
import { WEDIUM_QUESTION_IDS, type WediumAnswers } from "./schemas.ts";

function answers(values: Partial<WediumAnswers>): WediumAnswers {
  return Object.fromEntries(
    WEDIUM_QUESTION_IDS.map((questionId) => [
      questionId,
      values[questionId] ?? 0,
    ]),
  ) as WediumAnswers;
}

Deno.test("Wedium aggregation corrects every question while preserving distributions", () => {
  const result = buildWediumAggregation([
    {
      reviewed_by: "reviewer-a",
      data: answers({
        content_deepfake: 0,
        presentation_generalizing: 2,
      }),
    },
    {
      reviewed_by: "reviewer-b",
      data: answers({
        content_deepfake: 1,
        presentation_generalizing: 3,
      }),
    },
  ]);

  const question = result.data.questions.find(
    ({ id }) => id === "content_deepfake",
  );
  assertEquals(question?.fields[0].counts, { 0: 1, 1: 1, 2: 0, 3: 0 });
  assertEquals(question?.fields[0].percentages, {
    0: 50,
    1: 50,
    2: 0,
    3: 0,
  });
  assertEquals(question?.score, 0);
  assertEquals(question?.level, 0);
  assertEquals(question?.fields[0].average, 0);
  assertEquals(result.resultScore, 1.5);
  assertEquals(result.reviewerIds, ["reviewer-a", "reviewer-b"]);
  assertEquals(
    result.data.questions.map(({ id }) => id),
    [...WEDIUM_QUESTION_IDS],
  );
});

Deno.test("Wedium aggregation returns all neutral questions when every answer is zero", () => {
  const neutralAnswers = answers({});
  const result = buildWediumAggregation([
    { reviewed_by: "reviewer-a", data: neutralAnswers },
    { reviewed_by: "reviewer-b", data: neutralAnswers },
  ]);

  assertEquals(result.data.questions.length, WEDIUM_QUESTION_IDS.length);
  assertEquals(
    result.data.questions.every(({ score, level }) =>
      score === 0 && level === 0
    ),
    true,
  );
  assertEquals(result.resultScore, 0);
});

Deno.test("Wedium correction decreases through eight reviews and stops at nine", () => {
  const cases = [
    { reviewCount: 2, score: 2, level: 2 },
    { reviewCount: 3, score: 2.33, level: 2 },
    { reviewCount: 4, score: 2.5, level: 3 },
    { reviewCount: 8, score: 2.75, level: 3 },
    { reviewCount: 9, score: 3, level: 3 },
  ] as const;

  for (const { reviewCount, score, level } of cases) {
    const redAnswers = answers(
      Object.fromEntries(WEDIUM_QUESTION_IDS.map((id) => [id, 3])),
    );
    const result = buildWediumAggregation(
      Array.from({ length: reviewCount }, (_, index) => ({
        reviewed_by: `reviewer-${index}`,
        data: redAnswers,
      })),
    );

    assertEquals(result.resultScore, score);
    assertEquals(
      result.data.questions.every((question) =>
        question.score === score &&
        question.level === level &&
        question.fields[0].average === score &&
        question.fields[0].level === level
      ),
      true,
    );
  }
});

Deno.test("Wedium result levels and codes use commercial rounding", () => {
  assertEquals(scoreToLevel(0), 0);
  assertEquals(scoreToLevel(0.49), 0);
  assertEquals(scoreToLevel(0.5), 1);
  assertEquals(scoreToLevel(1), 1);
  assertEquals(scoreToLevel(1.49), 1);
  assertEquals(scoreToLevel(1.5), 2);
  assertEquals(scoreToLevel(2.49), 2);
  assertEquals(scoreToLevel(2.5), 3);
  assertEquals(levelToResultCode(0), "trustworthy");
  assertEquals(levelToResultCode(1), "rather_trustworthy");
  assertEquals(levelToResultCode(2), "rather_not_trustworthy");
  assertEquals(levelToResultCode(3), "not_trustworthy");
});
