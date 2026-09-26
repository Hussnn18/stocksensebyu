// End-to-end check of the stock flow from the brief, against a running API + MySQL.
//
//   cd backend && npm run dev          (in one terminal)
//   node scripts/verify-flow.mjs       (in another)
//
// Env: API_URL (default http://localhost:5001/api), TEST_EMAIL, TEST_PASSWORD.
// It writes real documents (receipt, transfer, delivery, adjustment) into the database,
// so run it on demo data, not on data you care about. Needs Node 18+ (built-in fetch).

const API_URL = (process.env.API_URL || 'http://localhost:5001/api').replace(/\/+$/, '');
const EMAIL = process.env.TEST_EMAIL || 'flow-test@example.com';
const PASSWORD = process.env.TEST_PASSWORD || 'flowtest123';
const SKU = 'STL-ROD-12';

let token = null;
let passed = 0;
let failed = 0;

/** Stops the run: later steps depend on this one. `reported` = its FAIL line is already printed. */
class StepFailed extends Error {
  constructor(message, { reported = false } = {}) {
    super(message);
    this.reported = reported;
  }
}

function check(condition, label, detail = '') {
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? `  (${detail})` : ''}`);
  if (condition) passed += 1;
  else failed += 1;
  return condition;
}

function mustPass(condition, label, detail) {
  if (!check(condition, label, detail)) throw new StepFailed(label, { reported: true });
}

const sameQty = (a, b) => typeof a === 'number' && Math.abs(a - b) < 0.0005;

function localDate(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function call(method, path, body) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new StepFailed(`Could not reach ${API_URL} (${error.cause?.code || error.message}). Is the backend running?`);
  }
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON body: payload stays null
  }
  return { status: response.status, body: payload, data: payload?.data };
}

/** Call and insist on one HTTP status. Quiet when it works; FAIL with the server's message when not. */
async function expectStatus(label, status, method, path, body) {
  const result = await call(method, path, body);
  if (result.status !== status) {
    check(false, label, `expected HTTP ${status}, got ${result.status}: ${result.body?.message || 'no message'}`);
    throw new StepFailed(label, { reported: true });
  }
  return result.data;
}

async function readProduct(productId) {
  const { status, data } = await call('GET', `/products/${productId}`);
  if (status !== 200) throw new StepFailed(`Could not read product ${productId} (HTTP ${status}).`);
  return data;
}

async function main() {
  console.log(`StockSense flow check against ${API_URL}\n`);
  const today = localDate();

  // --- Test account ---------------------------------------------------------
  const signup = await call('POST', '/auth/signup', { name: 'Flow Test Manager', email: EMAIL, role: 'manager', password: PASSWORD });
  mustPass(
    [201, 409].includes(signup.status),
    'sign up test manager',
    { 201: 'created', 409: 'already exists' }[signup.status] || `HTTP ${signup.status}: ${signup.body?.message || 'no message'}`
  );

  const login = await call('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  mustPass(
    login.status === 200 && Boolean(login.body?.token),
    `log in as ${EMAIL}`,
    login.status === 200 ? `role ${login.body.user?.role}` : `HTTP ${login.status}: ${login.body?.message}. Set TEST_EMAIL / TEST_PASSWORD?`
  );
  token = login.body.token;

  // --- Look up ids through the API ------------------------------------------
  const locations = await expectStatus('list locations', 200, 'GET', '/locations');
  const vendor = locations.find((l) => l.type === 'vendor');
  const customer = locations.find((l) => l.type === 'customer');
  const stock = locations.find((l) => l.name === 'WH/Stock');
  const floor = locations.find((l) => l.name === 'WH/Production Floor');
  mustPass(
    Boolean(vendor && customer && stock && floor),
    'find Vendor, Customer, WH/Stock and WH/Production Floor',
    [vendor, customer, stock, floor].map((l) => (l ? `${l.name}=${l.id}` : 'missing')).join(', ')
  );

  const products = await expectStatus('search products', 200, 'GET', `/products?search=${encodeURIComponent(SKU)}`);
  const steel = products.find((p) => p.sku === SKU);
  mustPass(Boolean(steel), `find ${SKU}`, steel ? `${steel.name}, product_id ${steel.product_id}` : 'not in /products');
  const start = steel.on_hand;
  console.log(`      ${steel.name} on hand at start: ${start} ${steel.uom}\n`);

  const refs = {};
  const steelLine = (quantity) => [{ product_id: steel.product_id, quantity }];

  // --- 1. Receipt: 100 kg Vendor → WH/Stock -----------------------------------
  let doc = await expectStatus('create receipt', 201, 'POST', '/operations', {
    type: 'receipt',
    partner_name: 'Tata Steel Ltd',
    source_location_id: vendor.id,
    dest_location_id: stock.id,
    scheduled_date: today,
    notes: 'verify-flow.mjs',
    lines: steelLine(100),
  });
  check(doc.status === 'draft' && /^WH\/IN\/\d{4,}$/.test(doc.reference), 'receipt is a draft with a WH/IN reference', `${doc.reference}, ${doc.status}`);
  refs.receipt = doc.reference;
  doc = await expectStatus(`validate ${refs.receipt}`, 200, 'POST', `/operations/${doc.id}/validate`);
  check(doc.status === 'done' && Boolean(doc.validated_at), `${refs.receipt} is done`, `validated_at ${doc.validated_at}`);
  let product = await readProduct(steel.product_id);
  check(sameQty(product.on_hand, start + 100), 'receipt adds 100 kg', `${start} → ${product.on_hand}`);

  // --- 2. Internal transfer: 100 kg WH/Stock → WH/Production Floor --------------
  doc = await expectStatus('create internal transfer', 201, 'POST', '/operations', {
    type: 'internal',
    source_location_id: stock.id,
    dest_location_id: floor.id,
    scheduled_date: today,
    lines: steelLine(100),
  });
  refs.internal = doc.reference;
  doc = await expectStatus(`confirm ${refs.internal}`, 200, 'POST', `/operations/${doc.id}/confirm`);
  check(doc.status === 'ready', `${refs.internal} is ready after confirm`, `status ${doc.status}`);
  doc = await expectStatus(`validate ${refs.internal}`, 200, 'POST', `/operations/${doc.id}/validate`);
  check(doc.status === 'done', `${refs.internal} is done`);
  product = await readProduct(steel.product_id);
  check(sameQty(product.on_hand, start + 100), 'transfer keeps the total unchanged', `on_hand ${product.on_hand}`);

  // --- 3. Delivery: 20 kg from WH/Production Floor --------------------------
  doc = await expectStatus('create delivery', 201, 'POST', '/operations', {
    type: 'delivery',
    partner_name: 'Bharat Frames',
    source_location_id: floor.id,
    dest_location_id: customer.id,
    scheduled_date: today,
    lines: steelLine(20),
  });
  refs.delivery = doc.reference;
  doc = await expectStatus(`confirm ${refs.delivery}`, 200, 'POST', `/operations/${doc.id}/confirm`);
  check(doc.status === 'ready', `${refs.delivery} is ready after confirm`, `status ${doc.status}`);
  doc = await expectStatus(`pick ${refs.delivery}`, 200, 'POST', `/operations/${doc.id}/pick`);
  check(Boolean(doc.picked_at), `${refs.delivery} has picked_at`, doc.picked_at);
  doc = await expectStatus(`pack ${refs.delivery}`, 200, 'POST', `/operations/${doc.id}/pack`);
  check(Boolean(doc.packed_at), `${refs.delivery} has packed_at`, doc.packed_at);
  doc = await expectStatus(`validate ${refs.delivery}`, 200, 'POST', `/operations/${doc.id}/validate`);
  check(doc.status === 'done', `${refs.delivery} is done`);
  product = await readProduct(steel.product_id);
  check(sameQty(product.on_hand, start + 80), 'delivery removes 20 kg', `on_hand ${product.on_hand}`);

  // --- 4. Adjustment: 3 kg damaged at WH/Production Floor --------------------
  const recorded = product.locations.find((l) => l.location_id === floor.id)?.quantity ?? 0;
  mustPass(recorded >= 3, 'WH/Production Floor has at least 3 kg to adjust', `recorded ${recorded}`);
  doc = await expectStatus('create adjustment (counted = recorded − 3)', 201, 'POST', '/adjustments', {
    location_id: floor.id,
    product_id: steel.product_id,
    counted_qty: recorded - 3,
    reason: '3 kg damaged',
  });
  refs.adjustment = doc.reference;
  check(
    doc.type === 'adjustment' && doc.status === 'done' && sameQty(doc.lines[0]?.quantity, recorded) && sameQty(doc.lines[0]?.counted_qty, recorded - 3),
    `${refs.adjustment} is done with recorded ${recorded} / counted ${recorded - 3}`,
    `${doc.source_location} → ${doc.dest_location}`
  );
  product = await readProduct(steel.product_id);
  check(sameQty(product.on_hand, start + 77), 'on_hand ended at start + 77', `${start} → ${product.on_hand}`);

  // --- Ledger ------------------------------------------------------------------
  const moves = await expectStatus('read move history', 200, 'GET', `/moves?product_id=${steel.product_id}`);
  const expectedEffect = { [refs.receipt]: 100, [refs.internal]: 0, [refs.delivery]: -20, [refs.adjustment]: -3 };
  const ours = moves.filter((m) => m.reference in expectedEffect);
  check(ours.length === 4, '4 new ledger rows for those references', ours.map((m) => `${m.reference} ${m.stock_effect}`).join(', '));
  check(
    ours.every((m) => sameQty(m.stock_effect, expectedEffect[m.reference])),
    'ledger effects are +100, 0, −20, −3'
  );

  // --- Over-delivery must be refused and roll back -----------------------------
  const before = product.on_hand;
  doc = await expectStatus('create delivery of 999999 kg', 201, 'POST', '/operations', {
    type: 'delivery',
    partner_name: 'Flow test (too much)',
    source_location_id: floor.id,
    dest_location_id: customer.id,
    scheduled_date: today,
    lines: steelLine(999999),
  });
  const bigRef = doc.reference;
  doc = await expectStatus(`confirm ${bigRef}`, 200, 'POST', `/operations/${doc.id}/confirm`);
  check(doc.status === 'waiting', `${bigRef} waits for stock after confirm`, `status ${doc.status}`);
  const refused = await call('POST', `/operations/${doc.id}/validate`);
  // The message proves it was the stock check (and its rollback) that refused it, not a missing pack step
  check(
    refused.status === 409 && /^Only .+ at WH\/Production Floor\.$/.test(refused.body?.message || ''),
    `validate ${bigRef} is refused with 409 for not enough stock`,
    `HTTP ${refused.status}: ${refused.body?.message}`
  );
  product = await readProduct(steel.product_id);
  check(sameQty(product.on_hand, before), 'on_hand unchanged after the refused validate', `${before} → ${product.on_hand}`);
  const movesAfter = await expectStatus('read move history again', 200, 'GET', `/moves?product_id=${steel.product_id}`);
  const bigMoves = movesAfter.filter((m) => m.reference === bigRef);
  check(bigMoves.length === 0, `no ledger rows for ${bigRef}`, `${bigMoves.length} rows`);
  const canceled = await call('POST', `/operations/${doc.id}/cancel`);
  check(canceled.status === 200 && canceled.data?.status === 'canceled', `cancel ${bigRef} (clean-up)`);

  // --- Dashboard ----------------------------------------------------------------
  const kpis = await expectStatus('read dashboard KPIs', 200, 'GET', '/dashboard/kpis');
  const kpiKeys = ['total_products', 'products_in_stock', 'low_stock', 'out_of_stock', 'pending_receipts', 'pending_deliveries', 'transfers_scheduled'];
  check(kpiKeys.every((k) => typeof kpis?.[k] === 'number'), 'KPIs has all 7 numbers', kpiKeys.map((k) => `${k}=${kpis?.[k]}`).join(' '));

  const todays = await expectStatus(`list operations for ${today}`, 200, 'GET', `/operations?date=${today}`);
  const listed = new Set(todays.map((o) => o.reference));
  check(
    Object.values(refs).every((r) => listed.has(r)),
    `GET /operations?date=${today} includes the 4 new documents`,
    `${todays.length} rows`
  );

  const calendar = await expectStatus('read the calendar', 200, 'GET', `/dashboard/calendar?month=${today.slice(0, 7)}`);
  const day = calendar.find((d) => d.date === today);
  check(Boolean(day) && day.done >= 4, `calendar shows today's validated documents`, day ? `scheduled ${day.scheduled}, done ${day.done}` : 'no entry for today');
}

try {
  await main();
} catch (error) {
  if (error instanceof StepFailed) {
    if (!error.reported) check(false, error.message);
    console.log('\nStopped: the remaining steps depend on the one that failed.');
  } else {
    check(false, `unexpected error: ${error.stack || error.message}`);
  }
}

console.log(`\n${failed ? 'FAIL' : 'PASS'}: ${passed} passed, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
