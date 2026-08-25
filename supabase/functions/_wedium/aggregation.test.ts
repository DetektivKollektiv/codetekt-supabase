import { assertEquals } from "jsr:@std/assert@1";
import {
  buildWediumAggregation,
  levelToResultCode,
  scoreToLevel,
} from "./aggregation.ts";
import type { WediumAnswers } from "./schemas.ts";

function answers(values: Partial<WediumAnswers>): WediumAnswers {
  return {
    placeholder_question_1: 0,
    placeholder_question_2: 0,
    placeholder_question_3: 0,
    placeholder_question_4: 0,
    placeholder_question_5: 0,
    ...values,
  };
}

Deno.test("Wedium aggregation excludes not applicable votes from statistics", () => {
  const result = buildWediumAggregation([
    {
      reviewed_by: "reviewer-a",
      data: answers({
        placeholder_question_1: 0,
        placeholder_question_3: 1,
      }),
    },
    {
      reviewed_by: "reviewer-b",
      data: answers({
        placeholder_question_1: 1,
        placeholder_question_3: 2,
      }),
    },
    {
      reviewed_by: "reviewer-c",
      data: answers({
        placeholder_question_1: 4,
        placeholder_question_3: 3,
      }),
    },
  ]);

  const question = result.data.questions.find(
    ({ id }) => id === "placeholder_question_1",
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
  assertEquals(result.resultScore, 2);
  assertEquals(result.reviewerIds, ["reviewer-a", "reviewer-b", "reviewer-c"]);
});

Deno.test("Wedium aggregation removes a question at fifty percent not applicable", () => {
  const result = buildWediumAggregation([
    {
      reviewed_by: "reviewer-a",
      data: answers({ placeholder_question_2: 4 }),
    },
    {
      reviewed_by: "reviewer-b",
      data: answers({ placeholder_question_2: 2 }),
    },
  ]);

  assertEquals(
    result.data.questions.some(
      ({ id }) => id === "placeholder_question_2",
    ),
    false,
  );
});

Deno.test("Wedium aggregation returns an empty neutral result when all answers are not applicable", () => {
  const notApplicable = answers({
    placeholder_question_1: 4,
    placeholder_question_2: 4,
    placeholder_question_3: 4,
    placeholder_question_4: 4,
    placeholder_question_5: 4,
  });
  const result = buildWediumAggregation([
    { reviewed_by: "reviewer-a", data: notApplicable },
    { reviewed_by: "reviewer-b", data: notApplicable },
  ]);

  assertEquals(result.data.questions, []);
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
