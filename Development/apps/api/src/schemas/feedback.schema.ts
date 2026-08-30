import { z } from "zod";

export const submitFeedbackSchema = z.object({
  corrected_label: z.string().min(2, "Corrected label is required").trim(),
  notes: z.string().max(1000).optional(),
});

export const exportQuerySchema = z.object({
  format: z.enum(["json", "csv"]).default("json"),
  primary_class: z.enum(["industrial", "natural"]).optional(),
  sub_class: z
    .enum([
      "industrial_fire",
      "gas_flare",
      "agricultural_burning",
      "mining_activity",
      "forest_fire",
      "other_natural",
      "unclassified",
    ])
    .optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD").optional(),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type ExportQueryInput = z.infer<typeof exportQuerySchema>;

