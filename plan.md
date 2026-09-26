# StockSense – Inventory Management System: Project Plan

## 0. Goal
Build a modular Inventory Management System (IMS) that replaces manual registers and Excel sheets with one central app that updates in real time. Target users are **Inventory Managers** (incoming and outgoing stock) and **Warehouse Staff** (transfers, picking, shelving, counting).

**Constraints from the brief:** use as few third-party APIs as possible, and use **MySQL or PostgreSQL**. We chose **MySQL 8 + MySQL Workbench**.

---

## 1. Tech Stack (with justification)

| Layer | Choice | Why |
|---|---|---|
| Database | **MySQL 8** (designed/managed in **MySQL Workbench**) | The brief requires MySQL or PostgreSQL, and we prefer MySQL. InnoDB gives ACID transactions and row locks, which we need so stock never goes negative or gets counted twice on validate. Workbench can draw ER diagrams for the demo. |
| DB access | **mysql2** (raw parameterized SQL, connection pool) | No ORM hiding the queries, so judges see real SQL. Transactions (`BEGIN … COMMIT`, `SELECT … FOR UPDATE`) are written out in the code. It is one small dependency. |
| Backend | **Node.js + Express** | Lightweight and quick for building REST APIs. The whole stack uses one language (JavaScript). |
| Frontend | **React (Vite) + Tailwind CSS** | Components suit the sidebar, dashboard and forms. Vite starts the dev server instantly. Tailwind means we don't need a heavy UI kit. |
| Charts | Plain Tailwind KPI cards (optional Chart.js later) | Keeps dependencies to a minimum. |
| Icons / routing | lucide-react, React Router v6 | Small and standard, and they don't tie us to a UI kit. |
| Auth | **JWT (jsonwebtoken) + bcrypt**, built by us | No Firebase, Auth0 or Clerk. Everything is in-house. |
| OTP reset | The server generates a 6-digit OTP and stores it hashed in MySQL with a 10-minute expiry. It is sent with **Nodemailer + SMTP** (Gmail app password). In dev, the OTP is printed to the console instead. | SMTP is a protocol, not a paid third-party API. No Twilio or SendGrid. |
| Validation | Hand-written middleware (or `zod`, one small library) | Keeps dependencies to a minimum. |
| Low-stock alerts | Computed in SQL (qty ≤ reorder min), shown as a dashboard badge and an alerts list | No external notification service. |

**Third-party APIs used: none.** We only use npm libraries: express, mysql2, bcrypt, jsonwebtoken, nodemailer, cors, dotenv, react, react-router, tailwind, lucide-react.

---

## 2. Architecture
```
React (Vite) ──REST/JSON + JWT──> Express API ──mysql2 pool──> MySQL 8
                                   routes → controllers → services (transactions) → SQL
```

Folder layout:
```
stocksensebyu/
  client/    React app: pages/, components/, api/, context/AuthContext
  server/    src/routes, controllers, services, middleware, db/pool.js
  database/  schema.sql, seed.sql   ← open & run in MySQL Workbench
  plan.md
```

---

## 3. Core Design Principle: the Stock Ledger
- Every stock change is saved as a row in `stock_moves` (product, from location, to location, qty, reference document, timestamp, user).
- `stock_quants` holds the current balance for each product at each location. It is updated **in the same transaction** as the move.
- Each operation is a move between locations:
  - **Receipt:** Vendor (virtual) → Location, so stock goes up.
  - **Delivery:** Location → Customer (virtual), so stock goes down.
  - **Internal transfer:** Location A → Location B. The total stays the same and only the location changes.
  - **Adjustment:** Location ↔ Inventory-loss (virtual). The difference is counted qty minus recorded qty.
- A document only changes stock when it is **Validated** (status becomes Done). Draft, Waiting and Ready do not move stock.
- The Move History page is a filtered `SELECT` on `stock_moves`.

---

