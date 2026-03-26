# CloudPRNT Integration Guide

## Overview

The **Star mC-Print3** uses **CloudPRNT** — a printer-initiated polling protocol developed by Star Micronics. Unlike traditional printing (where software pushes jobs to a printer), with CloudPRNT the **printer itself reaches out to your server** every 2–3 seconds asking _"Do you have a job for me?"_

Key advantages:
- **Zero local software** — no print driver, no middleware, no local server needed
- **Works through firewalls** — outbound HTTPS only from the printer
- **Survives network interruptions** — jobs stay in the database until delivered
- **Multi-location ready** — each printer has a unique device token; the server routes jobs accordingly

---

## Hardware Setup

Each restaurant typically needs **two printers**: one for the kitchen (food items) and one for the bar (drinks).

### Step 1 — Connect the printer

1. Connect the Star mC-Print3 to your restaurant's network via **Ethernet** (recommended) or Wi-Fi
2. Power on the printer; it will print a status sheet showing its **IP address**
3. Open a browser and navigate to `http://<printer-ip>` to access the printer's web admin

### Step 2 — Configure CloudPRNT in the web admin

1. Go to **CloudPRNT** settings
2. Set **Server URL** to:
   ```
   https://api.yourdomain.com/api/print/cloudprnt
   ```
3. Set **Device Token** to the kitchen or bar token (obtained from the Owner Dashboard — see below)
4. Enable CloudPRNT and **Save**

The printer will immediately begin polling the server.

---

## Device Token Registration

Before configuring the printer hardware, the restaurant owner registers both tokens in the **Owner Dashboard**:

1. Log in to the Owner Dashboard
2. Navigate to **Settings → Devices**
3. Enter or generate a `kitchen_device_token` and a `bar_device_token`
4. Save — these tokens are stored in the `Restaurant` record in the database

The same tokens are then entered into the respective printer web admin panels.

---

## End-to-End Protocol Flow

```
Printer                          Backend API                         Database
  |                                    |                                  |
  |-- POST /api/print/cloudprnt ------>|                                  |
  |   { statusCode:200,                |                                  |
  |     jobToken: null }               |-- SELECT * FROM print_jobs ----->|
  |                                    |   WHERE device_token = ?         |
  |                                    |   AND status = 'pending' LIMIT 1 |
  |                                    |<-- (no rows) --------------------|
  |<-- { jobReady: false } ------------|                                  |
  |                                    |                                  |
  |  (waits 2–3 seconds)               |                                  |
  |                                    |                                  |
  |-- POST /api/print/cloudprnt ------>|                                  |
  |   { statusCode:200,                |                                  |
  |     jobToken: null }               |-- SELECT * FROM print_jobs ----->|
  |                                    |   WHERE device_token = ?         |
  |                                    |   AND status = 'pending' LIMIT 1 |
  |                                    |<-- (1 row: job uuid-1234) -------|
  |<-- { jobReady: true,               |                                  |
  |      mediaTypes: [                 |                                  |
  |        "application/vnd.star.      |                                  |
  |         starprnt"],                |                                  |
  |      jobToken: "uuid-1234" } ------|                                  |
  |                                    |                                  |
  |-- GET /api/print/job/uuid-1234 --->|                                  |
  |                                    |-- SELECT payload_base64 -------->|
  |                                    |   FROM print_jobs WHERE id=uuid  |
  |                                    |<-- (base64 ESC/POS payload) -----|
  |<-- (binary ESC/POS data) ----------|                                  |
  |                                    |                                  |
  |  (prints the ticket)               |                                  |
  |                                    |                                  |
  |-- POST /api/print/delete/uuid-1234>|                                  |
  |                                    |-- UPDATE print_jobs ------------>|
  |                                    |   SET status = 'completed',      |
  |                                    |   completed_at = NOW()           |
  |                                    |   WHERE id = uuid-1234           |
  |<-- 200 OK --------------------------|                                  |
```

### Step-by-step breakdown

