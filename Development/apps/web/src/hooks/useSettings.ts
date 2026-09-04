import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSystemSettings, updateSystemSettings, SystemSettings } from "../api/settings";
import { queryKeys } from "../query/queryKeys";

export function useSystemSettings() {
  return useQuery({
    queryKey: queryKeys.settings.current(),
    queryFn: ({ signal }) => getSystemSettings(signal),
    staleTime: 60_000,
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      settings: Pick<SystemSettings, "critical_frp_threshold" | "anomaly_z_score_threshold" | "default_map_baselayer">
    ) => updateSystemSettings(settings),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.settings.current(), {
        success: true,
        data: result.data.settings,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.facilities.all });
    },
  });
}
