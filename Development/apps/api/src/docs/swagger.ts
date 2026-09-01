import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Router } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "AgniDrishti REST API",
      version: "1.0.0",
      description:
        "AI-Powered Thermal Intelligence platform for detection and classification of industrial fires and persistent thermal sources .",
      contact: {
        name: "AgniDrishti Development Team",
      },
    },
    servers: [
      {
        url: "/api/v1",
        description: "API v1 Endpoint",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "agnidrishti_token",
          description: "httpOnly session cookie containing signed JWT",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string", example: "VALIDATION_ERROR" },
                message: { type: "string", example: "Validation failed" },
                details: { type: "object" },
              },
            },
            timestamp: { type: "string", example: "2026-08-28T12:00:00.000Z" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["admin", "analyst", "viewer"] },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Facility: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            osm_id: { type: "string" },
            name: { type: "string", nullable: true },
            facility_type: {
              type: "string",
              enum: [
                "refinery",
                "petrochemical",
                "power_plant",
                "steel",
                "mining",
                "lng_terminal",
                "other_industrial",
              ],
            },
            geometry: { type: "object" },
            state: { type: "string", nullable: true },
            district: { type: "string", nullable: true },
          },
        },
        Hotspot: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            latitude: { type: "number" },
            longitude: { type: "number" },
            acq_date: { type: "string", format: "date" },
            acq_time: { type: "string" },
            satellite: { type: "string" },
            instrument: { type: "string", enum: ["MODIS", "VIIRS"] },
            confidence: { type: "string" },
            frp: { type: "number", nullable: true },
            bright_ti4: { type: "number", nullable: true },
            daynight: { type: "string", enum: ["D", "N"] },
          },
        },
        ClassifiedEvent: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            hotspot_id: { type: "string", format: "uuid" },
            facility_id: { type: "string", format: "uuid", nullable: true },
            primary_class: { type: "string", enum: ["industrial", "natural"] },
            sub_class: {
              type: "string",
              enum: [
                "industrial_fire",
                "gas_flare",
                "agricultural_burning",
                "mining_activity",
                "forest_fire",
                "other_natural",
                "unclassified",
              ],
            },
            confidence_score: { type: "number" },
            is_anomalous: { type: "boolean" },
            model_version: { type: "string" },
            created_at: { type: "string", format: "date-time" },
          },
        },
        Alert: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            classified_event_id: { type: "string", format: "uuid" },
            severity: { type: "string", enum: ["high", "medium", "low"] },
            status: {
              type: "string",
              enum: ["new", "acknowledged", "resolved", "false_positive"],
            },
            sent_at: { type: "string", format: "date-time" },
            acknowledged_by: { type: "string", format: "uuid", nullable: true },
          },
        },
      },
    },
    paths: {
      "/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Authenticate user and set secure httpOnly cookie",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email", example: "analyst@agnidrishti.local" },
                    password: { type: "string", example: "AnalystPassword123!" },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Authentication successful" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/auth/logout": {
        post: {
          tags: ["Authentication"],
          summary: "Clear session cookie and log out",
          responses: {
            200: { description: "Successfully logged out" },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Authentication"],
          summary: "Get current user profile",
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          responses: {
            200: { description: "Current user profile" },
            401: { description: "Unauthorized" },
          },
        },
      },
      "/facilities": {
        get: {
          tags: ["Facilities"],
          summary: "List industrial facilities with optional bbox/type filters",
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: "facility_type", in: "query", schema: { type: "string" } },
            { name: "state", in: "query", schema: { type: "string" } },
            { name: "bbox", in: "query", schema: { type: "string" }, description: "minLon,minLat,maxLon,maxLat" },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
            { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          ],
          responses: {
            200: { description: "List of matching facilities" },
          },
        },
      },
      "/facilities/{id}": {
        get: {
          tags: ["Facilities"],
          summary: "Get facility details and baseline metrics",
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: { description: "Facility details with baseline" },
            404: { description: "Facility not found" },
          },
        },
      },
      "/facilities/{id}/timeseries": {
        get: {
          tags: ["Facilities"],
          summary: "Get historical thermal activity aggregated for Recharts",
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: { description: "Timeseries points" },
          },
        },
      },
      "/hotspots": {
        get: {
          tags: ["Hotspots"],
          summary: "List raw NASA FIRMS detections",
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
            { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
            { name: "instrument", in: "query", schema: { type: "string", enum: ["MODIS", "VIIRS"] } },
            { name: "bbox", in: "query", schema: { type: "string" } },
          ],
          responses: {
            200: { description: "List of raw FIRMS hotspots" },
          },
        },
      },
      "/events": {
        get: {
          tags: ["Events"],
          summary: "List AI-classified thermal events",
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: "primary_class", in: "query", schema: { type: "string", enum: ["industrial", "natural"] } },
            { name: "sub_class", in: "query", schema: { type: "string" } },
            { name: "is_anomalous", in: "query", schema: { type: "boolean" } },
            { name: "min_confidence", in: "query", schema: { type: "number" } },
          ],
          responses: {
            200: { description: "List of classified events" },
          },
        },
      },
      "/events/{id}": {
        get: {
          tags: ["Events"],
          summary: "Get classified event detail with facility and hotspot data",
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          responses: {
            200: { description: "Classified event details" },
            404: { description: "Event not found" },
          },
        },
      },
      "/events/{id}/feedback": {
        post: {
          tags: ["Feedback"],
          summary: "Submit analyst feedback correction on model output (analyst/admin only)",
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["corrected_label"],
                  properties: {
                    corrected_label: { type: "string", example: "industrial_fire" },
                    notes: { type: "string", example: "Visual inspection confirms smoke plume." },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Feedback recorded" },
            403: { description: "Forbidden" },
          },
        },
      },
      "/alerts": {
        get: {
          tags: ["Alerts"],
          summary: "List real-time alerts",
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: "severity", in: "query", schema: { type: "string", enum: ["high", "medium", "low"] } },
            { name: "status", in: "query", schema: { type: "string", enum: ["new", "acknowledged", "resolved", "false_positive"] } },
          ],
          responses: {
            200: { description: "List of alerts" },
          },
        },
      },
      "/alerts/{id}": {
        patch: {
          tags: ["Alerts"],
          summary: "Update alert status (acknowledge, resolve, false_positive) (analyst/admin only)",
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["status"],
                  properties: {
                    status: { type: "string", enum: ["acknowledged", "resolved", "false_positive"] },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: "Alert updated" },
            403: { description: "Forbidden" },
          },
        },
      },
      "/dashboard/summary": {
        get: {
          tags: ["Dashboard"],
          summary: "Get aggregated command center metrics",
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          responses: {
            200: { description: "Command center summary statistics" },
          },
        },
      },
      "/export": {
        get: {
          tags: ["Export"],
          summary: "Export classified events as CSV or JSON file",
          security: [{ cookieAuth: [] }, { bearerAuth: [] }],
          parameters: [
            { name: "format", in: "query", schema: { type: "string", enum: ["json", "csv"], default: "json" } },
            { name: "primary_class", in: "query", schema: { type: "string" } },
            { name: "startDate", in: "query", schema: { type: "string", format: "date" } },
            { name: "endDate", in: "query", schema: { type: "string", format: "date" } },
          ],
          responses: {
            200: { description: "Export file download" },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);

const swaggerRouter = Router();
swaggerRouter.use("/", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default swaggerRouter;

