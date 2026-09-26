-- =====================================================================
-- StockSense – Inventory Management System
-- Schema for MySQL 8.0+   (run in MySQL Workbench: File > Open SQL Script, then ⚡ Execute)
--
-- WARNING: this script DROPS and recreates the `stocksense` database.
-- Run seed.sql afterwards to load demo data.
-- =====================================================================

DROP DATABASE IF EXISTS stocksense;
CREATE DATABASE stocksense CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE stocksense;

-- ---------------------------------------------------------------------
-- Users & authentication
-- ---------------------------------------------------------------------
CREATE TABLE users (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,                 -- bcrypt hash, never plain text
  role           ENUM('manager','staff') NOT NULL DEFAULT 'staff',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB;

-- One row per password-reset request. The OTP itself is stored hashed.
CREATE TABLE password_otps (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  otp_hash    VARCHAR(255) NOT NULL,
  expires_at  DATETIME NOT NULL,                         -- created_at + 10 minutes
  attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,       -- lock after 5 wrong tries
  used        TINYINT(1) NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_otp_user (user_id, used)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Warehouses & locations
-- ---------------------------------------------------------------------
CREATE TABLE warehouses (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  short_code  VARCHAR(10)  NOT NULL,                     -- e.g. WH, WH2 (used in location names)
  address     VARCHAR(255) NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_warehouses_code UNIQUE (short_code)
) ENGINE=InnoDB;

-- internal   = a real place that holds stock (belongs to a warehouse)
-- vendor / customer / adjustment = virtual locations (warehouse_id is NULL).
-- They are the "other side" of receipts, deliveries and adjustments, so every
-- stock change is always a move FROM one location TO another.
CREATE TABLE locations (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warehouse_id  INT UNSIGNED NULL,
  name          VARCHAR(100) NOT NULL,                   -- e.g. WH/Stock, WH/Rack A, Vendor
  type          ENUM('internal','vendor','customer','adjustment') NOT NULL DEFAULT 'internal',
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_locations_name UNIQUE (name),
  CONSTRAINT fk_locations_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  INDEX idx_locations_type (type)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------
CREATE TABLE categories (
  id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  CONSTRAINT uq_categories_name UNIQUE (name)
) ENGINE=InnoDB;

CREATE TABLE products (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(150) NOT NULL,
  sku          VARCHAR(50)  NOT NULL,
  category_id  INT UNSIGNED NULL,
  uom          VARCHAR(20)  NOT NULL DEFAULT 'units',    -- unit of measure: kg, units, pcs, can…
  is_active    TINYINT(1) NOT NULL DEFAULT 1,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_products_sku UNIQUE (sku),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  INDEX idx_products_name (name)
) ENGINE=InnoDB;

-- location_id NULL = rule applies to the product's total stock across all locations.
CREATE TABLE reorder_rules (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id   INT UNSIGNED NOT NULL,
  location_id  INT UNSIGNED NULL,
  min_qty      DECIMAL(12,3) NOT NULL DEFAULT 0,         -- at or below this = "low stock"
  max_qty      DECIMAL(12,3) NULL,                       -- suggested refill level
  CONSTRAINT fk_reorder_product  FOREIGN KEY (product_id)  REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_reorder_location FOREIGN KEY (location_id) REFERENCES locations(id),
  CONSTRAINT uq_reorder UNIQUE (product_id, location_id),
  CONSTRAINT chk_reorder_qty CHECK (min_qty >= 0 AND (max_qty IS NULL OR max_qty >= min_qty))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Current stock balance: one row per product per internal location.
-- Only ever changed inside the same transaction that writes stock_moves.
-- ---------------------------------------------------------------------
CREATE TABLE stock_quants (
  product_id   INT UNSIGNED NOT NULL,
  location_id  INT UNSIGNED NOT NULL,
  quantity     DECIMAL(12,3) NOT NULL DEFAULT 0,
  updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, location_id),
  CONSTRAINT fk_quants_product  FOREIGN KEY (product_id)  REFERENCES products(id),
  CONSTRAINT fk_quants_location FOREIGN KEY (location_id) REFERENCES locations(id),
  CONSTRAINT chk_quants_non_negative CHECK (quantity >= 0),   -- stock can never go below zero
  INDEX idx_quants_location (location_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Operations (documents): receipts, deliveries, internal transfers, adjustments
-- Stock only changes when status becomes 'done' (Validate).
-- ---------------------------------------------------------------------
CREATE TABLE operations (
  id                  INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reference           VARCHAR(30) NOT NULL,              -- WH/IN/0001, WH/OUT/0001, WH/INT/0001, WH/ADJ/0001
  type                ENUM('receipt','delivery','internal','adjustment') NOT NULL,
  status              ENUM('draft','waiting','ready','done','canceled') NOT NULL DEFAULT 'draft',
  partner_name        VARCHAR(150) NULL,                 -- supplier / customer / reason
  source_location_id  INT UNSIGNED NOT NULL,
  dest_location_id    INT UNSIGNED NOT NULL,
  scheduled_date      DATE NULL,
  notes               TEXT NULL,
  created_by          INT UNSIGNED NULL,
  validated_by        INT UNSIGNED NULL,
  validated_at        DATETIME NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_operations_reference UNIQUE (reference),
  CONSTRAINT fk_ops_source    FOREIGN KEY (source_location_id) REFERENCES locations(id),
  CONSTRAINT fk_ops_dest      FOREIGN KEY (dest_location_id)   REFERENCES locations(id),
  CONSTRAINT fk_ops_created   FOREIGN KEY (created_by)   REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_ops_validated FOREIGN KEY (validated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_ops_type_status (type, status),               -- dashboard KPIs & filters
  INDEX idx_ops_scheduled (scheduled_date)
) ENGINE=InnoDB;

-- For adjustments: quantity = recorded stock when counted, counted_qty = physical count.
-- The difference is recalculated from live stock at Validate time.
CREATE TABLE operation_lines (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  operation_id  INT UNSIGNED NOT NULL,
  product_id    INT UNSIGNED NOT NULL,
  quantity      DECIMAL(12,3) NOT NULL,
  counted_qty   DECIMAL(12,3) NULL,
  CONSTRAINT fk_lines_operation FOREIGN KEY (operation_id) REFERENCES operations(id) ON DELETE CASCADE,
  CONSTRAINT fk_lines_product   FOREIGN KEY (product_id)   REFERENCES products(id),
  CONSTRAINT chk_lines_qty CHECK (quantity >= 0 AND (counted_qty IS NULL OR counted_qty >= 0)),
  INDEX idx_lines_product (product_id)
) ENGINE=InnoDB;

-- Next reference number per operation type. Lock the row with SELECT … FOR UPDATE
-- inside the create transaction so two users never get the same reference.
CREATE TABLE operation_sequences (
  type         ENUM('receipt','delivery','internal','adjustment') PRIMARY KEY,
  prefix       VARCHAR(10) NOT NULL,                     -- IN, OUT, INT, ADJ
  next_number  INT UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Stock ledger: the full history. Rows are only ever INSERTed, never updated.
-- quantity is always positive; direction comes from from/to locations.
-- ---------------------------------------------------------------------
CREATE TABLE stock_moves (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  operation_id      INT UNSIGNED NULL,                   -- NULL for "initial stock" set on product creation
  reference         VARCHAR(30) NOT NULL,                -- copy of operation reference, or 'INITIAL'
  product_id        INT UNSIGNED NOT NULL,
  from_location_id  INT UNSIGNED NOT NULL,
  to_location_id    INT UNSIGNED NOT NULL,
  quantity          DECIMAL(12,3) NOT NULL,
  moved_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id           INT UNSIGNED NULL,
  CONSTRAINT fk_moves_operation FOREIGN KEY (operation_id)     REFERENCES operations(id),
  CONSTRAINT fk_moves_product   FOREIGN KEY (product_id)       REFERENCES products(id),
  CONSTRAINT fk_moves_from      FOREIGN KEY (from_location_id) REFERENCES locations(id),
  CONSTRAINT fk_moves_to        FOREIGN KEY (to_location_id)   REFERENCES locations(id),
  CONSTRAINT fk_moves_user      FOREIGN KEY (user_id)          REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_moves_qty CHECK (quantity > 0),
  CONSTRAINT chk_moves_locations CHECK (from_location_id <> to_location_id),
  INDEX idx_moves_product_date (product_id, moved_at),
  INDEX idx_moves_date (moved_at),
  INDEX idx_moves_operation (operation_id)
) ENGINE=InnoDB;

-- =====================================================================
-- Views used by the dashboard and products pages
-- =====================================================================

-- Total on-hand stock per product, with its low/out-of-stock state.
CREATE VIEW v_product_stock AS
SELECT
  p.id                           AS product_id,
  p.sku,
  p.name,
  p.category_id,
  c.name                         AS category,
  p.uom,
  COALESCE(SUM(q.quantity), 0)   AS on_hand,
  r.min_qty,
  CASE
    WHEN COALESCE(SUM(q.quantity), 0) = 0 THEN 'out'
    WHEN r.min_qty IS NOT NULL AND COALESCE(SUM(q.quantity), 0) <= r.min_qty THEN 'low'
    ELSE 'ok'
  END                            AS stock_state
FROM products p
LEFT JOIN categories c   ON c.id = p.category_id
LEFT JOIN stock_quants q ON q.product_id = p.id
LEFT JOIN (
  SELECT product_id, MIN(min_qty) AS min_qty
  FROM reorder_rules
  WHERE location_id IS NULL
  GROUP BY product_id
) r ON r.product_id = p.id
WHERE p.is_active = 1
GROUP BY p.id, p.sku, p.name, p.category_id, c.name, p.uom, r.min_qty;

-- The five dashboard KPIs in one row.
CREATE VIEW v_dashboard_kpis AS
SELECT
  (SELECT COUNT(*) FROM v_product_stock WHERE on_hand > 0)             AS products_in_stock,
  (SELECT COUNT(*) FROM v_product_stock WHERE stock_state = 'low')     AS low_stock,
  (SELECT COUNT(*) FROM v_product_stock WHERE stock_state = 'out')     AS out_of_stock,
  (SELECT COUNT(*) FROM operations WHERE type = 'receipt'  AND status IN ('draft','waiting','ready')) AS pending_receipts,
  (SELECT COUNT(*) FROM operations WHERE type = 'delivery' AND status IN ('draft','waiting','ready')) AS pending_deliveries,
  (SELECT COUNT(*) FROM operations WHERE type = 'internal' AND status IN ('draft','waiting','ready')) AS transfers_scheduled;

-- Move history with readable names (for the Move History page).
CREATE VIEW v_move_history AS
SELECT
  m.id,
  m.moved_at,
  m.reference,
  o.type          AS operation_type,
  p.sku,
  p.name          AS product,
  p.uom,
  lf.name         AS from_location,
  lt.name         AS to_location,
  m.quantity,
  CASE                                                   -- signed effect on internal stock
    WHEN lf.type <> 'internal' AND lt.type = 'internal' THEN  m.quantity
    WHEN lf.type = 'internal' AND lt.type <> 'internal' THEN -m.quantity
    ELSE 0
  END             AS stock_effect,
  u.name          AS user_name
FROM stock_moves m
JOIN products  p  ON p.id  = m.product_id
JOIN locations lf ON lf.id = m.from_location_id
JOIN locations lt ON lt.id = m.to_location_id
LEFT JOIN operations o ON o.id = m.operation_id
LEFT JOIN users      u ON u.id = m.user_id;

-- ---------------------------------------------------------------------
-- Optional: a separate MySQL login for the Node app instead of root.
-- Uncomment, pick your own password, and put it in server/.env.
-- ---------------------------------------------------------------------
-- CREATE USER IF NOT EXISTS 'stocksense_app'@'localhost' IDENTIFIED BY 'choose-a-password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON stocksense.* TO 'stocksense_app'@'localhost';
-- FLUSH PRIVILEGES;
