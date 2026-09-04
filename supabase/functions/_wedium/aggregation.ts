import {
  WEDIUM_QUESTION_IDS,
  type WediumAnswers,
  type WediumQuestionId,
} from "./schemas.ts";

export const MIN_WEDIUM_REVIEWS = 2;

type RatingLevel = 0 | 1 | 2 | 3;
type RatingCounts = Record<RatingLevel, number>;
type RatingPercentages = Record<RatingLevel, number>;

export type WediumSubmittedReview = {
  reviewed_by: string;
  data: WediumAnswers;
};

export type WediumAggregationData = {
  questions: Array<{
    id: WediumQuestionId;
    score: number;
    level: RatingLevel;
    fields: Array<{
      id: WediumQuestionId;
      type: "traffic-light";
      counts: RatingCounts;
      percentages: RatingPercentages;
      average: number;
      level: RatingLevel;
    }>;
  }>;
};

export type WediumAggregationResult = {
  data: WediumAggregationData;
  resultScore: number;
  reviewerIds: string[];
};

export type WediumResultCode =
  | "trustworthy"
  | "rather_trustworthy"
  | "rather_not_trustworthy"
  | "not_trustworthy";

export function scoreToLevel(score: number): RatingLevel {
  return Math.max(0, Math.min(3, Math.ceil(score))) as RatingLevel;
}

export function levelToResultCode(level: RatingLevel): WediumResultCode {
  const codes: Record<RatingLevel, WediumResultCode> = {
    0: "trustworthy",
    1: "rather_trustworthy",
    2: "rather_not_trustworthy",
    3: "not_trustworthy",
  };

  return codes[level];
}

export function buildWediumAggregation(
  reviews: WediumSubmittedReview[],
): WediumAggregationResult {
  const questions: WediumAggregationData["questions"] = [];

  for (const questionId of WEDIUM_QUESTION_IDS) {
    const counts: RatingCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };

    for (const review of reviews) {
      const value = review.data[questionId];
      counts[value] += 1;
    }

    const percentages: RatingPercentages = { 0: 0, 1: 0, 2: 0, 3: 0 };

    for (const value of [0, 1, 2, 3] as const) {
      percentages[value] = reviews.length > 0
        ? (counts[value] / reviews.length) * 100
        : 0;
    }

    const average = reviews.length > 0
      ? (counts[1] + counts[2] * 2 + counts[3] * 3) / reviews.length
      : 0;
    const level = scoreToLevel(average);

    questions.push({
      id: questionId,
      score: average,
      level,
      fields: [{
        id: questionId,
        type: "traffic-light",
        counts,
        percentages,
        average,
        level,
      }],
    });
  }

  const resultScore = questions.length > 0
    ? Math.max(...questions.map((question) => question.score))
    : 0;

  return {
    data: { questions },
    resultScore,
    reviewerIds: reviews.map((review) => review.reviewed_by),
  };
}
