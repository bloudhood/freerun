export async function onRequest(context) {
  const { request, env = {} } = context;
  const url = new URL(request.url);
  const proxyUrl = (env.LOCAL_PROXY_URL || env.PROXY_URL || '').replace(/\/+$/, '');
  const originAllowList = parseAllowList(env.ORIGIN_ALLOWLIST || '');
  const corsHeaders = buildCorsHeaders(request.headers.get('Origin'), originAllowList);

  // OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    const access = enforceProxyAccess({
      headers: request.headers,
      proxyToken: '',
      originAllowList,
    });
    return new Response(null, { status: access.allowed ? 200 : access.status, headers: corsHeaders });
  }

  if (!proxyUrl) {
    return new Response(
      JSON.stringify({
        error: 'LOCAL_PROXY_URL is not configured',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
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

  // 健康检查端点
  if (url.pathname === '/devproxy/health') {
    try {
      const resp = await fetch(proxyUrl + '/health');
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ status: 'offline', error: e.message }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
  // 去除 /devproxy 前缀
  const targetPath = url.pathname.replace(/^\/devproxy/, '') + url.search;
  const targetUrl = proxyUrl + targetPath;

  // 构建请求头
  const headers = new Headers();
  headers.set('Content-Type', request.headers.get('content-type') || 'application/json');
  
  // 传递自定义 headers
  const appKey = request.headers.get('appKey');
  const sign = request.headers.get('sign');
  const token = request.headers.get('token');
  
  if (appKey) headers.set('appKey', appKey);
  if (sign) headers.set('sign', sign);
  if (token) headers.set('token', token);
  if (env.LOCAL_PROXY_TOKEN) headers.set('X-Proxy-Token', env.LOCAL_PROXY_TOKEN);

  const init = {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
  };

  try {
    const response = await fetch(targetUrl, init);
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => newHeaders.set(key, value));
    
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

const ALLOWED_HEADERS = 'Content-Type, appKey, sign, token, Authorization, X-Proxy-Token';
const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, OPTIONS';

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
