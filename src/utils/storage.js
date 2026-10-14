// Small localStorage wrappers. Everything is per-browser; failures are ignored.

const DRAFT_KEY = 'tf-pi-builder:draft';
const HISTORY_KEY = 'tf-pi-builder:history';
const HISTORY_LIMIT = 100;

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked */
  }
}

export const loadDraft = () => read(DRAFT_KEY, null);
export const saveDraft = (data) => write(DRAFT_KEY, data);

export const loadHistory = () => read(HISTORY_KEY, []);

export function addToHistory(data, grandTotal) {
  const entry = { ...data, grandTotal, savedAt: new Date().toISOString() };
  // One entry per PI number — re-downloading replaces the older copy.
  const history = loadHistory().filter((h) => h.piNumber !== data.piNumber);
  const next = [entry, ...history].slice(0, HISTORY_LIMIT);
  write(HISTORY_KEY, next);
  return next;
}

export function removeFromHistory(piNumber) {
  const next = loadHistory().filter((h) => h.piNumber !== piNumber);
  write(HISTORY_KEY, next);
  return next;
}
