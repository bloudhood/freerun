const DEFAULT_TARGET = 'https://run-lb.tanmasports.com/v1';

const ALLOWED_HEADERS = 'Content-Type, appKey, sign, token, Authorization, X-Proxy-Token';
const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';

export default {
  async fetch(request, env = {}) {
    const originAllowList = parseAllowList(env.ORIGIN_ALLOWLIST || '');
    const corsHeaders = buildCorsHeaders(request.headers.get('Origin'), originAllowList);

    if (request.method === 'OPTIONS') {
      const access = enforceProxyAccess({
        headers: request.headers,
        proxyToken: '',
        originAllowList,
      });
      return new Response(null, { status: access.allowed ? 200 : access.status, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const target = normalizeTarget(env.UNIRUN_TARGET || DEFAULT_TARGET);

    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const access = enforceProxyAccess({
      headers: request.headers,
      proxyToken: env.PROXY_TOKEN || '',
      originAllowList,
    });
    if (!access.allowed) {
      return new Response(JSON.stringify({ error: access.message }), {
        status: access.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const targetUrl = target + url.pathname + url.search;

    const headers = new Headers();
    headers.set('Content-Type', request.headers.get('content-type') || 'application/json');
    headers.set('User-Agent', 'okhttp/3.12.1');
    headers.set('Accept', 'application/json');

    const appKey = request.headers.get('appkey');
    const sign = request.headers.get('sign');
    const token = request.headers.get('token');
    if (appKey) headers.set('appKey', appKey);
    if (sign) headers.set('sign', sign);
    if (token) headers.set('token', token);

    const init = {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
    };

    try {
      const response = await fetch(targetUrl, init);
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));
      return new Response(response.body, { status: response.status, headers: newHeaders });
    } catch (e) {
      return new Response('Internal Server Error', { status: 500, headers: corsHeaders });
    }
  },
};

function normalizeTarget(value) {
  return `${value || ''}`.trim().replace(/\/+$/, '');
}

function normalizeOrigin(value) {
  return `${value || ''}`.trim().replace(/\/+$/, '');
}

function parseAllowList(value) {
  return `${value || ''}`
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);
}

function isOriginAllowed(origin, originAllowList = []) {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!originAllowList.length || originAllowList.includes('*')) return true;
  if (!normalizedOrigin) return true;
  return originAllowList.includes(normalizedOrigin);
}

function buildCorsHeaders(origin, originAllowList = []) {
  const normalizedOrigin = normalizeOrigin(origin);
  const hasAllowList = originAllowList.length > 0 && !originAllowList.includes('*');
  const allowOrigin = hasAllowList
    ? (normalizedOrigin && isOriginAllowed(normalizedOrigin, originAllowList) ? normalizedOrigin : originAllowList[0])
    : '*';
  const headers = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': ALLOWED_HEADERS,
  };
  if (hasAllowList) headers.Vary = 'Origin';
  return headers;
}

function getProxyToken(headers) {
  const explicit = headers.get('X-Proxy-Token') || '';
  if (explicit) return explicit;
  const match = (headers.get('Authorization') || '').match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

function enforceProxyAccess({ headers, proxyToken = '', originAllowList = [] }) {
  if (!isOriginAllowed(headers.get('Origin'), originAllowList)) {
    return { allowed: false, status: 403, message: 'Origin is not allowed' };
  }
  if (`${proxyToken || ''}`.trim() && getProxyToken(headers) !== `${proxyToken || ''}`.trim()) {
    return { allowed: false, status: 401, message: 'Proxy token is required' };
  }
  return { allowed: true, status: 200, message: 'OK' };
}