## 4. Database Schema (MySQL)
| Table | Columns |
|---|---|
| `users` | id, name, email UNIQUE, password_hash, role ENUM('manager','staff'), created_at |
| `password_otps` | id, user_id FK, otp_hash, expires_at, used |
| `warehouses` | id, name, short_code, address |
| `locations` | id, warehouse_id FK NULL, name, type ENUM('internal','vendor','customer','adjustment') |
| `categories` | id, name |
| `products` | id, name, sku UNIQUE, category_id FK, uom, created_at |
| `reorder_rules` | id, product_id FK, location_id FK, min_qty, max_qty |
| `stock_quants` | product_id, location_id, quantity — PK(product_id, location_id), CHECK quantity ≥ 0 |
| `operations` | id, reference (e.g. `WH/IN/0001`), type ENUM('receipt','delivery','internal','adjustment'), status ENUM('draft','waiting','ready','done','canceled'), partner_name, source_location_id, dest_location_id, scheduled_date, created_by, validated_at |
| `operation_lines` | id, operation_id FK, product_id FK, quantity, counted_qty NULL |
| `stock_moves` | id, operation_id FK, product_id, from_location_id, to_location_id, quantity, moved_at, user_id — **the ledger** |

Indexes on `sku`, `(type, status)`, `moved_at` and `product_id`, used by the dashboard filters and SKU search.

---

## 5. REST API (summary)
- **Auth:** `POST /auth/signup`, `POST /auth/login`, `POST /auth/forgot-password` (sends OTP), `POST /auth/reset-password` (checks OTP)
- **Dashboard:** `GET /dashboard/kpis`, `GET /dashboard/operations?type=&status=&warehouse=&category=`
- **Products:** CRUD `/products`, `GET /products?search=`, `GET /products/:id/stock` (stock per location), CRUD `/categories`, CRUD `/reorder-rules`
- **Operations:** CRUD `/operations?type=receipt|delivery|internal|adjustment`, `POST /operations/:id/validate`, `POST /operations/:id/cancel`
- **Ledger & alerts:** `GET /moves` (filters), `GET /alerts/low-stock`
- **Settings / profile:** CRUD `/warehouses`, CRUD `/locations`, `GET /me`, `PUT /me`

---

## 6. Frontend Specification

### 6.1 Design system
- **Look and feel:** a clean admin UI that shows a lot of data at once. It is a business tool, not a marketing site. Light theme by default, with a dark mode toggle (Tailwind `dark:` classes).
- **Layout:** a fixed **left sidebar** (logo, navigation, profile menu at the bottom), a top bar (page title, global SKU search, low-stock bell) and a scrollable content area. The sidebar shrinks to icons on tablets and becomes a slide-out drawer on mobile.
- **Colors** (tokens in `tailwind.config.js`): primary indigo `#4F46E5`, slate greys for surfaces and text. Status colors are the same everywhere:
  - Draft = grey, Waiting = amber, Ready = blue, Done = green, Canceled = red
  - Stock: in stock = green, low = amber, out of stock = red
- **Typography:** Inter (Google Fonts). 14px base size in tables, 24–30px for KPI numbers, and tabular numerals for quantities.
- **Icons:** `lucide-react`.
- **Reusable components** (`client/src/components/`): `Sidebar`, `Topbar`, `KpiCard`, `DataTable` (sort, paginate, empty state), `FilterBar`, `StatusBadge`, `StockBadge`, `Modal`, `ConfirmDialog`, `FormField`, `ProductPicker` (search by name or SKU), `LocationSelect`, `Toast`, `Skeleton` loader, `ProtectedRoute`.
- **UX rules:**
  - Every list has search, filters and an empty state.
  - Actions that change stock or can't be undone (Validate, Cancel) ask for confirmation first.
  - Forms show validation errors inline.
  - Success and error messages appear as toasts.
  - Skeletons show while data loads.
  - Buttons depend on status. For example, Validate only appears when a document is Ready.

