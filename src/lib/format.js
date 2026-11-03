/**
 * lib/format.js — display formatting shared across the product.
 * Dates use US conventions ("Dec 15, 2026"), numbers use thousands separators,
 * and system values like "legal_obligation" are shown as readable labels.
 */

const LOCALE = 'en-US';

function toDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  /* Plain YYYY-MM-DD strings are calendar dates: parse as local time, not UTC */
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "Dec 15, 2026" — returns `fallback` for empty/invalid input */
export function formatDate(value, fallback = '—') {
  const d = toDate(value);
  return d ? d.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric', year: 'numeric' }) : fallback;
}

/** "December 15, 2026" */
export function formatLongDate(value, fallback = '—') {
  const d = toDate(value);
  return d ? d.toLocaleDateString(LOCALE, { month: 'long', day: 'numeric', year: 'numeric' }) : fallback;
}

/** "Dec 15, 2026, 3:42 PM" */
export function formatDateTime(value, fallback = '—') {
  const d = toDate(value);
  return d
    ? d.toLocaleString(LOCALE, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : fallback;
}

/** "120,000" — passes non-numeric values through unchanged */
export function formatNumber(value, fallback = '—') {
  if (value == null || value === '') return fallback;
  const n = Number(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n.toLocaleString(LOCALE) : String(value);
}

const KNOWN_WORDS = {
  thirdpartysubprocessor: 'Third-party sub-processor',
  datastorage: 'Data storage',
  dataprincipalrights: 'Data Principal rights',
  datacollection: 'Data collection',
  dataprocessing: 'Data processing',
  datasharing: 'Data sharing',
  dataretention: 'Data retention',
};

/** "legal_obligation" / "Legal_Obligation" / "data-usage" → "Legal obligation" */
export function humanize(value, fallback = '—') {
  if (value == null || value === '') return fallback;
  const raw = String(value).trim();
  const key = raw.toLowerCase().replace(/[\s_-]+/g, '');
  if (KNOWN_WORDS[key]) return KNOWN_WORDS[key];
  if (!/[_-]/.test(raw) && /[a-z]/.test(raw) && /[A-Z]/.test(raw.slice(1))) return raw; // already readable (e.g. "DPO")
  const words = raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Days from today to a date (negative = past). Null when no date. */
export function daysUntil(value) {
  const d = toDate(value);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

/**
 * Download rows as a CSV file that opens directly in Excel.
 * columns: [{ header, value: (row) => any }]
 */
export function downloadCsv(filename, rows, columns) {
  const escape = (v) => {
    const s = v == null ? '' : Array.isArray(v) ? v.join('; ') : String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    columns.map(c => escape(c.header)).join(','),
    ...rows.map(row => columns.map(c => escape(c.value(row))).join(',')),
  ];
  /* BOM so Excel reads UTF-8 correctly */
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
