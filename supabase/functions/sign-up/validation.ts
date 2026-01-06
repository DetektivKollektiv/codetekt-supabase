import { z } from "npm:zod@3.24.1";

export const signUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username is too long")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens",
    ),
});

export type SignUpPayload = z.infer<typeof signUpSchema>;
