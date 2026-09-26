-- =====================================================================
-- StockSense – demo data (run AFTER schema.sql)
-- Includes the steel example from the brief:
--   receive 100 kg → move to production floor → deliver 20 → 3 kg damaged → 77 kg left
--
-- Demo users have password_hash = 'RESET_ME', which can never match a bcrypt hash,
-- so they cannot log in yet. Once auth is built, either sign up a new account
-- or use "Forgot password" (OTP) on one of these emails to set a password.
-- =====================================================================
USE stocksense;

-- ---------- Users ----------
INSERT INTO users (id, name, email, password_hash, role) VALUES
  (1, 'Riya Kapoor', 'riya.kapoor@example.com', 'RESET_ME', 'manager'),
  (2, 'Aman Singh',  'aman.singh@example.com',  'RESET_ME', 'staff');

-- ---------- Warehouses & locations ----------
INSERT INTO warehouses (id, name, short_code, address) VALUES
  (1, 'Main Warehouse', 'WH',  'Plot 14, Focal Point, Ludhiana'),
  (2, 'Warehouse 2',    'WH2', 'GT Road, Khanna');

INSERT INTO locations (id, warehouse_id, name, type) VALUES
  (1, 1,    'WH/Stock',            'internal'),
  (2, 1,    'WH/Rack A',           'internal'),
  (3, 1,    'WH/Rack B',           'internal'),
  (4, 1,    'WH/Production Floor', 'internal'),
  (5, 2,    'WH2/Stock',           'internal'),
  (6, 2,    'WH2/Dispatch Bay',    'internal'),
  (7, NULL, 'Vendor',              'vendor'),
  (8, NULL, 'Customer',            'customer'),
  (9, NULL, 'Inventory Loss',      'adjustment');

-- ---------- Categories & products ----------
INSERT INTO categories (id, name) VALUES
  (1, 'Raw Material'), (2, 'Finished Goods'), (3, 'Components'),
  (4, 'Hardware'),     (5, 'Consumables'),    (6, 'Packaging');

INSERT INTO products (id, name, sku, category_id, uom) VALUES
  (1, 'Steel Rods 12mm', 'STL-ROD-12', 1, 'kg'),
  (2, 'Steel Sheet 2mm', 'STL-SHT-02', 1, 'kg'),
  (3, 'Office Chair',    'FUR-CHR-01', 2, 'units'),
  (4, 'Chair Frame',     'FRM-CHR-01', 3, 'units'),
  (5, 'Wooden Desk',     'FUR-DSK-01', 2, 'units'),
  (6, 'Bolt M8',         'HW-BLT-M8',  4, 'pcs'),
  (7, 'Paint Grey 5L',   'PNT-GRY-5L', 5, 'can'),
  (8, 'Packing Box L',   'PKG-BOX-L',  6, 'pcs');

-- Low-stock thresholds on total stock (location_id NULL)
INSERT INTO reorder_rules (product_id, location_id, min_qty, max_qty) VALUES
  (1, NULL, 50, 200), (2, NULL, 40, 150), (3, NULL, 10, 40),  (4, NULL, 30, 150),
  (5, NULL, 8, 30),   (6, NULL, 500, 3000), (7, NULL, 12, 48), (8, NULL, 100, 500);

