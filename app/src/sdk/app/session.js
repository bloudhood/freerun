export const APP_STATE_STORAGE_KEY = 'unirun.app_state';
const APP_SESSION_STATE_STORAGE_KEY = 'unirun.app_session_state';
const CHAT_STATE_STORAGE_KEY = 'unirun.chat_state';
const RUNTIME_TOKEN_KEY = '__unirun_runtime_token__';
const AUTH_STATE_KEYS = ['userInfo', 'runInfo', 'runStandard', 'activityInfo', 'chatUser', 'chatUserId'];

function getBrowserStorage(name) {
  if (typeof window === 'undefined') return null;
  try {
    return window[name] || null;
  } catch {
    return null;
  }
}

function readJson(storage, key) {
  if (!storage) return {};
  try {
    const raw = storage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeJson(storage, key, value) {
  if (!storage) return;
  storage.setItem(key, JSON.stringify(value || {}));
}

function omitAuthState(state = {}) {
  return Object.fromEntries(
    Object.entries(state).filter(([key]) => !AUTH_STATE_KEYS.includes(key)),
  );
}

function pickAuthState(state = {}) {
  const picked = {};
  for (const key of AUTH_STATE_KEYS) {
    if (state[key] !== undefined && state[key] !== null) picked[key] = state[key];
  }
  return picked;
}

function hasAuthState(state = {}) {
  return AUTH_STATE_KEYS.some((key) => state[key] !== undefined && state[key] !== null);
}

export function readStoredAppState() {
  const localStorage = getBrowserStorage('localStorage');
  const sessionStorage = getBrowserStorage('sessionStorage');
  const localState = readJson(localStorage, APP_STATE_STORAGE_KEY);

  if (localState.rememberLogin) return localState;

  const sessionState = readJson(sessionStorage, APP_SESSION_STATE_STORAGE_KEY);
  return {
    ...omitAuthState(localState),
    ...pickAuthState(sessionState),
  };
}

export const appStateStorage = {
  getItem(key) {
    if (key !== APP_STATE_STORAGE_KEY) return getBrowserStorage('localStorage')?.getItem(key) || null;
    return JSON.stringify(readStoredAppState());
  },
  setItem(key, value) {
    const localStorage = getBrowserStorage('localStorage');
    const sessionStorage = getBrowserStorage('sessionStorage');
    if (key !== APP_STATE_STORAGE_KEY) {
      localStorage?.setItem(key, value);
      return;
    }

    let state = {};
    try {
      state = value ? JSON.parse(value) : {};
    } catch {}

    if (state.rememberLogin) {
      writeJson(localStorage, APP_STATE_STORAGE_KEY, state);
      sessionStorage?.removeItem(APP_SESSION_STATE_STORAGE_KEY);
      return;
    }

    writeJson(localStorage, APP_STATE_STORAGE_KEY, omitAuthState(state));
    const sessionState = pickAuthState(state);
    if (hasAuthState(sessionState)) {
      writeJson(sessionStorage, APP_SESSION_STATE_STORAGE_KEY, sessionState);
    } else {
      sessionStorage?.removeItem(APP_SESSION_STATE_STORAGE_KEY);
    }
  },
  removeItem(key) {
    getBrowserStorage('localStorage')?.removeItem(key);
    if (key === APP_STATE_STORAGE_KEY) {
      getBrowserStorage('sessionStorage')?.removeItem(APP_SESSION_STATE_STORAGE_KEY);
    }
  },
};

export const setRuntimeToken = (token) => {
  if (typeof window === 'undefined') return;
  window[RUNTIME_TOKEN_KEY] = token || '';
};

export const getSessionToken = () => {
  if (typeof window !== 'undefined' && window[RUNTIME_TOKEN_KEY]) {
    return window[RUNTIME_TOKEN_KEY];
  }
  if (typeof window === 'undefined') return '';

  try {
    const appState = readStoredAppState();
    return appState?.userInfo?.oauthToken?.token || '';
  } catch {
    return '';
  }
};

export const clearAuthSessionStorage = () => {
  if (typeof window === 'undefined') return;
  window[RUNTIME_TOKEN_KEY] = '';

  const localStorage = getBrowserStorage('localStorage');
  const sessionStorage = getBrowserStorage('sessionStorage');
  const appState = omitAuthState(readJson(localStorage, APP_STATE_STORAGE_KEY));

  writeJson(localStorage, APP_STATE_STORAGE_KEY, appState);
  sessionStorage?.removeItem(APP_SESSION_STATE_STORAGE_KEY);
  localStorage?.removeItem(CHAT_STATE_STORAGE_KEY);
};
