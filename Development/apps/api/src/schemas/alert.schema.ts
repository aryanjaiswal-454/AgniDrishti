import { z } from "zod";

export const alertQuerySchema = z.object({
  severity: z.enum(["high", "medium", "low"]).optional(),
  status: z.enum(["new", "acknowledged", "resolved", "false_positive"]).optional(),
  active_only: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const alertParamsSchema = z.object({
  id: z.string().uuid("Invalid alert UUID format"),
});

export const updateAlertStatusSchema = z.object({
  status: z.enum(["new", "acknowledged", "resolved", "false_positive"]),
});

export type AlertQueryInput = z.infer<typeof alertQuerySchema>;
export type AlertParamsInput = z.infer<typeof alertParamsSchema>;
export type UpdateAlertStatusInput = z.infer<typeof updateAlertStatusSchema>;