-- ---------- Operations ----------
-- Location ids: 1 WH/Stock, 2 Rack A, 3 Rack B, 4 Production Floor, 5 WH2/Stock,
--               6 WH2/Dispatch Bay, 7 Vendor, 8 Customer, 9 Inventory Loss
INSERT INTO operations
  (id, reference, type, status, partner_name, source_location_id, dest_location_id, scheduled_date, created_by, validated_by, validated_at) VALUES
  -- Receipts
  (1,  'WH/IN/0001',  'receipt',    'done',     'Punjab Fasteners',      7, 2, '2026-09-16', 1, 1, '2026-09-16 10:20:00'),
  (2,  'WH/IN/0002',  'receipt',    'done',     'Tata Steel Ltd',        7, 1, '2026-09-20', 1, 1, '2026-09-20 14:12:00'),
  (3,  'WH/IN/0003',  'receipt',    'draft',    'Guru Nanak Packaging',  7, 6, '2026-09-30', 1, NULL, NULL),
  (4,  'WH/IN/0004',  'receipt',    'waiting',  'Asian Paints',          7, 1, '2026-09-27', 1, NULL, NULL),
  (5,  'WH/IN/0005',  'receipt',    'ready',    'Tata Steel Ltd',        7, 1, '2026-09-28', 1, NULL, NULL),
  -- Deliveries
  (6,  'WH/OUT/0001', 'delivery',   'done',     'Ludhiana Hardware Mart', 2, 8, '2026-09-17', 2, 2, '2026-09-17 12:00:00'),
  (7,  'WH/OUT/0002', 'delivery',   'canceled', 'Sharma Furnishings',    1, 8, '2026-09-19', 2, NULL, NULL),
  (8,  'WH/OUT/0003', 'delivery',   'done',     'Bharat Frames',         4, 8, '2026-09-22', 2, 2, '2026-09-22 11:05:00'),
  (9,  'WH/OUT/0004', 'delivery',   'ready',    'Sharma Furnishings',    5, 8, '2026-09-27', 2, NULL, NULL),  -- not enough chairs: Validate must fail
  (10, 'WH/OUT/0005', 'delivery',   'waiting',  'Metro Office Supplies', 5, 8, '2026-09-29', 2, NULL, NULL),
  -- Internal transfers
  (11, 'WH/INT/0001', 'internal',   'done',     NULL,                    2, 5, '2026-09-18', 2, 2, '2026-09-18 15:48:00'),
  (12, 'WH/INT/0002', 'internal',   'done',     NULL,                    1, 4, '2026-09-21', 1, 1, '2026-09-21 09:30:00'),
  (13, 'WH/INT/0003', 'internal',   'draft',    NULL,                    2, 3, '2026-09-28', 2, NULL, NULL),
  (14, 'WH/INT/0004', 'internal',   'ready',    NULL,                    1, 4, '2026-09-27', 1, NULL, NULL),
  -- Adjustments
  (15, 'WH/ADJ/0001', 'adjustment', 'done',     '3 kg damaged',          4, 9, '2026-09-23', 2, 2, '2026-09-23 16:40:00');

INSERT INTO operation_lines (operation_id, product_id, quantity, counted_qty) VALUES
  (1, 6, 2000, NULL),
  (2, 1, 100, NULL),
  (3, 8, 200, NULL),
  (4, 7, 24, NULL),
  (5, 1, 50, NULL), (5, 2, 60, NULL),
  (6, 6, 200, NULL),
  (7, 4, 15, NULL),
  (8, 1, 20, NULL),
  (9, 3, 10, NULL), (9, 5, 4, NULL),
  (10, 5, 6, NULL),
  (11, 6, 600, NULL),
  (12, 1, 100, NULL),
  (13, 4, 20, NULL),
  (14, 2, 10, NULL),
  (15, 1, 80, 77);          -- recorded 80, counted 77 → −3

INSERT INTO operation_sequences (type, prefix, next_number) VALUES
  ('receipt', 'IN', 6), ('delivery', 'OUT', 6), ('internal', 'INT', 5), ('adjustment', 'ADJ', 2);

