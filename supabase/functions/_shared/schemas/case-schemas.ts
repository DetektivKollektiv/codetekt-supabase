import { z } from "npm:zod@4.1.13";

// Content type enum
export const contentTypeSchema = z.enum(["url", "text"], {
  error: "content_type must be either 'url' or 'text'",
});

// Schema for creating a new case
export const createCaseSchema = z.object({
  content: z.string().min(1, "content is required"),
  content_type: contentTypeSchema,
  template_version: z.number().int().positive("template_version must be a positive integer"),
  submitted_by: z.string().uuid("submitted_by must be a valid UUID"),
});

// Schema for updating an existing case
export const updateCaseSchema = z.object({
  content: z.string().min(1, "content is required").optional(),
  content_type: contentTypeSchema.optional(),
  template_version: z.number().int().positive("template_version must be a positive integer").optional(),
}).strict();

// Schema for case query/response
export const caseSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  content_type: contentTypeSchema,
  template_version: z.number().int().positive(),
  submitted_by: z.string().uuid(),
  submitted_at: z.string().datetime(),
});

// Schema for case ID parameter
export const caseIdSchema = z.object({
  case_id: z.string().uuid("Invalid case_id: must be a valid UUID"),
});

// Export types
export type ContentType = z.infer<typeof contentTypeSchema>;
export type CreateCase = z.infer<typeof createCaseSchema>;
export type UpdateCase = z.infer<typeof updateCaseSchema>;
export type Case = z.infer<typeof caseSchema>;
export type CaseIdParam = z.infer<typeof caseIdSchema>;
