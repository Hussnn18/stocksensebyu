// Mock initial state and data for StockSense IMS
export const initialWarehouses = [
  { id: 'wh-1', name: 'Main Central Warehouse', code: 'WH-CENTRAL', address: 'Plot 42, Logistics Park', city: 'Chicago, IL' },
  { id: 'wh-2', name: 'Production Floor Annex', code: 'WH-PROD', address: 'Industrial Zone Bay 7', city: 'Detroit, MI' },
  { id: 'wh-3', name: 'East Coast Distribution Center', code: 'WH-EAST', address: '99 Harbor Way', city: 'Newark, NJ' }
];

export const initialLocations = [
  { id: 'loc-1', warehouseId: 'wh-1', name: 'Main Store - Bay 01', code: 'MAIN-BAY-1', type: 'bay' },
  { id: 'loc-2', warehouseId: 'wh-1', name: 'Rack A - Pallet 12', code: 'RACK-A-12', type: 'rack' },
  { id: 'loc-3', warehouseId: 'wh-1', name: 'Rack B - Heavy Storage', code: 'RACK-B-04', type: 'rack' },
  { id: 'loc-4', warehouseId: 'wh-2', name: 'Production Floor Rack', code: 'PROD-RACK-01', type: 'floor' },
  { id: 'loc-5', warehouseId: 'wh-2', name: 'Assembly Line 3', code: 'PROD-ASSY-3', type: 'floor' },
  { id: 'loc-6', warehouseId: 'wh-3', name: 'Outbound Staging Bay', code: 'OUTBOUND-STAGE', type: 'bay' }
];

export const initialCategories = [
  { id: 'cat-1', name: 'Raw Materials', slug: 'raw-materials', icon: 'Layers', count: 18 },
  { id: 'cat-2', name: 'Hardware & Fasteners', slug: 'hardware', icon: 'Wrench', count: 42 },
  { id: 'cat-3', name: 'Finished Goods', slug: 'finished-goods', icon: 'PackageCheck', count: 24 },
  { id: 'cat-4', name: 'Packaging & Cartons', slug: 'packaging', icon: 'Box', count: 15 },
  { id: 'cat-5', name: 'Electronics & Sensors', slug: 'electronics', icon: 'Cpu', count: 31 }
];

export const initialProducts = [
  {
    id: 'prod-1',
    name: 'Industrial Steel Rods (10mm)',
    sku: 'STL-ROD-10MM',
    category: 'Raw Materials',
    categoryId: 'cat-1',
    uom: 'kg',
    totalStock: 350,
    minStockAlert: 100,
    reorderQty: 200,
    unitCost: 4.50,
    unitPrice: 8.20,
    status: 'in_stock',
    locationBreakdown: [
      { locationId: 'loc-1', locationName: 'Main Store - Bay 01', qty: 250 },
      { locationId: 'loc-4', locationName: 'Production Floor Rack', qty: 100 }
    ]
  },
  {
    id: 'prod-2',
    name: 'Ergonomic Task Chairs (Model X)',
    sku: 'CHR-ERGO-BLK',
    category: 'Finished Goods',
    categoryId: 'cat-3',
    uom: 'units',
    totalStock: 48,
    minStockAlert: 20,
    reorderQty: 50,
    unitCost: 65.00,
    unitPrice: 149.00,
    status: 'in_stock',
    locationBreakdown: [
      { locationId: 'loc-2', locationName: 'Rack A - Pallet 12', qty: 38 },
      { locationId: 'loc-6', locationName: 'Outbound Staging Bay', qty: 10 }
    ]
  },
  {
    id: 'prod-3',
    name: 'M8 Stainless Steel Hex Bolts',
    sku: 'BLT-SS-M8',
    category: 'Hardware & Fasteners',
    categoryId: 'cat-2',
    uom: 'pcs',
    totalStock: 12,
    minStockAlert: 150,
    reorderQty: 500,
    unitCost: 0.25,
    unitPrice: 0.60,
    status: 'low_stock',
    locationBreakdown: [
      { locationId: 'loc-3', locationName: 'Rack B - Heavy Storage', qty: 12 }
    ]
  },
  {
    id: 'prod-4',
    name: 'Reinforced Corrugated Boxes (Large)',
    sku: 'BOX-CORR-LG',
    category: 'Packaging & Cartons',
    categoryId: 'cat-4',
    uom: 'boxes',
    totalStock: 0,
    minStockAlert: 50,
    reorderQty: 250,
    unitCost: 1.80,
    unitPrice: 3.50,
    status: 'out_of_stock',
    locationBreakdown: []
  },
  {
    id: 'prod-5',
    name: 'Optical Sensor Unit (24V)',
    sku: 'SNS-OPT-24V',
    category: 'Electronics & Sensors',
    categoryId: 'cat-5',
    uom: 'units',
    totalStock: 85,
    minStockAlert: 15,
    reorderQty: 40,
    unitCost: 28.00,
    unitPrice: 58.00,
    status: 'in_stock',
    locationBreakdown: [
      { locationId: 'loc-2', locationName: 'Rack A - Pallet 12', qty: 85 }
    ]
  },
  {
    id: 'prod-6',
    name: 'Aluminum Extrusion Profiles (2m)',
    sku: 'ALU-EXT-2020',
    category: 'Raw Materials',
    categoryId: 'cat-1',
    uom: 'meters',
    totalStock: 18,
    minStockAlert: 60,
    reorderQty: 150,
    unitCost: 12.00,
    unitPrice: 22.50,
    status: 'low_stock',
    locationBreakdown: [
      { locationId: 'loc-1', locationName: 'Main Store - Bay 01', qty: 18 }
    ]
  }
];

