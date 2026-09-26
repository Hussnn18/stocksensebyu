# StockSense REST API

Base URL: `http://localhost:5001/api` (frontend: `VITE_API_URL`).

## Conventions

- Every route except `/auth/*` and `/health` needs `Authorization: Bearer <token>` (from `POST /auth/login`).
- Success: `{ "success": true, "data": <payload> }` (auth routes keep their own fields: `token`, `user`, …).
- Error: `{ "success": false, "message": "Readable sentence.", "fields": { "sku": "…" } }`
  - `400` invalid input (`fields` names the bad inputs) · `401` not logged in · `403` wrong role ·
    `404` not found · `409` conflict (duplicate SKU/name, not enough stock, wrong status).
- Columns are **snake_case**, named like the tables/views in `database/schema.sql`.
- Dates: `DATE` → `"YYYY-MM-DD"`, `DATETIME/TIMESTAMP` → `"YYYY-MM-DDTHH:MM:SS"` (server local time, no `Z`).
  Format them in SQL with `DATE_FORMAT` so mysql2 doesn't turn them into JS `Date`s.
- Quantities are numbers (`decimalNumbers: true` on the pool).
- **Manager only** (`requireRole('manager')`): writes to products, categories, reorder rules, warehouses, locations.
  Operations and adjustments are open to managers and staff.

## Dashboard

| Method & path | Returns (`data`) |
|---|---|
| `GET /dashboard/kpis` | `{ total_products, products_in_stock, low_stock, out_of_stock, pending_receipts, pending_deliveries, transfers_scheduled }` — pending = status draft/waiting/ready |
| `GET /dashboard/calendar?month=YYYY-MM` | `[{ date: "YYYY-MM-DD", scheduled, done }]` only days with activity. `scheduled` = non-canceled operations with that `scheduled_date`; `done` = operations validated that day |

## Operations (receipts, deliveries, internal transfers, adjustments)

**Operation row** (list):
```
{ id, reference, type, status, partner_name,
  source_location_id, source_location, dest_location_id, dest_location,
  warehouse_id, warehouse,            // warehouse of the internal side (source first), short_code
  scheduled_date, validated_at, picked_at, packed_at,
  line_count, category_ids: [..], products: ["Steel Rods 12mm", ..] }
```

| Method & path | Notes |
|---|---|
| `GET /operations?type=&status=&warehouse_id=&location_id=&category_id=&search=&date=` | `status` also accepts `open` (draft+waiting+ready). `location_id` matches source or dest. `category_id` matches any line's product. `search` matches reference, partner, product name/SKU. `date=YYYY-MM-DD` matches `scheduled_date` **or** the day of `validated_at`. Sorted `scheduled_date DESC, id DESC`. |
| `GET /operations/:id` | Row + `notes, created_at, created_by_name, validated_by_name, lines: [{ id, product_id, sku, name, uom, quantity, counted_qty, available }]`. `available` = current quantity at the source location when the source is internal, else `null`. |
| `POST /operations` | Body `{ type, partner_name, source_location_id, dest_location_id, scheduled_date, notes, lines: [{ product_id, quantity }] }`. Creates status `draft`. Rules: receipt = vendor → internal, delivery = internal → customer, internal = internal → a different internal. At least one line, quantity > 0, duplicate products merged. Reference from `operation_sequences` locked `FOR UPDATE`: `WH/IN/0006`, `WH/OUT/…`, `WH/INT/…`, `WH/ADJ/…`. Returns the detail. |
| `PUT /operations/:id` | Same body. Only while `draft`. Replaces the lines. |
| `POST /operations/:id/confirm` | `draft` → receipts: `ready`; delivery/internal: `ready` if every line fits the stock at the source, else `waiting`. |
| `POST /operations/:id/check` | Re-run the availability check for `waiting`/`ready` delivery/internal. |
| `POST /operations/:id/pick` | Delivery in `ready` → sets `picked_at`. |
| `POST /operations/:id/pack` | Delivery with `picked_at` → sets `packed_at`. |
| `POST /operations/:id/validate` | Allowed from draft/waiting/ready; deliveries must be packed. **One transaction**: lock the source quants `FOR UPDATE`; if the source is internal and a line needs more than is there → `409 "Only 18 kg of Steel Sheet 2mm at WH/Stock."` and roll back; otherwise decrement source quant, upsert/increment dest quant (internal only), insert one `stock_moves` row per line (reference, operation_id, user_id), set `status='done', validated_by, validated_at=NOW()`. Returns the detail. |
| `POST /operations/:id/cancel` | Any status except done/canceled → `canceled`. Stock untouched. |
| `POST /adjustments` | Body `{ location_id, product_id, counted_qty, reason }`. One transaction: read the recorded quant `FOR UPDATE`; `400` if counted = recorded; create an `adjustment` operation (line `quantity` = recorded, `counted_qty` = counted; source/dest = location → Inventory Loss when stock drops, Inventory Loss → location when it rises), set the quant to counted, insert the move, mark done. Returns the detail. |

