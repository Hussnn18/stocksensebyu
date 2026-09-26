# StockSense — Frontend

The frontend for **StockSense**, an inventory management app. Built with React 19, Vite, and Tailwind CSS. Includes a public landing page (with sign-in) and an authenticated dashboard app for managing products, warehouses, and stock operations.

## Overview

StockSense's frontend is a single-page application with two distinct experiences:

- A **public landing page** (`/`) that markets the product and includes a sign-in/sign-up modal.
- An **authenticated dashboard app** (everything else) for day-to-day inventory management — products, warehouses, stock movements, and operations like receipts, deliveries, transfers, and adjustments.

It can run fully connected to the real backend (Express + MySQL) or in a **mock mode** that uses in-browser seed data, so the UI can be developed and demoed without any backend setup.

## Tech Stack

- **React 19** — UI library
- **React Router v7** — client-side routing
- **Vite** — dev server & build tool
- **Tailwind CSS v4** — utility-first styling
- **lucide-react** — icon set
- **clsx** + **tailwind-merge** — conditional/merged class name handling
- **canvas-confetti** — celebratory UI effects
- **oxlint** — fast linting

## Getting Started

### Prerequisites
- Node.js (LTS recommended)
- The [backend](../backend) running locally, or use mock mode (see below)

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
│   ├── api/            # API client, HTTP helpers, and mock data layer
│   │   ├── client.js    # Configured API client
│   │   ├── http.js      # Low-level HTTP helpers
│   │   ├── inventory.js # Inventory-related API calls
│   │   ├── mock.js      # Mock mode entry point
│   │   └── mockDb.js    # In-browser mock database
│   ├── components/
│   │   ├── app/          # Authenticated app shell — Sidebar, Topbar, AppLayout, etc.
│   │   ├── ui/           # Reusable UI primitives — Button, Card, Dialog, Table, Toast, etc.
│   │   └── ai/           # AI-related components
│   ├── context/          # React context (e.g. AuthContext)
│   ├── data/             # Static/seed inventory data
│   ├── hooks/            # Custom hooks (useAsync, useDismiss, useElementWidth)
│   ├── lib/              # Constants and utility functions
│   ├── pages/
│   │   ├── dashboard/     # Dashboard page
│   │   ├── products/      # Product list, detail, categories, reorder rules
│   │   ├── operations/     # Operation list, detail, form
│   │   ├── moves/          # Move history
│   │   └── settings/       # Warehouses, profile
│   ├── App.jsx            # Public landing page
│   ├── AppRoutes.jsx      # App-wide route definitions
│   ├── App.css / index.css
│   └── main.jsx           # App entry point
├── public/                # Static assets
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

Everything except `/` requires being signed in — unauthenticated visits to any of these redirect back to the landing page.

## Authentication

Sign-in and sign-up happen through a modal on the landing page. Once authenticated, the user is routed into the dashboard app, which is wrapped in `AppLayout` (sidebar + topbar navigation). Auth state is managed via `AuthContext`.

## Working Without a Backend (Mock Mode)

Set `VITE_DATA_SOURCE=mock` in `.env` to run the app entirely on browser-only seed data (`src/data/inventoryData.js` + `src/api/mockDb.js`). This is useful for:
- Frontend-only development when the backend isn't running
- Quick demos without setting up MySQL
- UI work that doesn't depend on real persisted data

Leave the variable unset (or set it to `api`) to use the real Express + MySQL backend.

## Notes
- See the [backend README](../backend) for API setup instructions.
- Icons come from `lucide-react`; keep new icon usage consistent with the existing set rather than introducing another icon library.
- Styling uses Tailwind utility classes directly in components rather than separate CSS files, aside from `App.css` / `index.css` for global styles.
