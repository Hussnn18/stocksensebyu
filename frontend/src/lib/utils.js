import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes so a `className` prop can override a component's defaults.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const numberFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 });

export function formatQty(value) {
  return numberFormat.format(Number(value) || 0);
}

export function formatDate(value, withYear = false) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return `${formatDate(d, true)}, ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
}

// 'YYYY-MM-DD' in local time (what <input type="date"> uses).
export function toDateKey(value) {
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Login without signup names the user after their email ("riya.kapoor"), so tidy that up.
export function displayName(name) {
  const clean = (name || '').trim();
  if (!clean || /\s/.test(clean)) return clean;
  return clean
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

// 'YYYY-MM' for a date, as used by GET /dashboard/calendar?month=
export const toMonthKey = (value) => toDateKey(value).slice(0, 7);

export function initials(name) {
  const parts = displayName(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
