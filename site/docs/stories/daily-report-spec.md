# Daily Sales Report — Detailed Specification

**Epic:** E9 — Owner Dashboard & Reporting  
**Story:** Owner views daily sales report  
**Last Updated:** March 2026

---

## Overview

The restaurant owner needs a daily sales breakdown to reconcile end-of-day revenue. The report shows every menu item sold that day (excluding cancelled orders), grouped and subtotalled, with a grand total at the bottom. The owner can export this as a professionally formatted PDF directly from the dashboard.

**Use cases:**
- End-of-day checkout reconciliation
- Checking sales for a past date
- Passing a printed/emailed PDF to an accountant

---

## PDF Library Recommendation

After evaluating the major C# PDF generation libraries, **QuestPDF** was selected.

| Library | License | .NET 10 | Docker | Notes |
|---------|---------|---------|--------|-------|
| **QuestPDF** | ✅ MIT (free for rev < $1M) | ✅ | ✅ Zero native deps | Fluent C# API; ideal for tables |
| iText 7 | ⚠️ AGPL (SaaS requires commercial licence) | ✅ | ✅ | Legal risk for multi-tenant SaaS |
| PdfPig | ✅ Apache 2.0 | ✅ | ✅ | Primarily a PDF reader; limited layout API |
| Wkhtmltopdf wrapper | ✅ MIT | ✅ | ⚠️ Requires Chromium (~150 MB) | Docker image bloat; security surface |
| RDLC / SSRS | ✅ MIT | ❌ .NET 10 unsupported | ❌ | Effectively unmaintained |

### Why QuestPDF

- **MIT licence** — no legal risk when the product's monthly revenue is under $1 million (covers the entire startup phase; re-evaluate when approaching that threshold)
- **Zero runtime dependencies** — pure .NET DLL; no Chromium, no native libs; Docker image stays lean
- **Fluent table API** — `Table()` with `ColumnsDefinition` → `Cell()` maps directly onto the report layout
- **Active maintenance** — regular releases, full .NET 10 compatibility confirmed

**NuGet package:** `QuestPDF`  
**Docs:** https://www.questpdf.com/quick-start.html

---

## Async Pattern: Sync Streaming (Chosen)

Three approaches were evaluated:

| Option | Description | Verdict |
|--------|-------------|---------|
| **A — Sync streaming** | POST → query DB → build PDF in `MemoryStream` → return `FileContentResult` | ✅ **Chosen** |
| B — Background job (Hangfire) | POST enqueues job → poll/return download URL | ❌ Overkill; adds infra complexity for a ~2-3 s operation |
| C — SignalR push | POST enqueues job → server pushes download URL via hub | 🔄 Future upgrade path if reports grow slow |

**Rationale for Option A:** The query (one DB round-trip with a JOIN and GROUP BY, scoped to a single day) takes ~1 s. QuestPDF renders a small table in < 1 s. Total latency ~2–3 s is acceptable for an owner dashboard action. A loading spinner on the button provides sufficient feedback. Hangfire adds a Redis/SQL dependency, polling complexity, and stored files — none of which are justified here.

---

## API Specification

```
POST /api/restaurants/{restaurantId}/reports/daily/pdf?date=YYYY-MM-DD
```

### Authentication & Authorization

| Concern | Rule |
|---------|------|
| Auth | Bearer JWT required (`Authorization: Bearer <token>`) |
| Role | `owner` claim required |
| Tenant isolation | `restaurantId` in URL **must** match the `restaurant_id` claim in the JWT → `403 Forbidden` if mismatch (OWASP A01 IDOR protection) |

### Query Parameters

| Param | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `date` | `string` | No | Today (UTC) | Format: `YYYY-MM-DD` |

### SQL (pseudo)

```sql
SELECT
    ol.item_name_snapshot   AS item_name,
    ol.unit_price_snapshot  AS unit_price,
    SUM(ol.quantity)        AS qty_ordered,
    SUM(ol.quantity * ol.unit_price_snapshot) AS subtotal
FROM orders o
JOIN order_lines ol ON ol.order_id = o.id
WHERE o.restaurant_id = :restaurantId
  AND o.status <> 'cancelled'
  AND DATE(o.created_at AT TIME ZONE 'UTC') = :date
GROUP BY ol.item_name_snapshot, ol.unit_price_snapshot
ORDER BY qty_ordered DESC;
```

