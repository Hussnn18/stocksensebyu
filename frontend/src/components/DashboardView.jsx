import React, { useState, useMemo } from 'react';
import { 
  Boxes, 
  Truck, 
  Layers, 
  ArrowRightLeft, 
  SlidersHorizontal, 
  History, 
  Warehouse, 
  BellRing, 
  Search, 
  Plus, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  X, 
  ChevronRight, 
  User, 
  LogOut, 
  Sparkles, 
  Zap, 
  FileText, 
  Building2, 
  ArrowLeft,
  PackageCheck,
  TrendingUp,
  Sliders,
  Check,
  MapPin,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  initialProducts, 
  initialOperations, 
  initialLedger, 
  initialWarehouses, 
  initialLocations, 
  initialCategories 
} from '../data/inventoryData';

export function DashboardView({ currentUser, onLogout, onBackToLanding }) {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); 
  // 'dashboard' | 'products' | 'receipts' | 'delivery' | 'transfers' | 'adjustments' | 'ledger' | 'warehouse_settings' | 'profile'

  // Dynamic Data State
  const [products, setProducts] = useState(initialProducts);
  const [operations, setOperations] = useState(initialOperations);
  const [ledger, setLedger] = useState(initialLedger);
  const [warehouses, setWarehouses] = useState(initialWarehouses);
  const [locations, setLocations] = useState(initialLocations);
  const [categories] = useState(initialCategories);

  // Role Toggle
  const [activeRole, setActiveRole] = useState(currentUser?.role || 'inventory_manager');

  // Dynamic Filter Bar State
  const [searchQuery, setSearchQuery] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('all'); // 'all' | 'receipt' | 'delivery' | 'internal_transfer' | 'adjustment'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'draft' | 'waiting' | 'ready' | 'done' | 'canceled'
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal Dialogs
  const [activeModal, setActiveModal] = useState(null); // 'create_receipt' | 'create_delivery' | 'internal_transfer' | 'stock_adjustment' | 'add_product' | 'view_operation'
  const [selectedOperationForView, setSelectedOperationForView] = useState(null);

  // Notifications Popover
  const [showNotifications, setShowNotifications] = useState(false);

  // Form States for Modals
  const [receiptForm, setReceiptForm] = useState({
    supplier: '',
    productId: products[0]?.id || '',
    qty: 50,
    warehouseId: warehouses[0]?.id || '',
    locationId: locations[0]?.id || ''
  });

  const [deliveryForm, setDeliveryForm] = useState({
    customer: '',
    productId: products[1]?.id || '',
    qty: 5,
    locationId: locations[1]?.id || '',
    isPicked: false,
    isPacked: false
  });

  const [transferForm, setTransferForm] = useState({
    productId: products[0]?.id || '',
    sourceLocationId: locations[0]?.id || '',
    destLocationId: locations[3]?.id || '',
    qty: 25,
    notes: 'Floor replenishment'
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: products[2]?.id || '',
    locationId: locations[2]?.id || '',
    countedQty: 10,
    reason: 'Damage scrap'
  });

  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Raw Materials',
    uom: 'kg',
    initialStock: 100,
    minAlert: 20,
    reorderQty: 50,
    unitCost: 10,
    unitPrice: 18
  });

  // Calculate KPIs
  const totalStockCount = useMemo(() => {
    return products.reduce((acc, p) => acc + p.totalStock, 0);
  }, [products]);

  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.totalStock <= p.minStockAlert);
  }, [products]);

  const pendingReceipts = useMemo(() => {
    return operations.filter(op => op.type === 'receipt' && op.status !== 'done' && op.status !== 'canceled');
  }, [operations]);

  const pendingDeliveries = useMemo(() => {
    return operations.filter(op => op.type === 'delivery' && op.status !== 'done' && op.status !== 'canceled');
  }, [operations]);

  const pendingTransfers = useMemo(() => {
    return operations.filter(op => op.type === 'internal_transfer' && op.status !== 'done' && op.status !== 'canceled');
  }, [operations]);

  // Filter Operations List
  const filteredOperations = useMemo(() => {
    return operations.filter(op => {
      const matchSearch = op.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.docNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        op.partner.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = docTypeFilter === 'all' || op.type === docTypeFilter;
      const matchStatus = statusFilter === 'all' || op.status === statusFilter;
      const matchWarehouse = warehouseFilter === 'all' || op.warehouse === warehouseFilter;
      const matchCategory = categoryFilter === 'all' || op.category === categoryFilter;

      return matchSearch && matchType && matchStatus && matchWarehouse && matchCategory;
    });
  }, [operations, searchQuery, docTypeFilter, statusFilter, warehouseFilter, categoryFilter]);

  // Filter Products List
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, categoryFilter]);

  // ACTION 1: Execute/Validate Receipt (Stock increases automatically)
  const handleValidateReceipt = (e) => {
    e.preventDefault();
    const product = products.find(p => p.id === receiptForm.productId) || products[0];
    const qtyReceived = Number(receiptForm.qty);
    const loc = locations.find(l => l.id === receiptForm.locationId) || locations[0];
    const wh = warehouses.find(w => w.id === receiptForm.warehouseId) || warehouses[0];
    const docNum = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Update Product Stock
    setProducts(prev => prev.map(p => {
      if (p.id === product.id) {
        return {
          ...p,
          totalStock: p.totalStock + qtyReceived,
          status: (p.totalStock + qtyReceived) > p.minStockAlert ? 'in_stock' : 'low_stock'
        };
      }
      return p;
    }));

    // Add Completed Operation
    const newOp = {
      id: 'op-' + Date.now(),
      docNumber: docNum,
      type: 'receipt',
      title: `Inbound Receipt from ${receiptForm.supplier || 'Vendor'}`,
      partner: receiptForm.supplier || 'Apex Metals Corp',
      sourceLocation: 'Vendor Inbound',
      destLocation: loc.name,
      warehouse: wh.name,
      category: product.category,
      status: 'done',
      itemsCount: 1,
      totalQty: qtyReceived,
      scheduledDate: new Date().toISOString().split('T')[0],
      assignedTo: `${currentUser?.name || 'Operator'} (${activeRole === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff'})`,
      details: [
        { product: product.name, sku: product.sku, demandedQty: qtyReceived, doneQty: qtyReceived, uom: product.uom }
      ]
    };
    setOperations(prev => [newOp, ...prev]);

    // Add Ledger Record
    const newLedger = {
      id: 'led-' + Date.now(),
      timestamp: new Date().toLocaleString(),
      docNumber: docNum,
      productName: product.name,
      sku: product.sku,
      moveType: 'Vendor Receipt (Inbound)',
      fromLocation: 'Vendor Dock',
      toLocation: loc.name,
      delta: `+${qtyReceived} ${product.uom}`,
      prevStock: product.totalStock,
      newStock: product.totalStock + qtyReceived,
      user: currentUser?.name || 'Operations Lead',
      notes: `Received & validated into ${loc.name}`
    };
    setLedger(prev => [newLedger, ...prev]);

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}

    setActiveModal(null);
  };

  // ACTION 2: Validate Delivery Order (Stock decreases automatically)
  const handleValidateDelivery = (e) => {
    e.preventDefault();
    const product = products.find(p => p.id === deliveryForm.productId) || products[0];
    const qtyDelivered = Number(deliveryForm.qty);
    const loc = locations.find(l => l.id === deliveryForm.locationId) || locations[0];
    const docNum = `DEL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    if (product.totalStock < qtyDelivered) {
      alert(`Cannot deliver ${qtyDelivered} ${product.uom}. Only ${product.totalStock} ${product.uom} in stock!`);
      return;
    }

    // Update Product Stock
    setProducts(prev => prev.map(p => {
      if (p.id === product.id) {
        const newStock = Math.max(0, p.totalStock - qtyDelivered);
        return {
          ...p,
          totalStock: newStock,
          status: newStock === 0 ? 'out_of_stock' : newStock <= p.minStockAlert ? 'low_stock' : 'in_stock'
        };
      }
      return p;
    }));

    // Add Completed Operation
    const newOp = {
      id: 'op-' + Date.now(),
      docNumber: docNum,
      type: 'delivery',
      title: `Client Delivery: ${deliveryForm.customer || 'Customer'}`,
      partner: deliveryForm.customer || 'Metro Tech Enterprises',
      sourceLocation: loc.name,
      destLocation: 'Customer Freight Out',
      warehouse: 'Main Central Warehouse',
      category: product.category,
      status: 'done',
      itemsCount: 1,
      totalQty: qtyDelivered,
      scheduledDate: new Date().toISOString().split('T')[0],
      assignedTo: `${currentUser?.name || 'Operator'}`,
      details: [
        { product: product.name, sku: product.sku, demandedQty: qtyDelivered, doneQty: qtyDelivered, uom: product.uom }
      ]
    };
    setOperations(prev => [newOp, ...prev]);

    // Add Ledger Record
    const newLedger = {
      id: 'led-' + Date.now(),
      timestamp: new Date().toLocaleString(),
      docNumber: docNum,
      productName: product.name,
      sku: product.sku,
      moveType: 'Customer Delivery (Outbound)',
      fromLocation: loc.name,
      toLocation: 'Customer Freight Out',
      delta: `-${qtyDelivered} ${product.uom}`,
      prevStock: product.totalStock,
      newStock: product.totalStock - qtyDelivered,
      user: currentUser?.name || 'Operations Lead',
      notes: `Picked, packed and dispatched to ${deliveryForm.customer || 'Client'}`
    };
    setLedger(prev => [newLedger, ...prev]);

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (e) {}

    setActiveModal(null);
  };

  // ACTION 3: Internal Transfer (Move stock inside company, total unchanged, location updated)
  const handleValidateTransfer = (e) => {
    e.preventDefault();
    const product = products.find(p => p.id === transferForm.productId) || products[0];
    const qtyTransfer = Number(transferForm.qty);
    const srcLoc = locations.find(l => l.id === transferForm.sourceLocationId) || locations[0];
    const dstLoc = locations.find(l => l.id === transferForm.destLocationId) || locations[1];
    const docNum = `INT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOp = {
      id: 'op-' + Date.now(),
      docNumber: docNum,
      type: 'internal_transfer',
      title: `Internal Move: ${srcLoc.name} ➔ ${dstLoc.name}`,
      partner: 'Internal Warehouse Work Order',
      sourceLocation: srcLoc.name,
      destLocation: dstLoc.name,
      warehouse: 'Main Central Warehouse',
      category: product.category,
      status: 'done',
      itemsCount: 1,
      totalQty: qtyTransfer,
      scheduledDate: new Date().toISOString().split('T')[0],
      assignedTo: `${currentUser?.name || 'Floor Staff'}`,
      details: [
        { product: product.name, sku: product.sku, demandedQty: qtyTransfer, doneQty: qtyTransfer, uom: product.uom }
      ]
    };
    setOperations(prev => [newOp, ...prev]);

    const newLedger = {
      id: 'led-' + Date.now(),
      timestamp: new Date().toLocaleString(),
      docNumber: docNum,
      productName: product.name,
      sku: product.sku,
      moveType: 'Internal Rack Transfer',
      fromLocation: srcLoc.name,
      toLocation: dstLoc.name,
      delta: `±${qtyTransfer} ${product.uom} (Internal)`,
      prevStock: product.totalStock,
      newStock: product.totalStock,
      user: currentUser?.name || 'Floor Staff',
      notes: transferForm.notes || 'Pallet rack relocation'
    };
    setLedger(prev => [newLedger, ...prev]);

    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch (e) {}

    setActiveModal(null);
  };

  // ACTION 4: Physical Count Adjustment
  const handleValidateAdjustment = (e) => {
    e.preventDefault();
    const product = products.find(p => p.id === adjustmentForm.productId) || products[0];
    const counted = Number(adjustmentForm.countedQty);
    const loc = locations.find(l => l.id === adjustmentForm.locationId) || locations[0];
    const diff = counted - product.totalStock;
    const docNum = `ADJ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    // Update Product Stock to match counted quantity
    setProducts(prev => prev.map(p => {
      if (p.id === product.id) {
        return {
          ...p,
          totalStock: counted,
          status: counted === 0 ? 'out_of_stock' : counted <= p.minStockAlert ? 'low_stock' : 'in_stock'
        };
      }
      return p;
    }));

    // Add Completed Operation
    const newOp = {
      id: 'op-' + Date.now(),
      docNumber: docNum,
      type: 'adjustment',
      title: `Physical Audit Adjustment: ${product.name}`,
      partner: 'Physical Audit Team',
      sourceLocation: loc.name,
      destLocation: diff >= 0 ? 'Surplus Recovery' : 'Discrepancy / Scrap',
      warehouse: 'Main Central Warehouse',
      category: product.category,
      status: 'done',
      itemsCount: 1,
      totalQty: diff,
      scheduledDate: new Date().toISOString().split('T')[0],
      assignedTo: `${currentUser?.name || 'Inventory Manager'}`,
      details: [
        { product: product.name, sku: product.sku, demandedQty: product.totalStock, doneQty: counted, uom: product.uom }
      ]
    };
    setOperations(prev => [newOp, ...prev]);

    // Add Ledger Record
    const newLedger = {
      id: 'led-' + Date.now(),
      timestamp: new Date().toLocaleString(),
      docNumber: docNum,
      productName: product.name,
      sku: product.sku,
      moveType: 'Physical Count Adjustment',
      fromLocation: loc.name,
      toLocation: diff >= 0 ? 'Count Surplus' : 'Damage Scrap',
      delta: `${diff > 0 ? '+' : ''}${diff} ${product.uom}`,
      prevStock: product.totalStock,
      newStock: counted,
      user: currentUser?.name || 'Inventory Manager',
      notes: `Counted ${counted} vs book ${product.totalStock}. Reason: ${adjustmentForm.reason}`
    };
    setLedger(prev => [newLedger, ...prev]);

    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch (e) {}

    setActiveModal(null);
  };

  // ACTION 5: Add New Product
  const handleCreateProduct = (e) => {
    e.preventDefault();
    const newProd = {
      id: 'prod-' + Date.now(),
      name: productForm.name || 'New Warehouse Item',
      sku: productForm.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: productForm.category,
      categoryId: 'cat-1',
      uom: productForm.uom,
      totalStock: Number(productForm.initialStock),
      minStockAlert: Number(productForm.minAlert),
      reorderQty: Number(productForm.reorderQty),
      unitCost: Number(productForm.unitCost),
      unitPrice: Number(productForm.unitPrice),
      status: Number(productForm.initialStock) <= Number(productForm.minAlert) ? 'low_stock' : 'in_stock',
      locationBreakdown: [
        { locationId: 'loc-1', locationName: 'Main Store - Bay 01', qty: Number(productForm.initialStock) }
      ]
    };

    setProducts(prev => [newProd, ...prev]);

    // Log initial stock creation to ledger if initial stock > 0
    if (Number(productForm.initialStock) > 0) {
      setLedger(prev => [
        {
          id: 'led-' + Date.now(),
          timestamp: new Date().toLocaleString(),
          docNumber: `INIT-${newProd.sku}`,
          productName: newProd.name,
          sku: newProd.sku,
          moveType: 'Initial Product Registration',
          fromLocation: 'System Setup',
          toLocation: 'Main Store - Bay 01',
          delta: `+${newProd.totalStock} ${newProd.uom}`,
          prevStock: 0,
          newStock: newProd.totalStock,
          user: currentUser?.name || 'Manager',
          notes: 'Master catalog item created with initial opening stock'
        },
        ...prev
      ]);
    }

    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch (e) {}

    setActiveModal(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900 font-sans">
      
      {/* 1. LEFT SIDEBAR (Matching prompt specs) */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 hidden md:flex sticky top-0 h-screen z-20">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={onBackToLanding}>
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-base text-slate-900 tracking-tight">StockSense</span>
                <span className="text-[10px] ml-1 bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">IMS</span>
                <div className="text-[10px] text-slate-400">Next.js Enterprise OS</div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
            
            {/* Core Overview */}
            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Overview
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Dashboard KPIs</span>
              </button>
            </div>

            {/* Section 1: Products */}
            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                1. Products
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => setActiveTab('products')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'products'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Boxes className="w-4 h-4 text-blue-600" />
                    <span>Product Catalog</span>
                  </div>
                  <span className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                    {products.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('products')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <Sliders className="w-4 h-4 text-slate-400" />
                  <span>Reordering Rules</span>
                </button>
              </div>
            </div>

            {/* Section 2: Operations */}
            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                2. Operations
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => { setActiveTab('receipts'); setDocTypeFilter('receipt'); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'receipts'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>1. Receipts (Inbound)</span>
                  </div>
                  {pendingReceipts.length > 0 && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.2 rounded-full font-bold">
                      {pendingReceipts.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveTab('delivery'); setDocTypeFilter('delivery'); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'delivery'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>2. Delivery Orders</span>
                  </div>
                  {pendingDeliveries.length > 0 && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full font-bold">
                      {pendingDeliveries.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => { setActiveTab('transfers'); setDocTypeFilter('internal_transfer'); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'transfers'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ArrowRightLeft className="w-4 h-4 text-cyan-600" />
                    <span>3. Internal Transfers</span>
                  </div>
                </button>

                <button
                  onClick={() => { setActiveTab('adjustments'); setDocTypeFilter('adjustment'); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'adjustments'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                    <span>4. Stock Adjustment</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('ledger')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'ledger'
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <History className="w-4 h-4 text-blue-700" />
                    <span>5. Move History (Ledger)</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Section 3: Settings */}
            <div>
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Settings & Topology
              </div>
              <button
                onClick={() => setActiveTab('warehouse_settings')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'warehouse_settings'
                    ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Warehouse className="w-4 h-4 text-slate-600" />
                <span>Warehouse & Locations</span>
              </button>
            </div>

          </div>
        </div>

        {/* Profile Menu in Left Sidebar (Bottom) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 to-blue-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                {currentUser?.name?.charAt(0) || 'S'}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[110px]">
                  {currentUser?.name || 'Sarah Jenkins'}
                </div>
                <div className="text-[10px] text-blue-600 font-semibold capitalize">
                  {activeRole.replace('_', ' ')}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onBackToLanding}
            className="w-full text-center text-xs text-slate-500 hover:text-blue-600 font-medium py-1 flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Landing Page</span>
          </button>
        </div>
      </aside>

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-10">
          
          {/* Search Input */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search SKU, document #, receipt, transfer, or partner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-3">
            
            {/* Role Switcher Pill */}
            <div className="hidden sm:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveRole('inventory_manager')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeRole === 'inventory_manager'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                👔 Manager
              </button>
              <button
                onClick={() => setActiveRole('warehouse_staff')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeRole === 'warehouse_staff'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📦 Staff
              </button>
            </div>

            {/* Quick Actions Dropdown / Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveModal('create_receipt')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Receipt</span>
              </button>

              <button
                onClick={() => setActiveModal('create_delivery')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+ Delivery</span>
              </button>

              <button
                onClick={() => setActiveModal('internal_transfer')}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Transfer</span>
              </button>

              <button
                onClick={() => setActiveModal('stock_adjustment')}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Adjust</span>
              </button>
            </div>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl relative cursor-pointer"
              >
                <BellRing className="w-4 h-4" />
                {lowStockProducts.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 absolute top-1.5 right-1.5 animate-pulse"></span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 text-left animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                    <span className="text-xs font-bold text-slate-900">Stock Alerts & Notices</span>
                    <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                      {lowStockProducts.length} Action Needed
                    </span>
                  </div>
                  <div className="space-y-2">
                    {lowStockProducts.map(p => (
                      <div key={p.id} className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                        <div className="font-bold text-amber-900 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>{p.name}</span>
                        </div>
                        <div className="text-[11px] text-amber-700 mt-0.5">
                          Current Stock: <strong>{p.totalStock} {p.uom}</strong> (Safety Min: {p.minStockAlert} {p.uom})
                        </div>
                        <button
                          onClick={() => {
                            setReceiptForm({ ...receiptForm, productId: p.id, qty: p.reorderQty });
                            setActiveModal('create_receipt');
                            setShowNotifications(false);
                          }}
                          className="mt-2 text-[10px] bg-blue-600 text-white font-bold px-2 py-1 rounded-md cursor-pointer hover:bg-blue-700"
                        >
                          Draft Reorder PO (+{p.reorderQty} {p.uom})
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Dynamic Filters Bar */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filters:
            </span>

            {/* Document Type Filter */}
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Doc Type: All</option>
              <option value="receipt">Receipts (Incoming)</option>
              <option value="delivery">Delivery Orders (Outgoing)</option>
              <option value="internal_transfer">Internal Transfers</option>
              <option value="adjustment">Stock Adjustments</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Status: All</option>
              <option value="draft">Draft</option>
              <option value="waiting">Waiting</option>
              <option value="ready">Ready</option>
              <option value="done">Done</option>
              <option value="canceled">Canceled</option>
            </select>

            {/* Warehouse Filter */}
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Warehouse: All (3 Sites)</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.name}>{w.name}</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">Category: All</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {(docTypeFilter !== 'all' || statusFilter !== 'all' || warehouseFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setDocTypeFilter('all');
                  setStatusFilter('all');
                  setWarehouseFilter('all');
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
                className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

        </div>

        {/* Dashboard Content Container */}
        <div className="p-4 sm:p-8 space-y-6 text-left">
          
          {/* VIEW 1: DASHBOARD OVERVIEW & KPIS */}
          {activeTab === 'dashboard' && (
            <>
              {/* Dashboard KPIs Row (5 KPIs matching prompt) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                {/* KPI 1: Total Products in Stock */}
                <div 
                  onClick={() => setActiveTab('products')}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold">Total In Stock</span>
                    <Boxes className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {totalStockCount} <span className="text-xs font-normal text-slate-500">units</span>
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Across {products.length} active SKUs
                  </div>
                </div>

                {/* KPI 2: Low Stock / Out of Stock */}
                <div 
                  onClick={() => { setActiveTab('products'); setCategoryFilter('all'); }}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold">Low / Out of Stock</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-amber-600 font-mono">
                    {lowStockProducts.length} <span className="text-xs font-normal text-slate-500">items</span>
                  </div>
                  <div className="text-[11px] text-amber-700 bg-amber-50 font-bold px-1.5 py-0.5 rounded inline-block mt-1">
                    Safety threshold reached
                  </div>
                </div>

                {/* KPI 3: Pending Receipts */}
                <div 
                  onClick={() => { setActiveTab('receipts'); setDocTypeFilter('receipt'); }}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold">Pending Receipts</span>
                    <Truck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {pendingReceipts.length} <span className="text-xs font-normal text-slate-500">Inbound POs</span>
                  </div>
                  <div className="text-[11px] text-indigo-600 font-semibold mt-1">
                    Vendor arrivals scheduled
                  </div>
                </div>

                {/* KPI 4: Pending Deliveries */}
                <div 
                  onClick={() => { setActiveTab('delivery'); setDocTypeFilter('delivery'); }}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold">Pending Deliveries</span>
                    <Layers className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {pendingDeliveries.length} <span className="text-xs font-normal text-slate-500">Customer Orders</span>
                  </div>
                  <div className="text-[11px] text-emerald-600 font-semibold mt-1">
                    Ready for pick & pack
                  </div>
                </div>

                {/* KPI 5: Internal Transfers Scheduled */}
                <div 
                  onClick={() => { setActiveTab('transfers'); setDocTypeFilter('internal_transfer'); }}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-cyan-400 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold">Internal Transfers</span>
                    <ArrowRightLeft className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {pendingTransfers.length} <span className="text-xs font-normal text-slate-500">Rack moves</span>
                  </div>
                  <div className="text-[11px] text-cyan-600 font-semibold mt-1">
                    Main Store ➔ Production
                  </div>
                </div>

              </div>

              {/* Active Operations Ledger Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900">Recent Operations & Stock Documents</h3>
                    <p className="text-xs text-slate-500">Live feed of receipts, delivery dispatches, transfers, and physical audits</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveModal('create_receipt')}
                      className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-3 py-1.5 rounded-lg border border-blue-200 cursor-pointer"
                    >
                      + Quick Operation
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3.5 pl-5">Document #</th>
                        <th className="p-3.5">Operation Type</th>
                        <th className="p-3.5">Partner / Description</th>
                        <th className="p-3.5">Route (From ➔ To)</th>
                        <th className="p-3.5">Qty</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right pr-5">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredOperations.map((op) => {
                        return (
                          <tr key={op.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3.5 pl-5 font-mono font-bold text-slate-900">
                              {op.docNumber}
                            </td>
                            <td className="p-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                                op.type === 'receipt'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : op.type === 'delivery'
                                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                  : op.type === 'internal_transfer'
                                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {op.type === 'receipt' && <Truck className="w-3 h-3" />}
                                {op.type === 'delivery' && <Layers className="w-3 h-3" />}
                                {op.type === 'internal_transfer' && <ArrowRightLeft className="w-3 h-3" />}
                                {op.type === 'adjustment' && <SlidersHorizontal className="w-3 h-3" />}
                                <span className="capitalize">{op.type.replace('_', ' ')}</span>
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-800">
                              <div className="font-semibold">{op.title}</div>
                              <div className="text-[11px] text-slate-400">{op.partner}</div>
                            </td>
                            <td className="p-3.5 text-slate-600 font-mono text-[11px]">
                              {op.sourceLocation} ➔ {op.destLocation}
                            </td>
                            <td className="p-3.5 font-bold text-slate-900 font-mono">
                              {op.totalQty > 0 ? `+${op.totalQty}` : op.totalQty} units
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                op.status === 'done'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : op.status === 'ready'
                                  ? 'bg-blue-100 text-blue-800'
                                  : op.status === 'waiting'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {op.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-right pr-5">
                              <button
                                onClick={() => {
                                  setSelectedOperationForView(op);
                                  setActiveModal('view_operation');
                                }}
                                className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                              >
                                View / Audit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          )}

          {/* VIEW 2: PRODUCT CATALOG & SKUs */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Product Management & Master Data</h2>
                  <p className="text-xs text-slate-500">Create products with SKU, UoM, reorder rules & location availability</p>
                </div>

                <button
                  onClick={() => setActiveModal('add_product')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Product</span>
                </button>
              </div>

              {/* Products Grid / Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3.5 pl-5">SKU / Code</th>
                        <th className="p-3.5">Product Name</th>
                        <th className="p-3.5">Category</th>
                        <th className="p-3.5">UoM</th>
                        <th className="p-3.5">Current Stock</th>
                        <th className="p-3.5">Min Alert Limit</th>
                        <th className="p-3.5">Unit Price</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right pr-5">Quick Move</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredProducts.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 pl-5 font-mono font-bold text-blue-700">
                            {p.sku}
                          </td>
                          <td className="p-3.5 text-slate-900 font-semibold">
                            {p.name}
                          </td>
                          <td className="p-3.5 text-slate-600">
                            {p.category}
                          </td>
                          <td className="p-3.5 font-mono text-slate-500">
                            {p.uom}
                          </td>
                          <td className="p-3.5 font-mono font-black text-slate-900 text-sm">
                            {p.totalStock} <span className="text-xs font-normal text-slate-400">{p.uom}</span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-500">
                            {p.minStockAlert} {p.uom}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-700">
                            ${p.unitPrice.toFixed(2)}
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.status === 'in_stock'
                                ? 'bg-emerald-100 text-emerald-800'
                                : p.status === 'low_stock'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {p.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3.5 text-right pr-5">
                            <button
                              onClick={() => {
                                setTransferForm({ ...transferForm, productId: p.id });
                                setActiveModal('internal_transfer');
                              }}
                              className="text-xs bg-slate-100 hover:bg-blue-600 hover:text-white px-2.5 py-1 rounded-lg transition-colors font-semibold cursor-pointer"
                            >
                              Transfer ➔
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 3: MOVE HISTORY & STOCK LEDGER */}
          {activeTab === 'ledger' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-slate-900">Stock Ledger & Audit Trail</h2>
                  <p className="text-xs text-slate-500">Immutable ledger log tracking every single inbound, outbound, transfer, and adjustment</p>
                </div>
                <div className="text-xs font-mono bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Audit Compliant • 100% Integrity</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3.5 pl-5">Timestamp</th>
                        <th className="p-3.5">Ref Document #</th>
                        <th className="p-3.5">Product / SKU</th>
                        <th className="p-3.5">Movement Type</th>
                        <th className="p-3.5">From ➔ To Location</th>
                        <th className="p-3.5">Stock Delta</th>
                        <th className="p-3.5">Operator</th>
                        <th className="p-3.5 text-right pr-5">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {ledger.map(l => (
                        <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 pl-5 font-mono text-slate-500 text-[11px]">
                            {l.timestamp}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-blue-700">
                            {l.docNumber}
                          </td>
                          <td className="p-3.5 font-semibold text-slate-900">
                            <div>{l.productName}</div>
                            <div className="text-[10px] font-mono text-slate-400">{l.sku}</div>
                          </td>
                          <td className="p-3.5 text-slate-700 font-medium">
                            {l.moveType}
                          </td>
                          <td className="p-3.5 font-mono text-[11px] text-slate-600">
                            {l.fromLocation} ➔ {l.toLocation}
                          </td>
                          <td className="p-3.5 font-mono font-bold">
                            <span className={`px-2 py-0.5 rounded text-[11px] ${
                              l.delta.startsWith('+')
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : l.delta.startsWith('-')
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {l.delta}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-700 font-medium">
                            {l.user}
                          </td>
                          <td className="p-3.5 text-slate-500 text-[11px] text-right pr-5">
                            {l.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: WAREHOUSE SETTINGS & TOPOLOGY */}
          {activeTab === 'warehouse_settings' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Warehouse & Spatial Topology</h2>
                <p className="text-xs text-slate-500">Configure central stores, production annexes, aisles, racks, and bays</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {warehouses.map(wh => (
                  <div key={wh.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-5 h-5 text-blue-600" />
                        <span className="font-bold text-slate-900">{wh.name}</span>
                      </div>
                      <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                        {wh.code}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div>📍 {wh.address}, {wh.city}</div>
                      <div className="text-emerald-600 font-semibold">● Active Facility</div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-bold uppercase text-slate-400 mb-2">Assigned Zones & Racks</div>
                      <div className="flex flex-wrap gap-1.5">
                        {locations.filter(l => l.warehouseId === wh.id).map(loc => (
                          <span key={loc.id} className="bg-slate-100 text-slate-700 text-[10px] font-mono px-2 py-0.5 rounded">
                            {loc.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* 3. MODALS (Receipts, Deliveries, Transfers, Adjustments, Products) */}

      {/* MODAL 1: Create Receipt (Incoming Stock) */}
      {activeModal === 'create_receipt' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 text-left relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Create Inbound Receipt</h3>
                <p className="text-xs text-slate-500">Vendor delivery ➔ Validates & automatically increases stock</p>
              </div>
            </div>

            <form onSubmit={handleValidateReceipt} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Supplier / Vendor Name</label>
                <input
                  type="text"
                  required
                  placeholder="Apex Metals & Alloy Corp"
                  value={receiptForm.supplier}
                  onChange={(e) => setReceiptForm({ ...receiptForm, supplier: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Product</label>
                <select
                  value={receiptForm.productId}
                  onChange={(e) => setReceiptForm({ ...receiptForm, productId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Current: {p.totalStock} {p.uom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity Received</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={receiptForm.qty}
                    onChange={(e) => setReceiptForm({ ...receiptForm, qty: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination Shelf/Rack</label>
                  <select
                    value={receiptForm.locationId}
                    onChange={(e) => setReceiptForm({ ...receiptForm, locationId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-800 border border-emerald-200">
                <strong>Inventory Impact:</strong> Stock will increase by <strong>+{receiptForm.qty}</strong> and an automatic entry will be stamped into the immutable Stock Ledger.
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Validate & Increase Stock (+{receiptForm.qty})</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Delivery Order (Outgoing Stock) */}
      {activeModal === 'create_delivery' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 text-left relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Create Outbound Delivery Order</h3>
                <p className="text-xs text-slate-500">Pick ➔ Pack ➔ Validate (Stock decreases automatically)</p>
              </div>
            </div>

            <form onSubmit={handleValidateDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer / Destination Client</label>
                <input
                  type="text"
                  required
                  placeholder="Metro Tech Enterprises"
                  value={deliveryForm.customer}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, customer: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Product</label>
                <select
                  value={deliveryForm.productId}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, productId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Available: {p.totalStock} {p.uom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Deliver</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={deliveryForm.qty}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, qty: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source Pick Rack</label>
                  <select
                    value={deliveryForm.locationId}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, locationId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Warehouse Staff Pick & Pack Checkboxes */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-slate-700">Warehouse Staff Verification Flow:</div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryForm.isPicked}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, isPicked: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>1. Item picked from designated rack location</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliveryForm.isPacked}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, isPacked: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>2. Cartons packed, labeled & verified</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Validate & Deduct Stock (-{deliveryForm.qty})</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Internal Transfer */}
      {activeModal === 'internal_transfer' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 text-left relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Execute Internal Stock Transfer</h3>
                <p className="text-xs text-slate-500">Main Store ➔ Production Rack (Total stock unchanged)</p>
              </div>
            </div>

            <form onSubmit={handleValidateTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product</label>
                <select
                  value={transferForm.productId}
                  onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Available: {p.totalStock} {p.uom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source Location</label>
                  <select
                    value={transferForm.sourceLocationId}
                    onChange={(e) => setTransferForm({ ...transferForm, sourceLocationId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Destination Location</label>
                  <select
                    value={transferForm.destLocationId}
                    onChange={(e) => setTransferForm({ ...transferForm, destLocationId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantity to Relocate</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={transferForm.qty}
                  onChange={(e) => setTransferForm({ ...transferForm, qty: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Execute Transfer & Update Rack Ledger</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Stock Adjustment (Fix Counted vs Book) */}
      {activeModal === 'stock_adjustment' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 text-left relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Physical Stock Adjustment</h3>
                <p className="text-xs text-slate-500">Correct mismatches between counted inventory and book records</p>
              </div>
            </div>

            <form onSubmit={handleValidateAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product to Audit</label>
                <select
                  value={adjustmentForm.productId}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, productId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — Recorded: {p.totalStock} {p.uom}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Actual Counted Quantity</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={adjustmentForm.countedQty}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, countedQty: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Discrepancy Reason</label>
                  <select
                    value={adjustmentForm.reason}
                    onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Damage scrap">Damage / Transit Scrap</option>
                    <option value="Physical count audit">Periodic Cycle Count</option>
                    <option value="Supplier packaging error">Supplier Packaging Variance</option>
                    <option value="Found surplus">Found Untracked Surplus</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Save Adjustment & Sync Book Stock</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Add New Product */}
      {activeModal === 'add_product' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 text-left relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Create New Catalog Product</h3>
                <p className="text-xs text-slate-500">Name, SKU/Code, Category, Unit of Measure & Reorder Alert</p>
              </div>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heavy Duty Steel Angles (50mm)"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SKU / Barcode Code</label>
                  <input
                    type="text"
                    required
                    placeholder="STL-ANG-50MM"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure</label>
                  <select
                    value={productForm.uom}
                    onChange={(e) => setProductForm({ ...productForm, uom: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="units">units (Pieces)</option>
                    <option value="pcs">pcs (Fasteners)</option>
                    <option value="meters">meters (Lengths)</option>
                    <option value="boxes">boxes (Cartons)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.initialStock}
                    onChange={(e) => setProductForm({ ...productForm, initialStock: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Min Alert Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.minAlert}
                    onChange={(e) => setProductForm({ ...productForm, minAlert: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Save Product to Catalog</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: View Operation Audit Details */}
      {activeModal === 'view_operation' && selectedOperationForView && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 text-left relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs font-mono text-blue-600 mb-1 font-bold">
              <span>{selectedOperationForView.docNumber}</span>
              <span className="bg-blue-100 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-blue-800">
                {selectedOperationForView.type}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-3">{selectedOperationForView.title}</h3>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Partner / Supplier:</span>
                <span className="font-bold text-slate-800">{selectedOperationForView.partner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Route:</span>
                <span className="font-mono text-slate-800">{selectedOperationForView.sourceLocation} ➔ {selectedOperationForView.destLocation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Operator:</span>
                <span className="font-semibold text-slate-800">{selectedOperationForView.assignedTo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Date:</span>
                <span className="font-mono text-slate-800">{selectedOperationForView.scheduledDate}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="text-xs font-bold text-slate-700 mb-2">Item Line Items:</div>
              <div className="space-y-1.5">
                {selectedOperationForView.details.map((d, i) => (
                  <div key={i} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{d.product}</div>
                      <div className="text-[10px] font-mono text-slate-400">{d.sku}</div>
                    </div>
                    <div className="font-mono font-bold text-blue-700">
                      {d.doneQty} / {d.demandedQty} {d.uom}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
