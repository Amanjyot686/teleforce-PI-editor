// Calculation, formatting and amount-in-words helpers for the Proforma Invoice.

export const GST_RATE = 0.18;
// Garuda Advertising is registered in Gujarat (state code 24).
export const SELLER_STATE_CODE = '24';

const ONES = [
  '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

function belowHundred(n) {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  const o = ONES[n % 10];
  return o ? `${t}-${o}` : t;
}

function belowThousand(n) {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts = [];
  if (h) parts.push(`${ONES[h]} hundred`);
  if (rest) parts.push(belowHundred(rest));
  return parts.join(' ');
}

// Indian numbering system: crore, lakh, thousand, hundred.
export function numberToIndianWords(num) {
  let n = Math.floor(Math.abs(num));
  if (n === 0) return 'zero';

  const parts = [];
  const crore = Math.floor(n / 1e7);
  n %= 1e7;
  const lakh = Math.floor(n / 1e5);
  n %= 1e5;
  const thousand = Math.floor(n / 1e3);
  n %= 1e3;

  // Amounts above 99 crore are expressed as "<x> crore", recursively.
  if (crore) parts.push(`${numberToIndianWords(crore)} crore`);
  if (lakh) parts.push(`${belowHundred(lakh)} lakh`);
  if (thousand) parts.push(`${belowHundred(thousand)} thousand`);
  if (n) parts.push(belowThousand(n));
  return parts.join(' ');
}

// e.g. 23010 -> "INR- Twenty-three thousand ten rupees only./"
export function amountInWords(amount) {
  const words = numberToIndianWords(amount);
  const sentence = words.charAt(0).toUpperCase() + words.slice(1);
  return `INR- ${sentence} rupees only./`;
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatINR = (value) => inrFormatter.format(Number(value) || 0);

export const toNumber = (value) => {
  const n = parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function rowAmount(row) {
  return round2(toNumber(row.qty) * toNumber(row.rate));
}

export function computeTotals(items, taxMode) {
  const total = round2(items.reduce((sum, row) => sum + rowAmount(row), 0));
  const tax = round2(total * GST_RATE);
  const half = round2(tax / 2);
  return {
    total,
    tax,
    cgst: half,
    sgst: round2(tax - half),
    taxMode,
    grandTotal: Math.round(total + tax),
  };
}

// Intra-state (buyer GSTIN starts with seller's state code) -> CGST + SGST, else IGST.
export function detectTaxMode(gstin) {
  const code = (gstin || '').trim().slice(0, 2);
  return code === SELLER_STATE_CODE ? 'CGST_SGST' : 'IGST';
}

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const isValidGSTIN = (gstin) => GSTIN_RE.test((gstin || '').trim().toUpperCase());

// "2026-10-13" -> "13/10/2026"
export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Indian financial year for a date, e.g. 2026-10-13 -> "26-27"
export function financialYear(iso) {
  const d = iso ? new Date(iso) : new Date();
  const y = d.getFullYear();
  const start = d.getMonth() >= 3 ? y : y - 1;
  return `${String(start).slice(2)}-${String(start + 1).slice(2)}`;
}

export function safeFileName(...parts) {
  return parts
    .filter(Boolean)
    .join(' ')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

let idSeq = 0;
export const newItem = (patch = {}) => ({
  id: `${Date.now().toString(36)}-${idSeq++}`,
  description: '',
  qty: '',
  rate: '',
  ...patch,
});
