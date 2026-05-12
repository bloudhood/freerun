import { clearAuthSessionStorage, getSessionToken } from './session';
import { AppApiClient } from './client';

const API_MODE = (import.meta.env.VITE_API_MODE || 'local').trim().toLowerCase();
const DEFAULT_UNIRUN_API_BASE = 'https://run-lb.tanmasports.com/v1';

function normalizeBaseUrl(value) {
  return `${value || ''}`.trim().replace(/\/+$/, '');
}

function joinUrl(baseUrl, path) {
  const base = normalizeBaseUrl(baseUrl);
  if (!base) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function resolveApiBaseUrl() {
  const configuredProxy = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  const tunnelProxy = normalizeBaseUrl(import.meta.env.VITE_TUNNEL_API_BASE || '/devproxy');
  const directTarget = normalizeBaseUrl(
    import.meta.env.VITE_UNIRUN_API_BASE || DEFAULT_UNIRUN_API_BASE,
  );

  switch (API_MODE) {
    case 'domain':
      return configuredProxy || '/devproxy';
    case 'tunnel':
      return tunnelProxy || '/devproxy';
    case 'direct':
      return directTarget;
    case 'local':
    default:
      return configuredProxy || '/devproxy';
  }
}

function resolveHealthUrl(baseUrl) {
  if (API_MODE === 'local' || API_MODE === 'direct') return '';
  return joinUrl(baseUrl, '/health');
}

const apiBaseUrl = resolveApiBaseUrl();

export const appConfig = {
  appVersion: '3.6.8',
  api: {
    mode: API_MODE,
    baseUrl: apiBaseUrl,
    healthUrl: resolveHealthUrl(apiBaseUrl),
    proxyToken: import.meta.env.VITE_PROXY_TOKEN || '',
  },
  auth: {
    appKey: import.meta.env.VITE_APP_KEY || '389885588s0648fa',
    appSecret: import.meta.env.VITE_APP_SECRET || '56E39A1658455588885690425C0FD16055A21676',
  },
};

function handleAuthFailure() {
  clearAuthSessionStorage();

  if (typeof window === 'undefined') return;
  if (window.location.pathname !== '/') {
    window.location.replace('/');
  }
}

export const api = new AppApiClient({
  baseURL: appConfig.api.baseUrl,
  appVersion: appConfig.appVersion,
  appKey: appConfig.auth.appKey,
  appSecret: appConfig.auth.appSecret,
  proxyToken: appConfig.api.proxyToken,
  tokenProvider: getSessionToken,
  onAuthFailure: handleAuthFailure,
});

export { AppApiClient };