| Step | Actor | Action |
|------|-------|--------|
| 1 | Printer | POSTs to `/api/print/cloudprnt` with `{ statusCode: 200, jobToken: null }` |
| 2 | Backend | Queries `print_jobs` for a `pending` job matching the printer's device token |
| 3a | Backend | If **no job**: returns `{ jobReady: false }` — printer waits and polls again |
| 3b | Backend | If **job exists**: returns `{ jobReady: true, mediaTypes: [...], jobToken: "uuid" }` |
| 4 | Printer | GETs `/api/print/job/{jobToken}` to download the print payload |
| 5 | Backend | Returns the Base64-decoded ESC/POS binary for that job |
| 6 | Printer | Prints the receipt/ticket |
| 7 | Printer | POSTs to `/api/print/delete/{jobToken}` to confirm delivery |
| 8 | Backend | Marks the job as `status = 'completed'` in the database |

---

## Backend API Endpoints

### `POST /api/print/cloudprnt`
The polling endpoint. Called by the printer every 2–3 seconds.

**Request body (from printer):**
```json
{
  "statusCode": 200,
  "jobToken": null,
  "clientAction": []
}
```

**Response when no job:**
```json
{ "jobReady": false }
```

**Response when job available:**
```json
{
  "jobReady": true,
  "mediaTypes": ["application/vnd.star.starprnt"],
  "jobToken": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```

---

### `GET /api/print/job/{jobToken}`
Returns the actual print data for a given job token.

- **Content-Type**: `application/vnd.star.starprnt`
- **Body**: Binary ESC/POS data (decoded from the `payload_base64` column)

---

### `DELETE /api/print/delete/{jobToken}`
Confirms that the printer has successfully printed the job. Backend sets `status = 'completed'`.

---

## Database Schema — `print_jobs`

```sql
CREATE TABLE print_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id   UUID NOT NULL REFERENCES restaurants(id),
  device_token    VARCHAR(255) NOT NULL,
  order_id        UUID REFERENCES orders(id),
  payload_base64  TEXT NOT NULL,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',
                  -- values: 'pending' | 'completed' | 'failed'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX idx_print_jobs_device_token_status
  ON print_jobs (device_token, status);
```

> **Routing logic**: When a new order is placed, the backend generates two print jobs — one with `device_token = kitchen_device_token` (food items only) and one with `device_token = bar_device_token` (drink items only). Each printer only sees its own jobs.

---

## Ticket Content

### Kitchen Ticket
```
==========================
  TABLE 5    ORDER #1042
==========================
2x Margherita Pizza
   - Extra cheese
1x Caesar Salad
   - No croutons
--------------------------
Note: Allergy - nuts
==========================
  12:34  26/03/2026
==========================
```

### Bar Ticket
```
==========================
  TABLE 5    ORDER #1042
==========================
2x Bia Saigon
1x Coca-Cola (no ice)
1x Fresh Lime Juice
==========================
  12:34  26/03/2026
==========================
```

---

## Error Handling & Retry Logic

| Scenario | Behaviour |
|----------|-----------|
| Printer offline | Jobs remain `pending` in DB — delivered when printer comes back online |
| No delivery confirmation within **30 seconds** | Job is re-queued (status reset to `pending`) |
| Backend returns `500` | Printer retries on next poll cycle |
| Print job malformed | Set status to `failed`; alert via logging; does **not** retry automatically |
| Power cut during print | Duplicate protection: check `completed_at` before re-delivering |

---

## Network Requirements

| Requirement | Detail |
|-------------|--------|
| Direction | Outbound HTTPS only (port 443) from printer to server |
| Static IP | **Not required** for the printer |
| Local server | **Not required** — no middleware, no app on the same network |
| Connectivity | WiFi or Ethernet; Ethernet recommended for reliability |

---

## Troubleshooting

**Printer is polling but no jobs appear**
- Verify the `device_token` in the printer web admin matches exactly what's stored in the `Restaurant` record
- Check the `print_jobs` table — are there rows with `status = 'pending'` for this device token?

**Jobs stay `pending` forever**
- Check `GET /api/print/job/{jobToken}` returns valid binary data (not empty)
- Confirm the printer's `Content-Type` acceptance matches `application/vnd.star.starprnt`

**Duplicate tickets printed**
- Ensure `POST /api/print/delete/{jobToken}` is idempotent — marking an already-`completed` job should return `200` without error
