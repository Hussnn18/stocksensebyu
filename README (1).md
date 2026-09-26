# StockSense — Frontend

The frontend for **StockSense**, an inventory management app. Built with React 19, Vite, and Tailwind CSS. Includes a public landing page (with sign-in) and an authenticated dashboard app for managing products, warehouses, and stock operations.

## Tech Stack

- **React 19** + **React Router v7**
- **Vite** — dev server & build tool
- **Tailwind CSS v4**
- **lucide-react** — icons
- **oxlint** — linting

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

### Other scripts
```bash
npm run build     # production build
npm run preview   # preview the production build locally
npm run lint       # run oxlint
```

## Project Structure

```
frontend/
├── src/
│   ├── api/          # API client, HTTP helpers, and mock data layer
│   ├── components/
│   │   ├── app/       # Authenticated app shell (Sidebar, Topbar, AppLayout, etc.)
│   │   └── ui/        # Reusable UI primitives (Button, Card, Dialog, Table, Toast, ...)
│   ├── context/       # React context (e.g. AuthContext)
│   ├── data/          # Static/seed inventory data
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Constants and utility functions
│   ├── pages/          # Route-level pages (dashboard, products, operations, moves, settings)
│   ├── App.jsx        # Public landing page
│   └── AppRoutes.jsx  # App-wide route definitions
├── public/            # Static assets
└── vite.config.js
```

## Routes

| Path | Description |
|---|---|
| `/` | Public landing page with sign-in modal |
| `/dashboard` | Main dashboard |
| `/products`, `/products/categories`, `/products/reorder-rules`, `/products/:id` | Product management |
| `/operations/receipts`, `/operations/deliveries`, `/operations/transfers`, `/operations/adjustments` | Stock operations by type |
| `/operations/new`, `/operations/:id`, `/operations/:id/edit` | Create, view, and edit an operation |
| `/moves` | Move history |
| `/settings/warehouses` | Warehouse settings |
| `/profile` | User profile |

Everything except `/` requires being signed in.

## Notes
- The app can run entirely without a backend by setting `VITE_DATA_SOURCE=mock` in `.env` — useful for frontend-only development or demos.
- See the [backend README](../backend) for API setup instructions.
