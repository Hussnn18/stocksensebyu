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
| `operations` | id, reference (e.g. `WH/IN/0001`), type ENUM('receipt','delivery','internal','adjustment'), status ENUM('draft','waiting','ready','done','canceled'), partner_name, source_location_id, dest_location_id, scheduled_date, created_by, validated_at, picked_at, packed_at (delivery pick/pack steps) |
| `operation_lines` | id, operation_id FK, product_id FK, quantity, counted_qty NULL |
| `operation_sequences` | type PK, prefix (IN/OUT/INT/ADJ), next_number, locked with `SELECT … FOR UPDATE` to generate references |
| `stock_moves` | id, operation_id FK (NULL for initial stock), reference, product_id, from_location_id, to_location_id, quantity (always > 0), moved_at, user_id — **the ledger** |

Indexes on `sku`, `(type, status)`, `moved_at` and `product_id`, used by the dashboard filters and SKU search.

Views: `v_product_stock` (on-hand + low/out state per product), `v_dashboard_kpis` (the 5 KPIs in one row), `v_move_history` (ledger with names and signed stock effect).

Files: [database/schema.sql](database/schema.sql), [database/seed.sql](database/seed.sql). Setup steps: [database/README.md](database/README.md).

---

## 5. REST API (summary)
Full contract with every path, query parameter and row shape: [docs/api.md](docs/api.md).

- **Auth (built, under `/api`):** `POST /auth/signup`, `POST /auth/login` (returns JWT), `GET /auth/me` (Bearer token), OTP reset: `POST /auth/send-otp` → `POST /auth/verify-otp` (returns a 10-minute reset token) → `POST /auth/reset-password`
  - Responses use `{ "success": true|false, "message": "...", ...data }`. New endpoints should follow the same shape.
  - Protect routes with `requireAuth` (and `requireRole('manager')` where needed) from `backend/middleware/auth.js`.
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

---

## 9. Team Split (3 members) & How We Work Together

### 9.1 Who builds what
We split **by feature, full stack**: each person owns their feature from the SQL query to the screen. That means fewer hand-offs, fewer "waiting for the API" moments, and everyone can demo their own part.

| | **Member A: Foundation, Auth & Settings** | **Member B: Products, Dashboard & Reports** | **Member C: Operations Engine** |
|---|---|---|---|
| In one line | Sets up the project everyone builds on | Everything you **read**: products, stock levels, KPIs, history | Everything that **changes stock** |
| Database | Owns `schema.sql` and `seed.sql`, indexes | Queries for KPIs, low stock, stock per location, ledger | Writes to `operations`, `operation_lines`, `stock_moves`, `stock_quants` |
| Backend | Express skeleton, DB pool, error handler, auth (signup, login, JWT, OTP + Nodemailer), `/me`, warehouses & locations API | `/products`, `/categories`, `/reorder-rules`, `/dashboard/*`, `/alerts/low-stock`, `/moves` | `/operations` CRUD, `validate` (one transaction), `cancel`, reference numbers (`WH/IN/0001`) |
| Frontend | Vite + Tailwind setup, theme tokens, `AppLayout` (sidebar, topbar), routing, `AuthContext`, `api/client.js`, shared components (`DataTable`, `StatusBadge`, `Modal`, `ConfirmDialog`, `Toast`, `FormField`), Login / Signup / OTP pages, Profile, Warehouses page | Dashboard (KPI cards, filters, low-stock panel), Products list / detail / form, Categories, Move History with CSV export | Receipts, Delivery Orders, Internal Transfers, Adjustments: list with status tabs, create form with `ProductPicker`, detail page with status steps and Validate |
| Must test | OTP expiry, protected routes, 401 → logout | KPI numbers match the database, filters work together | The brief's steel flow ends at 77; over-delivery is rejected and rolled back |
| Extra duty | Integration, README, running the final build | Helps C test the ledger | Demo seed flow |