-- ---------- Stock ledger (every change that produced today's balances) ----------
INSERT INTO stock_moves (operation_id, reference, product_id, from_location_id, to_location_id, quantity, moved_at, user_id) VALUES
  -- Initial stock entered when products were created
  (NULL, 'INITIAL', 2, 9, 1, 18,   '2026-09-15 09:00:00', 1),
  (NULL, 'INITIAL', 4, 9, 2, 90,   '2026-09-15 09:00:00', 1),
  (NULL, 'INITIAL', 4, 9, 3, 50,   '2026-09-15 09:00:00', 1),
  (NULL, 'INITIAL', 5, 9, 5, 32,   '2026-09-15 09:00:00', 1),
  (NULL, 'INITIAL', 6, 9, 2, 600,  '2026-09-15 09:00:00', 1),
  (NULL, 'INITIAL', 7, 9, 1, 9,    '2026-09-15 09:00:00', 1),
  (NULL, 'INITIAL', 8, 9, 6, 310,  '2026-09-15 09:00:00', 1),
  -- Bolts
  (1,  'WH/IN/0001',  6, 7, 2, 2000, '2026-09-16 10:20:00', 1),
  (6,  'WH/OUT/0001', 6, 2, 8, 200,  '2026-09-17 12:00:00', 2),
  (11, 'WH/INT/0001', 6, 2, 5, 600,  '2026-09-18 15:48:00', 2),
  -- Steel example from the brief
  (2,  'WH/IN/0002',  1, 7, 1, 100,  '2026-09-20 14:12:00', 1),   -- receive 100 kg        → +100
  (12, 'WH/INT/0002', 1, 1, 4, 100,  '2026-09-21 09:30:00', 1),   -- to production floor   → total unchanged
  (8,  'WH/OUT/0003', 1, 4, 8, 20,   '2026-09-22 11:05:00', 2),   -- deliver 20            → −20
  (15, 'WH/ADJ/0001', 1, 4, 9, 3,    '2026-09-23 16:40:00', 2);   -- 3 kg damaged          → −3

-- ---------- Current balances (must equal what the ledger adds up to) ----------
INSERT INTO stock_quants (product_id, location_id, quantity) VALUES
  (1, 4, 77),      -- Steel Rods @ Production Floor
  (2, 1, 18),      -- Steel Sheet @ WH/Stock          (low: min 40)
  (4, 2, 90),      -- Chair Frame @ Rack A
  (4, 3, 50),      -- Chair Frame @ Rack B
  (5, 5, 32),      -- Wooden Desk @ WH2/Stock
  (6, 2, 1800),    -- Bolt M8 @ Rack A
  (6, 5, 600),     -- Bolt M8 @ WH2/Stock
  (7, 1, 9),       -- Paint @ WH/Stock                (low: min 12)
  (8, 6, 310);     -- Packing Box @ WH2/Dispatch Bay
                   -- Office Chair has no stock        (out of stock)

-- =====================================================================
-- Quick checks (each result appears in its own tab in Workbench)
-- =====================================================================

-- 1) Dashboard KPIs. Expected: 7 in stock, 2 low, 1 out, 3 receipts, 2 deliveries, 2 transfers
SELECT * FROM v_dashboard_kpis;

-- 2) Balances vs ledger. Expected: 0 rows (every balance matches its history)
SELECT l.product_id, l.location_id, l.ledger_qty, COALESCE(q.quantity, 0) AS quant_qty
FROM (
  SELECT m.product_id, m.location_id, SUM(m.delta) AS ledger_qty
  FROM (
    SELECT product_id, to_location_id   AS location_id,  quantity AS delta FROM stock_moves
    UNION ALL
    SELECT product_id, from_location_id AS location_id, -quantity AS delta FROM stock_moves
  ) m
  JOIN locations loc ON loc.id = m.location_id AND loc.type = 'internal'
  GROUP BY m.product_id, m.location_id
) l
LEFT JOIN stock_quants q ON q.product_id = l.product_id AND q.location_id = l.location_id
WHERE l.ledger_qty <> COALESCE(q.quantity, 0);

-- 3) Steel example history. Expected: 4 moves, +100, 0, −20, −3 → 77 kg left
SELECT moved_at, reference, from_location, to_location, quantity, stock_effect
FROM v_move_history
WHERE sku = 'STL-ROD-12'
ORDER BY moved_at;
