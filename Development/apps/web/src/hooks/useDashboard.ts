import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { getDashboardSummary } from "../api/dashboard";
import { DashboardSummary, ApiResponse } from "../api/types";
import { queryKeys } from "../query/queryKeys";

/**
 * Hook to query aggregated command center dashboard metrics.
 */
export function useDashboardSummary(
  options?: Omit<UseQueryOptions<ApiResponse<DashboardSummary>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: ({ signal }) => getDashboardSummary(signal),
    ...options,
  });
}

