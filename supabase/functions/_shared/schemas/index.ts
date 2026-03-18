// Re-export all schemas for backwards compatibility and easy imports

// Answer schemas
export {
  chipAnswerSchema,
  likertScaleAnswerSchema,
  multiLineTextAnswerSchema,
  type ReviewAnswer,
  reviewAnswerSchema,
  textAreaAnswerSchema,
  trafficLightAnswerSchema,
} from "./answer-schemas.ts";

// Condition schemas
export {
  categoryInConditionSchema,
  comparisonConditionSchema,
  type Condition,
  conditionSchema,
  equalsConditionSchema,
} from "./condition-schemas.ts";

// Option schemas
export {
  chipOptionSchema,
  likertScaleOptionSchema,
  multiLineTextOptionSchema,
  textAreaOptionSchema,
  trafficLightOptionSchema,
} from "./option-schemas.ts";

// Field schemas
export {
  baseFieldSchema,
  chipFieldSchema,
  type Field,
  fieldSchema,
  likertScaleFieldSchema,
  multiLineTextFieldSchema,
  textAreaFieldSchema,
  trafficLightFieldSchema,
} from "./field-schemas.ts";

// Template schemas
export {
  type ReviewTemplateInput,
  reviewTemplateSchema,
} from "./template-schemas.ts";

// Aggregation schemas
export {
  type ReviewAggregationData,
  reviewAggregationSchema,
} from "./aggregation-schemas.ts";

// Open Graph schemas
export {
  type OgImageObject,
  ogImageObjectSchema,
  type OpenGraphData,
  openGraphDataSchema,
  type SetOpenGraphDataRequest,
  setOpenGraphDataRequestSchema,
  urlSchema,
} from "./open-graph-schemas.ts";

// Case schemas
export {
  type Case,
  type CaseIdParam,
  caseIdSchema,
  caseSchema,
  type ContentType,
  contentTypeSchema,
  type CreateCase,
  createCaseSchema,
  type UpdateCase,
  updateCaseSchema,
} from "./case-schemas.ts";

// Review schemas
export {
  type Category,
  type InProgressReviewAnswer,
  inProgressReviewAnswerSchema,
  type SubmittedReviewAnswerOpinion,
  submittedReviewAnswerOpinionSchema,
  type SubmittedReviewAnswerReport,
  submittedReviewAnswerReportSchema,
  type SubmittedReviewAnswerSatire,
  submittedReviewAnswerSatireSchema,
  submittedReviewAnswerSchemaMap,
  type SubmittedReviewAnswerTextMessage,
  submittedReviewAnswerTextMessageSchema,
} from "./review-schemas.ts";
