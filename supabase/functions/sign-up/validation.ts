import { z } from "npm:zod@3.24.1";

export const signUpSchema = z.object({
  email: z.string().email("Ungültiges E-Mail-Format"),
  password: z
    .string()
    .min(8, "Passwort muss mindestens 8 Zeichen lang sein")
    .max(100, "Passwort ist zu lang"),
  username: z
    .string()
    .min(3, "Benutzername muss mindestens 3 Zeichen lang sein")
    .max(50, "Benutzername ist zu lang")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Benutzername darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten",
    ),
});

export type SignUpPayload = z.infer<typeof signUpSchema>;
