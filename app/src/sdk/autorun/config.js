export const DEFAULT_LOCAL_AUTORUN_SERVER_BASE = 'http://127.0.0.1:5891';
export const AUTORUN_STATE_STORAGE_KEY = 'unirun.autorun_state';

export function normalizeAutorunServerBase(value) {
  return String(value || '').trim().replace(/\/+$/, '');
}

export function readAutorunState(storage) {
  if (!storage) return {};

  try {
    const raw = storage.getItem(AUTORUN_STATE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeAutorunState(storage, state) {
  if (!storage) return;

  try {
    const next = state && typeof state === 'object' ? state : {};
    if (Object.keys(next).length === 0) {
      storage.removeItem(AUTORUN_STATE_STORAGE_KEY);
      return;
    }
    storage.setItem(AUTORUN_STATE_STORAGE_KEY, JSON.stringify(next));
  } catch {}
}

export function readStoredAutorunServerBase(storage) {
  return normalizeAutorunServerBase(readAutorunState(storage).apiBaseUrl);
}

export function writeStoredAutorunServerBase(storage, value) {
  const state = readAutorunState(storage);
  const base = normalizeAutorunServerBase(value);
  if (base) {
    state.apiBaseUrl = base;
  } else {
    delete state.apiBaseUrl;
  }
  writeAutorunState(storage, state);
  return base;
}

export function resolveAutorunServerBase({
  configuredBase = '',
  storedBase = '',
  isDev = false,
} = {}) {
  const stored = normalizeAutorunServerBase(storedBase);
  if (stored) return stored;

  const configured = normalizeAutorunServerBase(configuredBase);
  if (isDev && configured) return '/autorunserver';
  return configured || DEFAULT_LOCAL_AUTORUN_SERVER_BASE;
}
