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

Deno.test("Wedium aggregation returns every question with values from zero to three", () => {
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
  assertEquals(question?.score, 0.5);
  assertEquals(question?.level, 1);
  assertEquals(result.resultScore, 2.5);
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

Deno.test("Wedium result levels and codes use the platform ceiling mapping", () => {
  assertEquals(scoreToLevel(0), 0);
  assertEquals(scoreToLevel(0.01), 1);
  assertEquals(scoreToLevel(1), 1);
  assertEquals(scoreToLevel(1.01), 2);
  assertEquals(scoreToLevel(2.01), 3);
  assertEquals(levelToResultCode(0), "trustworthy");
  assertEquals(levelToResultCode(1), "rather_trustworthy");
  assertEquals(levelToResultCode(2), "rather_not_trustworthy");
  assertEquals(levelToResultCode(3), "not_trustworthy");
});