**Why this is balanced:** A's work is front-loaded (setup unblocks everyone), and A's features later on are lighter, so A also handles integration and the README. C has the hardest logic but no setup work. B's work is mostly queries and screens.

If one of you is much stronger on frontend or backend, keep this feature ownership and pair up on the weaker layer. Don't switch to a frontend / backend / database split, because then everyone waits on everyone.

### 9.2 Kickoff together (first 1–2 hours, before splitting)
1. **Pick the theme** from the mockup (`design/dashboard-mockup.html`) and freeze the color tokens.
2. **Freeze the schema:** walk through `schema.sql` together. After this, only A edits it. Others ask in chat, A makes the change, and everyone re-runs it.
3. **Freeze the API contract:** for every endpoint in §5, write one example request and response in `docs/api.md`. Shared rules:
   - Success: `{ "data": ... }`. Error: `{ "error": { "message": "..." } }` with the right HTTP status code.
   - Dates in ISO format. Auth header: `Authorization: Bearer <token>`.
4. **A pushes the skeleton:** `client/`, `server/`, `database/`, `.env.example`, seed data. Everyone clones it, runs schema + seed in Workbench, and sees the app start.

### 9.3 Git workflow
- One GitHub repo. `main` must always run, and nobody pushes to it directly.
- One branch per feature, e.g. `feat/auth`, `feat/products`, `feat/receipts`. Keep branches small and merge them within a few hours.
- Open a pull request. Another member skims it (10 minutes max) and merges.
- Pull `main` into your branch often: `git pull origin main`.
- Commit messages look like `feat(products): add SKU search`.
- Never commit `.env`, only `.env.example`.

### 9.4 Avoiding merge conflicts
- Each person edits only their own files: `server/src/routes/<feature>.js`, its controller and service, and `client/src/pages/<feature>/`.
- Shared files have one owner, **A**: `server/src/index.js` (route registration), `client/src/App.jsx` (routes), `Sidebar`, `schema.sql`, `tailwind.config.js`. At kickoff, A registers every route and sidebar item with a placeholder page, so B and C rarely need to touch these files.
- A builds the shared components first. B and C use them and ask A for changes instead of copying them.

### 9.5 Don't wait on each other
- **Seed data first.** A's seed includes warehouses, locations, products and a few operations in every status. B's dashboard and C's Validate button can then work from the first hour.
- **Mock first, real API later.** Frontend pages can start with mock JSON that matches `docs/api.md` (reuse the mockup's sample data) and switch to the real API once it's ready.
- B's dashboard reads the tables C writes. Agree on the column names at kickoff and don't rename them later.

### 9.6 Checkpoints
Hold a quick 10-minute sync at each checkpoint.

| Checkpoint | What works |
|---|---|
| **CP1: Skeleton** | App runs on all 3 laptops, login works, database is seeded |
| **CP2: Core** | Products CRUD; receipts and deliveries validate and change stock; dashboard KPIs come from real data |
| **CP3: Complete** | Transfers, adjustments, move history, OTP email, low-stock alerts, all filters |
| **CP4: Freeze** | No new features. Bug fixes, demo data, README, demo rehearsal |

**Rule:** if a feature doesn't work by CP3, cut it or simplify it. A smaller app that works beats a bigger one that crashes during the demo.

### 9.7 Communication
- One group chat (WhatsApp or Discord) for quick questions. Post a message every time you merge to `main`.
- A GitHub Projects board with To do / Doing / Done columns and one card per page or endpoint.
- Announce any schema or API change **before** making it.

### 9.8 Demo
Each member presents their own part:
- **A:** the problem, tech stack, login and OTP reset.
- **B:** dashboard KPIs and filters, products and low-stock alerts.
- **C:** run the steel flow live (receive 100 → transfer → deliver 20 → adjust −3 → **77**), then show Move History.

Keep a screen recording of the full demo as a backup.