### 6.2 Pages & features
| Page | Route | Features |
|---|---|---|
| Login / Signup | `/login`, `/signup` | Email and password, role picker on signup, show/hide password, inline errors. Goes to the Dashboard on success. |
| Forgot password | `/forgot-password` | Three steps: enter email → enter the 6-digit OTP (6 boxes, 60-second resend timer) → set a new password. |
| Dashboard | `/` | Five KPI cards: Total Products in Stock, Low/Out of Stock, Pending Receipts, Pending Deliveries, Transfers Scheduled. Clicking a card opens the matching filtered list. A FilterBar (document type, status, warehouse, category), a recent operations table and a low-stock alert panel. |
| Products | `/products` | Table with name, SKU, category, UoM, on-hand qty and stock badge. Search by SKU or name, filter by category. Create and edit in a modal: name, SKU, category, UoM, optional initial stock and location. |
| Product detail | `/products/:id` | Stock at each location, an editor for the reorder rule (min/max), and recent moves for this product. |
| Categories | `/products/categories` | Simple list to add, edit and delete categories. |
| Receipts | `/operations/receipts` | List with status tabs (All, Draft, Waiting, Ready, Done, Canceled). The form has supplier, destination location, scheduled date and product lines (ProductPicker + qty). Flow: Save draft → Mark Ready → **Validate** (stock goes up). References are generated automatically as `WH/IN/0001`. |
| Delivery Orders | `/operations/deliveries` | Same pattern with customer and source location. Each line shows the available qty and warns if there isn't enough. Flow: Pick → Pack → **Validate** (stock goes down). References are `WH/OUT/0001`. |
| Internal Transfers | `/operations/transfers` | Source and destination locations plus product lines. Validate moves the stock between locations. References are `WH/INT/0001`. |
| Inventory Adjustment | `/operations/adjustments` | Choose a location and product to see the recorded qty. Enter the counted qty, see the difference (+/–, colored), then Apply. |
| Move History | `/moves` | Ledger table: date, reference, product, from → to, qty (colored +/–), user. Filter by date range, product, location or type. Export to CSV in the browser. |
| Warehouses & Locations | `/settings/warehouses` | Add, edit and delete warehouses (name, code, address) and their locations (e.g. Rack A, Production Floor). |
| Profile | `/profile` | View and edit name and email, change password. Logout is in the sidebar profile menu. |

### 6.3 Frontend architecture
- **Routing:** React Router v6. A shared `AppLayout` (sidebar + topbar + `<Outlet/>`) wraps the app pages. Auth pages sit outside it. `ProtectedRoute` checks the JWT.
- **State:** `AuthContext` stores the user and token in localStorage. Pages load data through a small `api/client.js` wrapper around `fetch`, which adds the `Authorization` header and logs the user out on a 401. No Redux needed.
- **Filters live in URL query params,** so filtered views (for example, one opened from a KPI card) can be bookmarked and shared.
- **Role-based UI:** staff can create and validate transfers, picks and counts. Managers can also manage products, warehouses and reorder rules.
- **Responsive:** on small screens, tables scroll sideways inside their card and forms stack into one column.

---

## 7. Build Phases
1. **Setup:** folder structure, `schema.sql` + `seed.sql` run in Workbench, Express and Vite skeletons, `.env`.
2. **Auth:** signup, login, JWT middleware, OTP password reset.
3. **Master data:** warehouses, locations, categories, products, reorder rules.
4. **Operations engine:** operations and their lines, plus the transactional `validate` service that writes `stock_moves` and `stock_quants`.
5. **Dashboard & history:** KPI SQL queries, filters, move history, low-stock alerts, SKU search.
6. **Polish:** staff vs manager permissions, error handling, responsive UI, demo seed data (the steel example from the brief).

---

## 8. Verification
- Run `schema.sql` and `seed.sql` in MySQL Workbench and check the EER diagram.
- Replay the flow from the brief:
  1. Receive 100 kg steel → +100
  2. Transfer Main Store → Production Rack → total stays the same
  3. Deliver 20 → –20
  4. Adjust for 3 damaged → –3
  - Expected result: the quants add up to **77**, and the ledger shows **4 moves**.
- Try to deliver more than is on hand. Validate should be rejected and nothing written (the transaction rolls back).
- Test OTP reset end to end (OTP shown in the console in dev). An expired OTP should be rejected.
