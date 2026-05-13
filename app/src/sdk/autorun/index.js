import { ref } from 'vue';
import { ApiBusinessError, AutorunClient } from './client';
import {
  readAutorunState,
  readStoredAutorunServerBase,
  resolveAutorunServerBase,
  writeAutorunState,
  writeStoredAutorunServerBase,
} from './config';

const AUTORUN_SERVER_BASE = (import.meta.env.VITE_AUTORUN_SERVER_BASE || '').trim();

function getLocalStorage() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage || null;
  } catch {
    return null;
  }
}

function resolveInitialApiBaseUrl() {
  return resolveAutorunServerBase({
    configuredBase: AUTORUN_SERVER_BASE,
    storedBase: readStoredAutorunServerBase(getLocalStorage()),
    isDev: import.meta.env.DEV,
  });
}

export const autorunServerBase = ref(resolveInitialApiBaseUrl());

export const scheduledTaskConfig = {
  get apiBaseUrl() {
    return autorunServerBase.value;
  },
};

export function getAutorunClient() {
  const baseURL = (autorunServerBase.value || '').replace(/\/+$/, '');
  return baseURL ? new AutorunClient({ baseURL }) : null;
}

function resetPingState() {
  pingMeta.value = null;
  pingReady.value = false;
  pingRequestPromise = null;
  setCachedPingMeta(null);
}

export function setAutorunServerBase(value) {
  const base = writeStoredAutorunServerBase(getLocalStorage(), value);
  autorunServerBase.value = base || resolveInitialApiBaseUrl();
  resetPingState();
  return autorunServerBase.value;
}

export function resetAutorunServerBase() {
  writeStoredAutorunServerBase(getLocalStorage(), '');
  autorunServerBase.value = resolveInitialApiBaseUrl();
  resetPingState();
  return autorunServerBase.value;
}

const getCachedPingMeta = () => {
  const value = readAutorunState(getLocalStorage()).pingMeta ?? null;
  return value && typeof value === 'object' ? value : null;
};

const setCachedPingMeta = (value) => {
  const storage = getLocalStorage();
  const state = readAutorunState(storage);
  if (!value || typeof value !== 'object') {
    delete state.pingMeta;
  } else {
    state.pingMeta = value;
  }
  writeAutorunState(storage, state);
};

export const pingMeta = ref(getCachedPingMeta());
export const pingReady = ref(false);

const pingReadyWaiters = new Set();
let pingRequestPromise = null;

export const preloadAutorunPingMeta = async () => {
  if (pingReady.value) return pingMeta.value;
  if (pingRequestPromise) return pingRequestPromise;

  pingRequestPromise = (async () => {
    const client = getAutorunClient();
    const requestBase = autorunServerBase.value;
    if (!client) {
      pingReady.value = true;
      return pingMeta.value;
    }

    try {
      const envelope = await client.ping();
      if (requestBase === autorunServerBase.value) {
        pingMeta.value = envelope?.data || null;
        setCachedPingMeta(pingMeta.value);
      }
    } catch (error) {
      console.error('Failed to preload /ping metadata:', error);
    } finally {
      pingReady.value = true;
      pingRequestPromise = null;
      pingReadyWaiters.forEach((resolve) => resolve(pingMeta.value));
      pingReadyWaiters.clear();
    }

    return pingMeta.value;
  })();

  return pingRequestPromise;
};

export const waitForAutorunPingReady = () => {
  if (pingReady.value) return Promise.resolve(pingMeta.value);
  return new Promise((resolve) => {
    pingReadyWaiters.add(resolve);
  });
};

export { ApiBusinessError, AutorunClient };
