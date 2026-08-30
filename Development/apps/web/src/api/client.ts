/**
 * AgniDrishti Typed API Error Representation
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: any[];
  public readonly requestId?: string;

  constructor(status: number, code: string, message: string, details?: any[], requestId?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }

  /**
   * User-friendly sanitized error message without server stack traces.
   */
  public get userFriendlyMessage(): string {
    switch (this.status) {
      case 400:
        if (this.details && this.details.length > 0) {
          const firstDetail = this.details[0];
          return `${firstDetail.field ? `${firstDetail.field}: ` : ""}${firstDetail.message || "Invalid input parameters."}`;
        }
        return this.message || "Invalid request parameters.";
      case 401:
        return "Authentication required. Please sign in to continue.";
      case 403:
        return "Access denied. Your account lacks permissions for this action.";
      case 404:
        return this.message || "The requested resource could not be found.";
      case 429:
        return "Rate limit exceeded. Please slow down and try again shortly.";
      case 500:
      case 502:
      case 503:
      case 504:
        return "AgniDrishti server is temporarily unavailable. Please try again later.";
      default:
        return this.message || "An unexpected error occurred.";
    }
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  timeoutMs?: number;
}

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || import.meta.env?.VITE_API_URL || "") + "/api/v1";

/**
 * Serialize an object of query parameters into a URL query string, omitting undefined and null.
 */
export function buildQueryString(params?: Record<string, any>): string {
  if (!params) return "";
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        value.forEach((val) => query.append(key, String(val)));
      } else {
        query.append(key, String(value));
      }
    }
  }

  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

/**
 * Base typed HTTP client using window.fetch with credentials: "include".
 */
export async function apiClient<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, timeoutMs = 30000, signal, headers, ...customConfig } = options;

  const queryString = buildQueryString(params);
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}${queryString}`;

  // Build abort controller for timeout handling
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Link external signal if provided
  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }

  const defaultHeaders: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    const response = await fetch(url, {
      ...customConfig,
      headers: {
        ...defaultHeaders,
        ...headers,
      },
      credentials: "include", // Send and receive secure httpOnly cookies
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    // Check content-type before JSON parsing
    const contentType = response.headers.get("content-type");
    let responseData: any;

    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = { success: response.ok, message: text };
    }

    if (!response.ok) {
      const errorPayload = responseData?.error || {};
      throw new ApiClientError(
        response.status,
        errorPayload.code || `HTTP_${response.status}`,
        errorPayload.message || responseData?.message || response.statusText,
        errorPayload.details,
        response.headers.get("x-request-id") || undefined
      );
    }

    // Unwrap { success: true, data: T } if following canonical envelope
    if (responseData && typeof responseData === "object" && "data" in responseData) {
      return responseData as T;
    }

    return responseData as T;
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error instanceof ApiClientError) {
      throw error;
    }

    if (error.name === "AbortError") {
      throw new ApiClientError(499, "CLIENT_CLOSED_REQUEST", "Request was cancelled or timed out.");
    }

    throw new ApiClientError(
      0,
      "NETWORK_ERROR",
      "Unable to communicate with the AgniDrishti API service. Please verify network connectivity."
    );
  }
}

