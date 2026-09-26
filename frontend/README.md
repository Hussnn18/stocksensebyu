# StockSense — Frontend

The frontend for **StockSense**, an inventory management app. Built with React 19, Vite, and Tailwind CSS. Includes a public landing page (with sign-in) and an authenticated dashboard app for managing products, warehouses, and stock operations. Project overview and full setup: [root README](../README.md).

## Overview

StockSense's frontend is a single-page application with two distinct experiences:

- A **public landing page** (`/`) that introduces the product and includes a sign-in/sign-up modal (with OTP password reset).
- An **authenticated dashboard app** (everything else) for day-to-day inventory management — products, warehouses, stock movements, and operations like receipts, deliveries, transfers, and adjustments.

It can run fully connected to the real backend (Express + MySQL) or in a **mock mode** that uses in-browser seed data, so the UI can be developed and demoed without any backend setup.

## Tech Stack

- **React 19** — UI library
- **React Router v7** — client-side routing
- **Vite** — dev server & build tool
- **Tailwind CSS v4** — utility-first styling
- **lucide-react** — icon set
- **clsx** + **tailwind-merge** — conditional/merged class name handling
- **oxlint** — fast linting

## Getting Started

### Prerequisites
- Node.js 18+
- The backend running locally (see the [root README](../README.md)), or use mock mode (see below)

### Install
```bash
cd frontend
npm install
```

### Configure environment
Copy the example env file and adjust if needed:
```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | URL of the backend API (default: `http://localhost:5001/api`) |
| `VITE_DATA_SOURCE` | Set to `mock` to run against browser-only seed data with no backend/MySQL required. Leave unset (or `api`) to use the real Express + MySQL API. |

### Run the dev server
```bash
npm run dev
```
The app will be available at the local URL Vite prints in the terminal (typically `http://localhost:5173`).

### Other scripts
```bash
npm run build     # production build
npm run preview   # preview the production build locally
npm run lint      # run oxlint
```

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── inventory.js # The one module pages import data from; picks the real API or mock mode
│   │   ├── http.js      # Real data source: one function per Express endpoint
│   │   ├── client.js    # fetch wrapper: adds the JWT, unwraps { success, data }, raises errors
│   │   ├── mock.js      # Mock data source with the same functions and row shapes
│   │   └── mockDb.js    # In-browser copy of database/seed.sql used by mock mode
│   ├── components/
│   │   ├── app/          # Authenticated app shell — Sidebar, Topbar, AppLayout, ActivityCalendar, etc.
│   │   └── ui/           # Reusable UI primitives — Button, Card, Dialog, Field, Table, Toast, etc.
│   ├── context/          # React context (AuthContext: user, JWT, logout on 401)
│   ├── hooks/            # Custom hooks (useAsync, useDismiss, useElementWidth)
│   ├── lib/              # Constants (statuses, roles, operation types) and utility functions
│   ├── pages/
│   │   ├── dashboard/     # Dashboard: KPIs, filters, calendar, movement chart, low-stock panel
│   │   ├── products/      # Product list, detail, categories, reorder rules
│   │   ├── operations/    # Operation lists, detail, create/edit form, adjustments
│   │   ├── moves/         # Move history (stock ledger)
│   │   └── settings/      # Warehouses & locations, profile
│   ├── App.jsx            # Public landing page with the sign-in modal
│   ├── AppRoutes.jsx      # App-wide route definitions
│   ├── index.css          # Global styles
│   └── main.jsx           # App entry point
├── public/                # Static assets (sign-in illustration)
├── index.html
├── vite.config.js
└── .oxlintrc.json
```

## Routes

| Path | Description |
|---|---|
| `/` | Public landing page with sign-in modal |
| `/dashboard` | Main dashboard |
| `/products` | Product list |
| `/products/categories` | Product categories |
| `/products/reorder-rules` | Reorder rule configuration |
| `/products/:id` | Product detail |
| `/operations/receipts` | Receipt operations |
| `/operations/deliveries` | Delivery operations |
| `/operations/transfers` | Internal transfer operations |
| `/operations/adjustments` | Stock adjustments |
| `/operations/new` | Create a new operation |
| `/operations/:id` | View an operation |
| `/operations/:id/edit` | Edit an operation |
| `/moves` | Move history |
| `/settings/warehouses` | Warehouse settings |
| `/profile` | User profile |

Everything except `/` requires being signed in — unauthenticated visits to any of these redirect back to the landing page and open the sign-in modal.

## Authentication

Sign-in and sign-up happen through a modal on the landing page. Once authenticated, the user is routed into the dashboard app, which is wrapped in `AppLayout` (sidebar + topbar navigation). Auth state (user and JWT) is managed via `AuthContext`, which checks the saved token with `GET /api/auth/me` on start and logs out if any API call returns 401.

## Working Without a Backend (Mock Mode)

Set `VITE_DATA_SOURCE=mock` in `.env` to run the app entirely on browser-only seed data (`src/api/mockDb.js`, a copy of `database/seed.sql`, saved in `localStorage`). This is useful for:
- Frontend-only development when the backend isn't running
- Quick demos without setting up MySQL
- UI work that doesn't depend on real persisted data

Leave the variable unset (or set it to `api`) to use the real Express + MySQL backend.

## Notes
- Every endpoint the frontend calls is documented in [`docs/api.md`](../docs/api.md).
- Icons come from `lucide-react`; keep new icon usage consistent with the existing set rather than introducing another icon library.
- Styling uses Tailwind utility classes directly in components, aside from `index.css` for global styles.
