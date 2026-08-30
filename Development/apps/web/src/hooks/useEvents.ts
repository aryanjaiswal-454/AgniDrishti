import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { getEvents, getEventById, submitEventFeedback, EventDetail } from "../api/events";
import { ClassifiedEvent, EventFilterParams, Feedback, PaginatedResponse, ApiResponse } from "../api/types";
import { queryKeys } from "../query/queryKeys";

/**
 * Hook to query AI-classified thermal events with class, facility, and confidence filters.
 */
export function useEvents(
  params?: EventFilterParams,
  options?: Omit<UseQueryOptions<PaginatedResponse<EventDetail>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: ({ signal }) => getEvents(params, signal),
    ...options,
  });
}

/**
 * Hook to query full details and relationships for a classified event.
 */
export function useEvent(
  id?: string,
  options?: Omit<UseQueryOptions<ApiResponse<EventDetail>, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: queryKeys.events.detail(id || ""),
    queryFn: ({ signal }) => getEventById(id!, signal),
    enabled: Boolean(id),
    ...options,
  });
}

/**
 * Hook to submit analyst ground-truth feedback / corrections with cache invalidation.
 */
export function useSubmitFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: { corrected_label: string; notes?: string } }) =>
      submitEventFeedback(eventId, data),
    onSuccess: (_result, variables) => {
      // Invalidate specific event detail cache and the broader event list cache
      queryClient.invalidateQueries({ queryKey: queryKeys.events.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.lists() });
    },
  });
}

