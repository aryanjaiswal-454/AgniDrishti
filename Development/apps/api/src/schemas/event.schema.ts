import { z } from "zod";

export const eventQuerySchema = z.object({
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
  facility_id: z.string().uuid().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  is_anomalous: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
  min_confidence: z.coerce.number().min(0).max(1).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD").optional(),
  bbox: z
    .string()
    .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, "bbox must be minLon,minLat,maxLon,maxLat")
    .optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const eventParamsSchema = z.object({
  id: z.string().uuid("Invalid event UUID format"),
});

export type EventQueryInput = z.infer<typeof eventQuerySchema>;
export type EventParamsInput = z.infer<typeof eventParamsSchema>;

