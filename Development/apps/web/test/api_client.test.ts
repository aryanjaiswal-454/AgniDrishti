import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiClientError, buildQueryString } from "../src/api/client";

describe("Base HTTP Client & ApiClientError", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should serialize query parameters correctly, omitting undefined and null", () => {
    const params = {
      facility_type: "refinery",
      limit: 50,
      offset: 0,
      emptyStr: "",
      nullVal: null,
      undefVal: undefined,
      bbox: "68.1,8.0,97.4,37.1",
    };

    const qs = buildQueryString(params);
    expect(qs).toContain("facility_type=refinery");
    expect(qs).toContain("limit=50");
    expect(qs).toContain("offset=0");
    expect(qs).toContain("bbox=68.1%2C8.0%2C97.4%2C37.1");
    expect(qs).not.toContain("emptyStr");
    expect(qs).not.toContain("nullVal");
    expect(qs).not.toContain("undefVal");
  });

  it("should perform successful GET request with credentials: 'include'", async () => {
    const mockData = { success: true, data: [{ id: "f1", name: "Jamnagar Refinery" }] };
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => mockData,
    });

    const result = await apiClient<typeof mockData>("/facilities", {
      params: { limit: 10 },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/facilities?limit=10"),
      expect.objectContaining({
        credentials: "include",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Accept: "application/json",
        }),
      })
    );
    expect(result).toEqual(mockData);
  });

  it("should parse 400 validation error into ApiClientError with details", async () => {
    const errorResponse = {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: [{ field: "primary_class", message: "Invalid enum value" }],
      },
    };

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => errorResponse,
    });

    try {
      await apiClient("/events?primary_class=invalid");
      expect.unreachable();
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiClientError);
      expect(err.status).toBe(400);
      expect(err.code).toBe("VALIDATION_ERROR");
      expect(err.userFriendlyMessage).toContain("primary_class: Invalid enum value");
    }
  });

  it("should parse 401 unauthorized into friendly ApiClientError message", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ success: false, error: { message: "Token missing" } }),
    });

    try {
      await apiClient("/facilities");
      expect.unreachable();
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiClientError);
      expect(err.status).toBe(401);
      expect(err.userFriendlyMessage).toBe("Authentication required. Please sign in to continue.");
    }
  });

  it("should convert network errors into ApiClientError without leaking internals", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"));

    try {
      await apiClient("/dashboard/summary");
      expect.unreachable();
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiClientError);
      expect(err.code).toBe("NETWORK_ERROR");
      expect(err.userFriendlyMessage).toContain("Unable to communicate with the AgniDrishti API service");
    }
  });
});
