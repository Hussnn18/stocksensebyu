# Database setup (MySQL 8 + MySQL Workbench)

## First time
1. Open **MySQL Workbench** and click your local connection (usually `Local instance MySQL80`). Enter your MySQL root password.
2. **File → Open SQL Script…** → choose `database/schema.sql` → click the ⚡ **Execute** button (or `Ctrl+Shift+Enter`).
3. **File → Open SQL Script…** → choose `database/seed.sql` → ⚡ **Execute**.
4. In the left **Schemas** panel, right-click → **Refresh All**. You should see `stocksense` with 12 tables and 3 views.

## Check it worked
The last three queries in `seed.sql` open result tabs:

| Check | Expected |
|---|---|
| `v_dashboard_kpis` | 7 in stock, 2 low, 1 out, 3 pending receipts, 2 pending deliveries, 2 transfers |
| Balances vs ledger | **0 rows** |
| Steel Rods history | 4 moves: +100, 0, −20, −3 (77 kg left) |

## See the ER diagram
**Database → Reverse Engineer…** → pick your connection → select `stocksense` → Next until Finish. Workbench draws every table and relationship. Good for the demo slides.

## Reset to fresh demo data
Run `schema.sql` then `seed.sql` again. **This deletes everything** in the `stocksense` database.

## Rules for the team
- Only the schema owner edits `schema.sql`. Ask in the group chat first, then everyone re-runs both files.
- Stock is only changed by the backend's Validate code, inside one transaction that inserts into `stock_moves` **and** updates `stock_quants`. Never edit `stock_quants` by hand.
- Demo users (`riya.kapoor@example.com`, `aman.singh@example.com`) can't log in until a password is set through signup or the OTP reset flow.

## Connecting the backend (later)
`server/.env`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=stocksense
```
(Optional: `schema.sql` has a commented block to create a separate `stocksense_app` MySQL user instead of using root.)