`validate`/`confirm`/`pick`/`pack`/`cancel` on a document in the wrong status → `409`.

## Products, categories, reorder rules, alerts

**Stock row** (`v_product_stock` + extras):
```
{ product_id, sku, name, category_id, category, uom, on_hand, min_qty, max_qty,
  stock_state: "ok"|"low"|"out", created_at,
  locations: [{ location_id, location, quantity }] }   // quantity > 0, largest first
```

| Method & path | Notes |
|---|---|
| `GET /products?search=&category_id=&stock_state=` | `category_id=none` = uncategorized; `stock_state=alert` = low or out. Sorted by name. |
| `GET /products/:id` | Stock row, `locations[]` also has `warehouse` (name), plus `suggested_qty` (see alerts). |
| `POST /products` | `{ name, sku, category_id, uom, initial_qty?, location_id?, min_qty?, max_qty? }`. SKU upper-cased, unique (`409` + `fields.sku`). Initial stock > 0 needs an internal `location_id`; in one transaction insert the quant and a `stock_moves` row `reference='INITIAL'` from the Inventory Loss location. A min creates the reorder rule (`location_id NULL`). |
| `PUT /products/:id` | Same minus initial stock. Empty `min_qty` removes the rule. |
| `GET /categories` | `[{ id, name, product_count }]` by name. |
| `POST /categories` · `PUT /categories/:id` | `{ name }`, unique (case-insensitive) → `409`. |
| `DELETE /categories/:id` | Products become uncategorized (FK `ON DELETE SET NULL`). |
| `GET /reorder-rules` | Every product as a stock row + `suggested_qty`; out first, then low, then ok. |
| `PUT /reorder-rules/:productId` | `{ min_qty, max_qty }`; empty min deletes the rule; max ≥ min. |
| `GET /alerts/low-stock` | Stock rows with state low/out + `suggested_qty`, out first then lowest `on_hand/min_qty`. `suggested_qty` = `max(0, (max_qty ?? min_qty*2) − on_hand)`, `0` when ok, `null` when out with no rule. |

## Move history (stock ledger)

| Method & path | Notes |
|---|---|
| `GET /moves?search=&type=&location_id=&product_id=&from=&to=` | Rows of `v_move_history` plus `operation_id, product_id, from_location_id, to_location_id`; `operation_type` is `"initial"` when `operation_id` is NULL. `type` filters `operation_type`. `from`/`to` are inclusive dates. `search` matches reference, SKU, product. Sorted `moved_at DESC, id DESC`. |

## Warehouses, locations, profile

| Method & path | Notes |
|---|---|
| `GET /warehouses` | `[{ id, name, short_code, address, locations: [{ id, name, type, is_active, product_count }] }]` |
| `POST /warehouses` · `PUT /warehouses/:id` | `{ name, short_code, address }`, code unique → `409`. |
| `GET /locations?type=` | Active locations; `type` = internal/vendor/customer/adjustment. |
| `POST /locations` | `{ warehouse_id, name }` → internal location, name unique. |
| `PUT /locations/:id` | `{ name?, is_active? }`; can't deactivate a location that holds stock (`409`). |
| `PUT /auth/me` | `{ name }` → `{ success, user }` (auth response shape). |
