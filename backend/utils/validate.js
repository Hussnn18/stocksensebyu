// Small input parsers shared by the controllers. They return null for "not given",
// so callers can tell an empty input apart from a wrong one (NaN / invalid).

export const MAX_QTY = 999999999.999; // DECIMAL(12,3) in database/schema.sql

export const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

/** Quantities are stored with 3 decimals; round the same way so comparisons match MySQL. */
export const round3 = (n) => Math.round(n * 1000) / 1000;

/** "18" for 18, "18.5" for 18.5: for readable messages. */
export const formatQty = (n) => String(round3(Number(n)));

/** Query-string value as a trimmed string ('' when missing or repeated as an array). */
export const queryText = (value) => (typeof value === 'string' ? value.trim() : '');

/** Trimmed text, or null when empty. */
export function cleanText(value) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

/** Positive whole-number id, else null. */
export function parseId(value) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  const text = String(value).trim();
  if (!/^\d+$/.test(text)) return null;
  const n = Number(text);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** Number rounded to 3 decimals; null when blank, NaN when it isn't a usable number. */
export function parseQty(value) {
  if (isBlank(value)) return null;
  if (typeof value !== 'number' && typeof value !== 'string') return NaN;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? round3(n) : NaN;
}

/** true/false from a JSON boolean, 1/0 or "true"/"false"; undefined when it's something else. */
export function parseBool(value) {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return undefined;
}

/** A real calendar date written as YYYY-MM-DD. */
export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** LIKE pattern for "contains", with % and _ in the search text matched literally. */
export function containsPattern(term) {
  return `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}
