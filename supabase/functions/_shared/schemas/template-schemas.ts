import { z } from "npm:zod@4.1.13";
import { fieldSchema } from "./field-schemas.ts";

// Review template schema
export const reviewTemplateSchema = z.object({
  id: z.string(),
  metadata: z.object({
    title: z.string(),
    text: z.string(),
    help_url: z.string(),
    indent_level: z.number().optional(),
  }),
  fields: z.array(fieldSchema),
});

export type ReviewTemplateInput = z.infer<typeof reviewTemplateSchema>;