export const initialOperations = [
  {
    id: 'op-1',
    docNumber: 'REC-2026-0042',
    type: 'receipt', // 'receipt' | 'delivery' | 'internal_transfer' | 'adjustment'
    title: 'Inbound Steel & Hardware Shipment',
    partner: 'Apex Metals & Alloy Corp',
    sourceLocation: 'Vendor Inbound',
    destLocation: 'Main Store - Bay 01',
    warehouse: 'Main Central Warehouse',
    category: 'Raw Materials',
    status: 'waiting', // 'draft' | 'waiting' | 'ready' | 'done' | 'canceled'
    itemsCount: 2,
    totalQty: 150,
    scheduledDate: '2026-09-27',
    assignedTo: 'Marcus Vance (Warehouse Staff)',
    details: [
      { product: 'Industrial Steel Rods (10mm)', sku: 'STL-ROD-10MM', demandedQty: 100, doneQty: 0, uom: 'kg' },
      { product: 'M8 Stainless Steel Hex Bolts', sku: 'BLT-SS-M8', demandedQty: 500, doneQty: 0, uom: 'pcs' }
    ]
  },
  {
    id: 'op-2',
    docNumber: 'DEL-2026-0089',
    type: 'delivery',
    title: 'Client Order #7821 — Metro Tech Offices',
    partner: 'Metro Tech Enterprises',
    sourceLocation: 'Rack A - Pallet 12',
    destLocation: 'Customer Dispatch Bay',
    warehouse: 'Main Central Warehouse',
    category: 'Finished Goods',
    status: 'ready',
    itemsCount: 1,
    totalQty: 10,
    scheduledDate: '2026-09-26',
    assignedTo: 'Elena Rostova (Warehouse Staff)',
    details: [
      { product: 'Ergonomic Task Chairs (Model X)', sku: 'CHR-ERGO-BLK', demandedQty: 10, doneQty: 10, uom: 'units' }
    ]
  },
  {
    id: 'op-3',
    docNumber: 'INT-2026-0015',
    type: 'internal_transfer',
    title: 'Store to Production Floor Staging',
    partner: 'Internal Work Order #W-44',
    sourceLocation: 'Main Store - Bay 01',
    destLocation: 'Production Floor Rack',
    warehouse: 'Production Floor Annex',
    category: 'Raw Materials',
    status: 'ready',
    itemsCount: 1,
    totalQty: 50,
    scheduledDate: '2026-09-26',
    assignedTo: 'David Kim (Warehouse Staff)',
    details: [
      { product: 'Industrial Steel Rods (10mm)', sku: 'STL-ROD-10MM', demandedQty: 50, doneQty: 50, uom: 'kg' }
    ]
  },
  {
    id: 'op-4',
    docNumber: 'ADJ-2026-0008',
    type: 'adjustment',
    title: 'Quarterly Physical Count - Fasteners Rack',
    partner: 'Internal Audit Q3',
    sourceLocation: 'Rack B - Heavy Storage',
    destLocation: 'Discrepancy Ledger',
    warehouse: 'Main Central Warehouse',
    category: 'Hardware & Fasteners',
    status: 'done',
    itemsCount: 1,
    totalQty: -8,
    scheduledDate: '2026-09-25',
    assignedTo: 'Sarah Jenkins (Inventory Manager)',
    details: [
      { product: 'M8 Stainless Steel Hex Bolts', sku: 'BLT-SS-M8', demandedQty: 20, doneQty: 12, uom: 'pcs' }
    ]
  },
  {
    id: 'op-5',
    docNumber: 'REC-2026-0041',
    type: 'receipt',
    title: 'Sensors & Automation Components Delivery',
    partner: 'OptiSense Microtechnologies',
    sourceLocation: 'Vendor Inbound',
    destLocation: 'Rack A - Pallet 12',
    warehouse: 'Main Central Warehouse',
    category: 'Electronics & Sensors',
    status: 'done',
    itemsCount: 1,
    totalQty: 50,
    scheduledDate: '2026-09-24',
    assignedTo: 'Elena Rostova (Warehouse Staff)',
    details: [
      { product: 'Optical Sensor Unit (24V)', sku: 'SNS-OPT-24V', demandedQty: 50, doneQty: 50, uom: 'units' }
    ]
  },
  {
    id: 'op-6',
    docNumber: 'DEL-2026-0088',
    type: 'delivery',
    title: 'Bulk Export — Nexus Logistics Hub',
    partner: 'Nexus Global Distribution',
    sourceLocation: 'Main Store - Bay 01',
    destLocation: 'Customer Freight Out',
    warehouse: 'Main Central Warehouse',
    category: 'Raw Materials',
    status: 'draft',
    itemsCount: 1,
    totalQty: 80,
    scheduledDate: '2026-09-28',
    assignedTo: 'Sarah Jenkins (Inventory Manager)',
    details: [
      { product: 'Industrial Steel Rods (10mm)', sku: 'STL-ROD-10MM', demandedQty: 80, doneQty: 0, uom: 'kg' }
    ]
  }
];

