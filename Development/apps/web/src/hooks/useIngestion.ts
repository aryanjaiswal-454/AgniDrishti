import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getIngestionStatus, triggerFirmsIngestion, triggerOsmSync } from "../api/ingestion";
import { IngestionTelemetryResponse, ApiResponse } from "../api/types";
import { queryKeys } from "../query/queryKeys";

/**
 * Hook to query live ingestion telemetry and queue health.
 */
export function useIngestionStatus(
  options?: Omit<UseQueryOptions<ApiResponse<IngestionTelemetryResponse>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.ingestion.status(),
    queryFn: ({ signal }) => getIngestionStatus(signal),
    ...options,
  });
}

/**
 * Mutation hook to trigger on-demand NASA FIRMS polling job.
 */
export function useTriggerFirms() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (asyncMode?: boolean) => triggerFirmsIngestion(asyncMode ?? true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingestion.status() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hotspots.all });
    },
  });
}

/**
 * Mutation hook to trigger on-demand OpenStreetMap sync job.
 */
export function useTriggerOsm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (asyncMode?: boolean) => triggerOsmSync(asyncMode ?? true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingestion.status() });
      queryClient.invalidateQueries({ queryKey: queryKeys.facilities.all });
    },
  });
}

export const useTriggerFirmsIngestion = useTriggerFirms;
export const useTriggerOsmSync = useTriggerOsm;


