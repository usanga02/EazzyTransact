import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("8000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
});
export const env = envSchema.parse(process.env);
