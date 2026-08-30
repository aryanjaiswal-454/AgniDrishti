import { z } from "zod";

export const hotspotQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD").optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD").optional(),
  instrument: z.enum(["MODIS", "VIIRS"]).optional(),
  satellite: z.string().optional(),
  daynight: z.enum(["D", "N"]).optional(),
  bbox: z
    .string()
    .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, "bbox must be minLon,minLat,maxLon,maxLat")
    .optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

export const hotspotParamsSchema = z.object({
  id: z.string().uuid("Invalid hotspot UUID format"),
});

export type HotspotQueryInput = z.infer<typeof hotspotQuerySchema>;
export type HotspotParamsInput = z.infer<typeof hotspotParamsSchema>;

