import { z } from "zod";

export const updateSystemSettingsSchema = z.object({
  critical_frp_threshold: z.coerce.number().finite().min(0).max(100000),
  anomaly_z_score_threshold: z.coerce.number().finite().min(0).max(100),
  default_map_baselayer: z.enum(["dark", "satellite", "osm_tactical"]),
});

export type UpdateSystemSettingsInput = z.infer<typeof updateSystemSettingsSchema>;
