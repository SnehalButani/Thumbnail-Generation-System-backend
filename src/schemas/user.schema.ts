import { z } from 'zod';
export const signUpSchema = z.object({
  name: z
    .string("Name is required")
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name must be at most 50 characters"),

  email: z
    .string("Email is required")
    .email("Invalid email address"),

  password: z
    .string("Password is required")
    .min(8, "Password must be at least 8 characters")
});
export type signUpInput = z.infer<typeof signUpSchema>;

export const signInSchema = z.object({
  email: z.string("Email is required").email("Invalid email address"),
  password: z.string("Password is required").min(8)
});

export type signInInput = z.infer<typeof signInSchema>;
