const DEFAULT_ALLOWED_HEADERS = 'Content-Type, appKey, sign, token, Authorization, X-Proxy-Token';
const DEFAULT_ALLOWED_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';

function normalizeOrigin(value) {
  return `${value || ''}`.trim().replace(/\/+$/, '');
}

function parseAllowList(value) {
  return `${value || ''}`
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
}

function getHeader(headers, name) {
  if (!headers) return '';
  if (typeof headers.get === 'function') return headers.get(name) || '';

  const wanted = name.toLowerCase();
  const key = Object.keys(headers).find((item) => item.toLowerCase() === wanted);
  return key ? `${headers[key] || ''}` : '';
}

function isOriginAllowed(origin, originAllowList = []) {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!originAllowList.length || originAllowList.includes('*')) return true;
  if (!normalizedOrigin) return true;
  return originAllowList.includes(normalizedOrigin);
}

function getRequestProxyToken(headers) {
  const explicit = getHeader(headers, 'x-proxy-token');
  if (explicit) return explicit;

  const authorization = getHeader(headers, 'authorization');
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function buildCorsHeaders({ origin = '', originAllowList = [] } = {}) {
  const normalizedOrigin = normalizeOrigin(origin);
  const hasAllowList = originAllowList.length > 0 && !originAllowList.includes('*');
  const allowOrigin = hasAllowList
    ? (normalizedOrigin && isOriginAllowed(normalizedOrigin, originAllowList) ? normalizedOrigin : originAllowList[0])
    : '*';

  const headers = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': DEFAULT_ALLOWED_METHODS,
    'Access-Control-Allow-Headers': DEFAULT_ALLOWED_HEADERS,
  };

  if (hasAllowList) headers.Vary = 'Origin';
  return headers;
}

function enforceProxyAccess({ headers = {}, origin = '', proxyToken = '', originAllowList = [] } = {}) {
  const requestOrigin = normalizeOrigin(origin || getHeader(headers, 'origin'));
  if (!isOriginAllowed(requestOrigin, originAllowList)) {
    return { allowed: false, status: 403, message: 'Origin is not allowed' };
  }

  if (proxyToken && getRequestProxyToken(headers) !== proxyToken) {
    return { allowed: false, status: 401, message: 'Proxy token is required' };
  }

  return { allowed: true, status: 200, message: 'OK' };
}

module.exports = {
  DEFAULT_ALLOWED_HEADERS,
  DEFAULT_ALLOWED_METHODS,
  buildCorsHeaders,
  enforceProxyAccess,
  getHeader,
  getRequestProxyToken,
  isOriginAllowed,
  normalizeOrigin,
  parseAllowList,
};
