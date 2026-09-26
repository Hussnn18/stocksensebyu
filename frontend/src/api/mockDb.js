// In-browser copy of database/seed.sql, used until the Express + MySQL endpoints exist.
// Table and column names match schema.sql exactly, so the numbers on screen are the
// same ones the real API will return (7 in stock, 2 low, 1 out, 3 receipts, 2 deliveries, 2 transfers).

export function createSeed() {
  return {
    users: [
      { id: 1, name: 'Riya Kapoor', email: 'riya.kapoor@example.com', role: 'manager' },
      { id: 2, name: 'Aman Singh', email: 'aman.singh@example.com', role: 'staff' },
    ],

    warehouses: [
      { id: 1, name: 'Main Warehouse', short_code: 'WH', address: 'Plot 14, Focal Point, Ludhiana' },
      { id: 2, name: 'Warehouse 2', short_code: 'WH2', address: 'GT Road, Khanna' },
    ],

    locations: [
      { id: 1, warehouse_id: 1, name: 'WH/Stock', type: 'internal' },
      { id: 2, warehouse_id: 1, name: 'WH/Rack A', type: 'internal' },
      { id: 3, warehouse_id: 1, name: 'WH/Rack B', type: 'internal' },
      { id: 4, warehouse_id: 1, name: 'WH/Production Floor', type: 'internal' },
      { id: 5, warehouse_id: 2, name: 'WH2/Stock', type: 'internal' },
      { id: 6, warehouse_id: 2, name: 'WH2/Dispatch Bay', type: 'internal' },
      { id: 7, warehouse_id: null, name: 'Vendor', type: 'vendor' },
      { id: 8, warehouse_id: null, name: 'Customer', type: 'customer' },
      { id: 9, warehouse_id: null, name: 'Inventory Loss', type: 'adjustment' },
    ],

    categories: [
      { id: 1, name: 'Raw Material' },
      { id: 2, name: 'Finished Goods' },
      { id: 3, name: 'Components' },
      { id: 4, name: 'Hardware' },
      { id: 5, name: 'Consumables' },
      { id: 6, name: 'Packaging' },
    ],

    products: [
      { id: 1, name: 'Steel Rods 12mm', sku: 'STL-ROD-12', category_id: 1, uom: 'kg', created_at: '2026-09-15T09:00:00' },
      { id: 2, name: 'Steel Sheet 2mm', sku: 'STL-SHT-02', category_id: 1, uom: 'kg', created_at: '2026-09-15T09:00:00' },
      { id: 3, name: 'Office Chair', sku: 'FUR-CHR-01', category_id: 2, uom: 'units', created_at: '2026-09-15T09:00:00' },
      { id: 4, name: 'Chair Frame', sku: 'FRM-CHR-01', category_id: 3, uom: 'units', created_at: '2026-09-15T09:00:00' },
      { id: 5, name: 'Wooden Desk', sku: 'FUR-DSK-01', category_id: 2, uom: 'units', created_at: '2026-09-15T09:00:00' },
      { id: 6, name: 'Bolt M8', sku: 'HW-BLT-M8', category_id: 4, uom: 'pcs', created_at: '2026-09-15T09:00:00' },
      { id: 7, name: 'Paint Grey 5L', sku: 'PNT-GRY-5L', category_id: 5, uom: 'can', created_at: '2026-09-15T09:00:00' },
      { id: 8, name: 'Packing Box L', sku: 'PKG-BOX-L', category_id: 6, uom: 'pcs', created_at: '2026-09-15T09:00:00' },
    ],

    // location_id null = rule on the product's total stock
    reorder_rules: [
      { id: 1, product_id: 1, location_id: null, min_qty: 50, max_qty: 200 },
      { id: 2, product_id: 2, location_id: null, min_qty: 40, max_qty: 150 },
      { id: 3, product_id: 3, location_id: null, min_qty: 10, max_qty: 40 },
      { id: 4, product_id: 4, location_id: null, min_qty: 30, max_qty: 150 },
      { id: 5, product_id: 5, location_id: null, min_qty: 8, max_qty: 30 },
      { id: 6, product_id: 6, location_id: null, min_qty: 500, max_qty: 3000 },
      { id: 7, product_id: 7, location_id: null, min_qty: 12, max_qty: 48 },
      { id: 8, product_id: 8, location_id: null, min_qty: 100, max_qty: 500 },
    ],

    stock_quants: [
      { product_id: 1, location_id: 4, quantity: 77 },
      { product_id: 2, location_id: 1, quantity: 18 },
      { product_id: 4, location_id: 2, quantity: 90 },
      { product_id: 4, location_id: 3, quantity: 50 },
      { product_id: 5, location_id: 5, quantity: 32 },
      { product_id: 6, location_id: 2, quantity: 1800 },
      { product_id: 6, location_id: 5, quantity: 600 },
      { product_id: 7, location_id: 1, quantity: 9 },
      { product_id: 8, location_id: 6, quantity: 310 },
    ],

    operations: [
      { id: 1, reference: 'WH/IN/0001', type: 'receipt', status: 'done', partner_name: 'Punjab Fasteners', source_location_id: 7, dest_location_id: 2, scheduled_date: '2026-09-16', created_by: 1, validated_at: '2026-09-16T10:20:00' },
      { id: 2, reference: 'WH/IN/0002', type: 'receipt', status: 'done', partner_name: 'Tata Steel Ltd', source_location_id: 7, dest_location_id: 1, scheduled_date: '2026-09-20', created_by: 1, validated_at: '2026-09-20T14:12:00' },
      { id: 3, reference: 'WH/IN/0003', type: 'receipt', status: 'draft', partner_name: 'Guru Nanak Packaging', source_location_id: 7, dest_location_id: 6, scheduled_date: '2026-09-30', created_by: 1, validated_at: null },
      { id: 4, reference: 'WH/IN/0004', type: 'receipt', status: 'waiting', partner_name: 'Asian Paints', source_location_id: 7, dest_location_id: 1, scheduled_date: '2026-09-27', created_by: 1, validated_at: null },
      { id: 5, reference: 'WH/IN/0005', type: 'receipt', status: 'ready', partner_name: 'Tata Steel Ltd', source_location_id: 7, dest_location_id: 1, scheduled_date: '2026-09-28', created_by: 1, validated_at: null },
      { id: 6, reference: 'WH/OUT/0001', type: 'delivery', status: 'done', partner_name: 'Ludhiana Hardware Mart', source_location_id: 2, dest_location_id: 8, scheduled_date: '2026-09-17', created_by: 2, validated_at: '2026-09-17T12:00:00' },
      { id: 7, reference: 'WH/OUT/0002', type: 'delivery', status: 'canceled', partner_name: 'Sharma Furnishings', source_location_id: 1, dest_location_id: 8, scheduled_date: '2026-09-19', created_by: 2, validated_at: null },
      { id: 8, reference: 'WH/OUT/0003', type: 'delivery', status: 'done', partner_name: 'Bharat Frames', source_location_id: 4, dest_location_id: 8, scheduled_date: '2026-09-22', created_by: 2, validated_at: '2026-09-22T11:05:00' },
      { id: 9, reference: 'WH/OUT/0004', type: 'delivery', status: 'ready', partner_name: 'Sharma Furnishings', source_location_id: 5, dest_location_id: 8, scheduled_date: '2026-09-27', created_by: 2, validated_at: null },
      { id: 10, reference: 'WH/OUT/0005', type: 'delivery', status: 'waiting', partner_name: 'Metro Office Supplies', source_location_id: 5, dest_location_id: 8, scheduled_date: '2026-09-29', created_by: 2, validated_at: null },
      { id: 11, reference: 'WH/INT/0001', type: 'internal', status: 'done', partner_name: null, source_location_id: 2, dest_location_id: 5, scheduled_date: '2026-09-18', created_by: 2, validated_at: '2026-09-18T15:48:00' },
      { id: 12, reference: 'WH/INT/0002', type: 'internal', status: 'done', partner_name: null, source_location_id: 1, dest_location_id: 4, scheduled_date: '2026-09-21', created_by: 1, validated_at: '2026-09-21T09:30:00' },
      { id: 13, reference: 'WH/INT/0003', type: 'internal', status: 'draft', partner_name: null, source_location_id: 2, dest_location_id: 3, scheduled_date: '2026-09-28', created_by: 2, validated_at: null },
      { id: 14, reference: 'WH/INT/0004', type: 'internal', status: 'ready', partner_name: null, source_location_id: 1, dest_location_id: 4, scheduled_date: '2026-09-27', created_by: 1, validated_at: null },
      { id: 15, reference: 'WH/ADJ/0001', type: 'adjustment', status: 'done', partner_name: '3 kg damaged', source_location_id: 4, dest_location_id: 9, scheduled_date: '2026-09-23', created_by: 2, validated_at: '2026-09-23T16:40:00' },
    ],

    operation_lines: [
      { operation_id: 1, product_id: 6, quantity: 2000, counted_qty: null },
      { operation_id: 2, product_id: 1, quantity: 100, counted_qty: null },
      { operation_id: 3, product_id: 8, quantity: 200, counted_qty: null },
      { operation_id: 4, product_id: 7, quantity: 24, counted_qty: null },
      { operation_id: 5, product_id: 1, quantity: 50, counted_qty: null },
      { operation_id: 5, product_id: 2, quantity: 60, counted_qty: null },
      { operation_id: 6, product_id: 6, quantity: 200, counted_qty: null },
      { operation_id: 7, product_id: 4, quantity: 15, counted_qty: null },
      { operation_id: 8, product_id: 1, quantity: 20, counted_qty: null },
      { operation_id: 9, product_id: 3, quantity: 10, counted_qty: null },
      { operation_id: 9, product_id: 5, quantity: 4, counted_qty: null },
      { operation_id: 10, product_id: 5, quantity: 6, counted_qty: null },
      { operation_id: 11, product_id: 6, quantity: 600, counted_qty: null },
      { operation_id: 12, product_id: 1, quantity: 100, counted_qty: null },
      { operation_id: 13, product_id: 4, quantity: 20, counted_qty: null },
      { operation_id: 14, product_id: 2, quantity: 10, counted_qty: null },
      { operation_id: 15, product_id: 1, quantity: 80, counted_qty: 77 },
    ],

    // The ledger. quantity is always positive; direction comes from the locations.
    stock_moves: [
      { id: 1, operation_id: null, reference: 'INITIAL', product_id: 2, from_location_id: 9, to_location_id: 1, quantity: 18, moved_at: '2026-09-15T09:00:00', user_id: 1 },
      { id: 2, operation_id: null, reference: 'INITIAL', product_id: 4, from_location_id: 9, to_location_id: 2, quantity: 90, moved_at: '2026-09-15T09:00:00', user_id: 1 },
      { id: 3, operation_id: null, reference: 'INITIAL', product_id: 4, from_location_id: 9, to_location_id: 3, quantity: 50, moved_at: '2026-09-15T09:00:00', user_id: 1 },
      { id: 4, operation_id: null, reference: 'INITIAL', product_id: 5, from_location_id: 9, to_location_id: 5, quantity: 32, moved_at: '2026-09-15T09:00:00', user_id: 1 },
      { id: 5, operation_id: null, reference: 'INITIAL', product_id: 6, from_location_id: 9, to_location_id: 2, quantity: 600, moved_at: '2026-09-15T09:00:00', user_id: 1 },
      { id: 6, operation_id: null, reference: 'INITIAL', product_id: 7, from_location_id: 9, to_location_id: 1, quantity: 9, moved_at: '2026-09-15T09:00:00', user_id: 1 },
      { id: 7, operation_id: null, reference: 'INITIAL', product_id: 8, from_location_id: 9, to_location_id: 6, quantity: 310, moved_at: '2026-09-15T09:00:00', user_id: 1 },
      { id: 8, operation_id: 1, reference: 'WH/IN/0001', product_id: 6, from_location_id: 7, to_location_id: 2, quantity: 2000, moved_at: '2026-09-16T10:20:00', user_id: 1 },
      { id: 9, operation_id: 6, reference: 'WH/OUT/0001', product_id: 6, from_location_id: 2, to_location_id: 8, quantity: 200, moved_at: '2026-09-17T12:00:00', user_id: 2 },
      { id: 10, operation_id: 11, reference: 'WH/INT/0001', product_id: 6, from_location_id: 2, to_location_id: 5, quantity: 600, moved_at: '2026-09-18T15:48:00', user_id: 2 },
      { id: 11, operation_id: 2, reference: 'WH/IN/0002', product_id: 1, from_location_id: 7, to_location_id: 1, quantity: 100, moved_at: '2026-09-20T14:12:00', user_id: 1 },
      { id: 12, operation_id: 12, reference: 'WH/INT/0002', product_id: 1, from_location_id: 1, to_location_id: 4, quantity: 100, moved_at: '2026-09-21T09:30:00', user_id: 1 },
      { id: 13, operation_id: 8, reference: 'WH/OUT/0003', product_id: 1, from_location_id: 4, to_location_id: 8, quantity: 20, moved_at: '2026-09-22T11:05:00', user_id: 2 },
      { id: 14, operation_id: 15, reference: 'WH/ADJ/0001', product_id: 1, from_location_id: 4, to_location_id: 9, quantity: 3, moved_at: '2026-09-23T16:40:00', user_id: 2 },
    ],
  };
}
