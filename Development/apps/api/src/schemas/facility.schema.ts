import { z } from "zod";

export const facilityQuerySchema = z.object({
  facility_type: z
    .enum([
      "refinery",
      "petrochemical",
      "power_plant",
      "steel",
      "mining",
      "lng_terminal",
      "other_industrial",
    ])
    .optional(),
  state: z.string().optional(),
  district: z.string().optional(),
  search: z.string().optional(),
  // Bounding box format: minLon,minLat,maxLon,maxLat
  bbox: z
    .string()
    .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, "bbox must be minLon,minLat,maxLon,maxLat")
    .optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const facilityParamsSchema = z.object({
  id: z.string().uuid("Invalid facility UUID format"),
});

export type FacilityQueryInput = z.infer<typeof facilityQuerySchema>;
export type FacilityParamsInput = z.infer<typeof facilityParamsSchema>;

