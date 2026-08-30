import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getAlerts, getAlertById, updateAlertStatus, AlertWithDetails } from "../api/alerts";
import { Alert, AlertFilterParams, AlertStatus, PaginatedResponse, ApiResponse } from "../api/types";
import { queryKeys } from "../query/queryKeys";

/**
 * Hook to query active or historical threat alerts by severity or status.
 */
export function useAlerts(
  params?: AlertFilterParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<AlertWithDetails>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.alerts.list(params),
    queryFn: ({ signal }) => getAlerts(params, signal),
    ...options,
  });
}

/**
 * Hook to query a single alert by UUID.
 */
export function useAlert(
  id?: string,
  options?: Omit<UseQueryOptions<ApiResponse<AlertWithDetails>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.alerts.detail(id || ""),
    queryFn: ({ signal }) => getAlertById(id!, signal),
    enabled: Boolean(id),
    ...options,
  });
}

/**
 * Mutation hook to update alert lifecycle status with cache invalidation for alerts & dashboard.
 */
export function useUpdateAlertStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AlertStatus }) =>
      updateAlertStatus(id, status),
    onSuccess: (_result, variables) => {
      // Invalidate specific alert, alert lists, and dashboard summary
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.alerts.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary() });
    },
  });
}