export const initialLedger = [
  {
    id: 'led-1',
    timestamp: '2026-09-26 09:30:14',
    docNumber: 'INT-2026-0015',
    productName: 'Industrial Steel Rods (10mm)',
    sku: 'STL-ROD-10MM',
    moveType: 'Internal Transfer',
    fromLocation: 'Main Store - Bay 01',
    toLocation: 'Production Floor Rack',
    delta: '-50 kg / +50 kg',
    prevStock: 350,
    newStock: 350,
    user: 'David Kim',
    notes: 'Moved raw steel for shift A milling run'
  },
  {
    id: 'led-2',
    timestamp: '2026-09-25 17:15:00',
    docNumber: 'ADJ-2026-0008',
    productName: 'M8 Stainless Steel Hex Bolts',
    sku: 'BLT-SS-M8',
    moveType: 'Physical Adjustment',
    fromLocation: 'Rack B - Heavy Storage',
    toLocation: 'Loss & Scrap',
    delta: '-8 pcs',
    prevStock: 20,
    newStock: 12,
    user: 'Sarah Jenkins',
    notes: 'Physical audit: damaged during transit'
  },
  {
    id: 'led-3',
    timestamp: '2026-09-24 14:02:45',
    docNumber: 'REC-2026-0041',
    productName: 'Optical Sensor Unit (24V)',
    sku: 'SNS-OPT-24V',
    moveType: 'Vendor Receipt',
    fromLocation: 'OptiSense Vendor',
    toLocation: 'Rack A - Pallet 12',
    delta: '+50 units',
    prevStock: 35,
    newStock: 85,
    user: 'Elena Rostova',
    notes: 'Verified against PO-9921 without damages'
  },
  {
    id: 'led-4',
    timestamp: '2026-09-23 11:20:10',
    docNumber: 'DEL-2026-0085',
    productName: 'Ergonomic Task Chairs (Model X)',
    sku: 'CHR-ERGO-BLK',
    moveType: 'Customer Delivery',
    fromLocation: 'Rack A - Pallet 12',
    toLocation: 'Dispatch - FedEx Express',
    delta: '-12 units',
    prevStock: 60,
    newStock: 48,
    user: 'David Kim',
    notes: 'Sales order #SO-3091 fulfilled'
  }
];
