import { z } from "npm:zod@4.1.13";

// Schema for Open Graph image object
export const ogImageObjectSchema = z.object({
  url: z.string().url(),
  width: z.string().optional(),
  height: z.string().optional(),
  type: z.string().optional(),
  alt: z.string().optional(),
});

// Schema for validating URLs
export const urlSchema = z.string().url("Invalid URL format");

// Schema for Open Graph data returned from scraping
export const openGraphDataSchema = z.object({
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogUrl: z.string().url().optional(),
  ogType: z.string().optional(),
  ogSiteName: z.string().optional(),
  ogLocale: z.string().optional(),
  ogImage: z.union([
    z.string().url(),
    z.array(z.string().url()),
    z.array(ogImageObjectSchema),
  ]).optional(),
  success: z.boolean().optional(),
  charset: z.string().optional(),
  requestUrl: z.string().url().optional(),
}).passthrough();

// Schema for the request payload
export const setOpenGraphDataRequestSchema = z.object({
  case_id: z.string().uuid("Invalid case_id: must be a valid UUID"),
});

// Export types
export type OpenGraphData = z.infer<typeof openGraphDataSchema>;
export type OgImageObject = z.infer<typeof ogImageObjectSchema>;
export type SetOpenGraphDataRequest = z.infer<typeof setOpenGraphDataRequestSchema>;
