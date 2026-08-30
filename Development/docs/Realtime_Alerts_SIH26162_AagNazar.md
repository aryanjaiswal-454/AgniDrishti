# AgniDrishti Real-Time Alert Event Contract (D6.3)

**Product:** AgniDrishti — AI-Powered Thermal Intelligence  
**Protocol:** WebSocket via Socket.io v4  
**Base URL:** `ws://localhost:3001` (or configured API host)

---

## 1. Authentication & Connection

Socket.io connections require authentication. Unauthorized clients are rejected during the connection handshake.

### Supported Handshake Auth Methods

1. **httpOnly Cookie (Web Client Default)**:
   - Cookie Name: `aagnazar_token`
   - Set automatically upon logging in to `/api/v1/auth/login`.
   - Browser sends this cookie automatically during the WebSocket handshake when `withCredentials: true` is configured.

2. **Handshake `auth` Object**:
   ```javascript
   const socket = io("http://localhost:3001", {
     auth: {
       token: "<jwt-token>"
     }
   });
   ```

3. **Handshake `Authorization` Header**:
   ```javascript
   const socket = io("http://localhost:3001", {
     extraHeaders: {
       Authorization: "Bearer <jwt-token>"
     }
   });
   ```

---

## 2. Event Contract: `agni:alert:created`

### Trigger Rules
- **Condition**: Emitted **only** when a new alert with severity `high` is committed to PostgreSQL.
- **Suppressed**: Low and medium severity alerts are stored in the database but **not** broadcast via WebSocket (reducing client noise).
- **Idempotency**: Repeated worker attempts or duplicate event calls with the same alert ID will not produce duplicate notifications.

### Event Payload Schema

```typescript
export interface AlertCreatedPayload {
  /** Unique UUID of the created alert */
  id: string;

  /** Foreign key to the classified thermal event */
  classified_event_id: string;

  /** Threat severity: 'high' */
  severity: "high";

  /** Alert lifecycle status: 'new' */
  status: "new" | "acknowledged" | "resolved" | "false_positive";

  /** ISO-8601 creation timestamp */
  sent_at: string;

  /** User UUID if acknowledged (null for new) */
  acknowledged_by?: string | null;

  /** Enriched spatial context of the thermal anomaly */
  event?: {
    id?: string;
    primary_class?: "industrial" | "natural";
    sub_class?: string;
    confidence_score?: number;
    is_anomalous?: boolean;
    facility_name?: string | null;
    latitude?: number;
    longitude?: number;
    frp?: number;
  };
}
```

### Example Payload

```json
{
  "id": "a0000000-0000-0000-0000-000000000001",
  "classified_event_id": "e0000000-0000-0000-0000-000000000001",
  "severity": "high",
  "status": "new",
  "sent_at": "2026-08-29T15:10:00.000Z",
  "acknowledged_by": null,
  "event": {
    "id": "e0000000-0000-0000-0000-000000000001",
    "primary_class": "industrial",
    "sub_class": "industrial_fire",
    "confidence_score": 0.96,
    "is_anomalous": true,
    "facility_name": "Bokaro Steel Plant",
    "latitude": 23.6712,
    "longitude": 86.1534,
    "frp": 185.0
  }
}
```

---

## 3. Client Reception Example (Frontend preview for D6.4)

```typescript
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  withCredentials: true,
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("Connected to AgniDrishti Real-Time Alert Stream:", socket.id);
});

socket.on("agni:alert:created", (alert: AlertCreatedPayload) => {
  console.warn("🚨 High Severity Alert Received:", alert);
  // D6.4: Invalidate TanStack query cache and trigger toast
});
```
