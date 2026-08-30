import { apiClient } from "./client";
import {
  ClassifiedEvent,
  EventFilterParams,
  Feedback,
  Hotspot,
  Facility,
  PaginatedResponse,
  ApiResponse,
} from "./types";

export type EventDetail = ClassifiedEvent & {
  hotspot?: Hotspot;
  facility?: Facility | null;
  feedback_history?: Feedback[];
};

/**
 * List AI-classified thermal events with filtering by class, facility, confidence, dates, or bbox.
 */
export async function getEvents(
  params?: EventFilterParams,
  signal?: AbortSignal
): Promise<PaginatedResponse<EventDetail>> {
  return apiClient<PaginatedResponse<EventDetail>>("/events", {
    method: "GET",
    params,
    signal,
  });
}

/**
 * Fetch detailed classified event with full join relationships and feedback history.
 */
export async function getEventById(
  id: string,
  signal?: AbortSignal
): Promise<ApiResponse<EventDetail>> {
  return apiClient<ApiResponse<EventDetail>>(`/events/${id}`, {
    method: "GET",
    signal,
  });
}

/**
 * Submit analyst ground-truth feedback / label correction on a classified event.
 */
export async function submitEventFeedback(
  id: string,
  data: { corrected_label: string; notes?: string }
): Promise<ApiResponse<Feedback>> {
  return apiClient<ApiResponse<Feedback>>(`/events/${id}/feedback`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