> No schema changes required — `item_name_snapshot`, `unit_price_snapshot`, and `quantity` already exist on `order_lines`.

### Response

| Case | HTTP | Content-Type | Body |
|------|------|--------------|------|
| Has data | 200 | `application/pdf` | PDF binary; `Content-Disposition: attachment; filename="sales-{date}.pdf"` |
| No orders for date | 200 | `application/pdf` | PDF with "No orders recorded for this date" message |
| Tenant mismatch | 403 | `application/json` | `{ "error": "Forbidden" }` |
| Unauthenticated | 401 | `application/json` | Standard 401 |

---

## PDF Content Layout

```
┌────────────────────────────────────────────────────────┐
│  [Restaurant Name]                                      │
│  Daily Sales Report — 2026-03-27                        │
├────────────────┬──────────────┬────────────┬───────────┤
│  Item Name     │  Unit Price  │  Qty Sold  │  Subtotal │
├────────────────┼──────────────┼────────────┼───────────┤
│  Pho Bo        │     €8.50    │     12     │  €102.00  │
│  Spring Rolls  │     €5.00    │      8     │   €40.00  │
│  ...           │              │            │           │
├────────────────┴──────────────┴────────────┼───────────┤
│  Grand Total Estimated Revenue             │  €142.00  │
└────────────────────────────────────────────┴───────────┘

  Generated by ContactlessOrderSystem • {timestamp UTC}
```

**Currency:** Euro (€) — matches existing `unit_price_snapshot` values in the DB  
**Sorting:** Rows sorted by `qty_ordered` descending  
**Filename:** `sales-{date}.pdf` (e.g. `sales-2026-03-27.pdf`)

---

## Frontend UX Specification

**Component:** `src/Frontend/src/pages/owner/DailyReport.vue`

### Layout

```
[ Date Picker (default: today) ]  [ Export PDF 🧾 ]

┌─────────────────────────────────────────────────┐
│  Item Name    │  Unit Price  │  Qty  │  Subtotal │
│  Pho Bo       │  €8.50       │  12   │  €102.00  │
│  ...                                             │
└─────────────────────────────────────────────────┘

  Grand Total Estimated Revenue:  €142.00
```

### Button States

| State | Visual |
|-------|--------|
| Idle | "Export PDF" — enabled |
| Loading | Spinner + "Generating…" — disabled |
| Done | Returns to idle (PDF downloaded by browser) |

### Export Flow

1. User clicks **Export PDF**
2. Button shows loading spinner; disabled
3. `POST /api/restaurants/{id}/reports/daily/pdf?date={date}` fires
4. Browser receives `application/pdf` response → auto-downloads
5. Button returns to idle state

### Empty State

If the table has no rows (API returned empty result set), show:

> *"No orders recorded for {date}. The report will reflect data once orders are placed."*

The **Export PDF** button remains available (PDF will contain the empty-state message).

---

## Security Notes

| Concern | Implementation |
|---------|----------------|
| No file on disk | PDF built entirely in `MemoryStream`; never written to disk; no cleanup needed |
| Tenant isolation | `restaurantId` URL param validated against JWT `restaurant_id` claim; 403 on any mismatch |
| No input injection | `date` parameter parsed as `DateOnly`; invalid format → 400 |
| Auth required | Endpoint decorated with `[Authorize(Roles = "owner")]` |

---

## Implementation Checklist

### Phase 1 — Backend

- [ ] Add `QuestPDF` NuGet package to `src/Api/`
- [ ] Add `QuestPDF.Settings.License = LicenseType.Community;` to `Program.cs`
- [ ] Create `src/Api/Endpoints/ReportEndpoints.cs` with `MapReportEndpoints()` extension
- [ ] Query `orders` JOIN `order_lines` with filters
- [ ] Build QuestPDF document → `MemoryStream`
- [ ] Return `File(stream.ToArray(), "application/pdf", $"sales-{date}.pdf")`
- [ ] Write integration test: authenticated owner gets 200; wrong tenant gets 403

### Phase 2 — Frontend

- [ ] Create `src/Frontend/src/pages/owner/DailyReport.vue`
- [ ] Add route `/owner/reports/daily` to Vue Router
- [ ] Add "Daily Report" link to owner sidebar nav
- [ ] Implement date picker (default today), data table, loading state on export button
