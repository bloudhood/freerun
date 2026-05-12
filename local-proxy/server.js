/**
 * Freerun Local Proxy Server
 * 
 * 运行在用户本地电脑（国内），转发请求到 run-lb.tanmasports.com
 * 通过 Cloudflare Tunnel 暴露到公网
 */

const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const url = require('url');
const {
  buildCorsHeaders,
  enforceProxyAccess,
  parseAllowList,
} = require('../lib/proxy-policy');

loadDotEnv(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT || 18923);
const TARGET = normalizeTarget(process.env.UNIRUN_TARGET || 'https://run-lb.tanmasports.com/v1');
const PROXY_TOKEN = `${process.env.PROXY_TOKEN || ''}`.trim();
const ORIGIN_ALLOWLIST = parseAllowList(process.env.ORIGIN_ALLOWLIST || '');
const MAX_BODY_BYTES = parseByteSize(process.env.MAX_BODY_BYTES || process.env.REQUEST_BODY_LIMIT || '10mb');

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const index = trimmed.indexOf('=');
    if (index <= 0) return;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  });
}

function normalizeTarget(value) {
  return `${value || ''}`.trim().replace(/\/+$/, '');
}

function parseByteSize(value) {
  const raw = `${value || ''}`.trim().toLowerCase();
  const match = raw.match(/^(\d+(?:\.\d+)?)(b|kb|mb)?$/);
  if (!match) return 10 * 1024 * 1024;

  const amount = Number(match[1]);
  const unit = match[2] || 'b';
  if (unit === 'mb') return Math.floor(amount * 1024 * 1024);
  if (unit === 'kb') return Math.floor(amount * 1024);
  return Math.floor(amount);
}

function jsonResponse(res, status, headers, payload) {
  res.writeHead(status, { ...headers, 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  const corsHeaders = buildCorsHeaders({
    origin: req.headers.origin,
    originAllowList: ORIGIN_ALLOWLIST,
  });

  // 健康检查端点
  if (req.url === '/health') {
    jsonResponse(res, 200, corsHeaders, { status: 'ok', timestamp: Date.now() });
    return;
  }

  // OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    const access = enforceProxyAccess({
      headers: req.headers,
      proxyToken: '',
      originAllowList: ORIGIN_ALLOWLIST,
    });
    res.writeHead(access.allowed ? 200 : access.status, corsHeaders);
    res.end();
    return;
  }

  const access = enforceProxyAccess({
    headers: req.headers,
    proxyToken: PROXY_TOKEN,
    originAllowList: ORIGIN_ALLOWLIST,
  });
  if (!access.allowed) {
    jsonResponse(res, access.status, corsHeaders, { error: access.message });
    return;
  }

  // 解析目标 URL
  const targetUrl = TARGET + req.url;
  const parsedUrl = url.parse(targetUrl);

  // 构建请求选项
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: req.method,
    headers: {
      'Content-Type': req.headers['content-type'] || 'application/json',
      'User-Agent': 'okhttp/3.12.1',
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
    },
  };

  // 传递自定义 headers
  if (req.headers['appkey']) options.headers['appKey'] = req.headers['appkey'];
  if (req.headers['sign']) options.headers['sign'] = req.headers['sign'];
  if (req.headers['token']) options.headers['token'] = req.headers['token'];

  // 收集请求体
  let body = [];
  let bodySize = 0;
  let rejected = false;
  req.on('data', chunk => {
    if (rejected) return;
    bodySize += chunk.length;
    if (bodySize > MAX_BODY_BYTES) {
      rejected = true;
      jsonResponse(res, 413, corsHeaders, { error: 'Request body too large' });
      req.destroy();
      return;
    }
    body.push(chunk);
  });
  req.on('end', () => {
    if (rejected) return;
    body = Buffer.concat(body);
    if (body.length > 0) options.headers['Content-Length'] = String(body.length);

    // 发送请求到目标服务器
    const proxyReq = https.request(options, (proxyRes) => {
      // 构建响应 headers
      const responseHeaders = { ...corsHeaders };
      Object.keys(proxyRes.headers).forEach(key => {
        if (key !== 'transfer-encoding') {
          responseHeaders[key] = proxyRes.headers[key];
        }
      });

      res.writeHead(proxyRes.statusCode, responseHeaders);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
      console.error(`Proxy error: ${e.message}`);
      if (!res.headersSent) {
        jsonResponse(res, 500, corsHeaders, { error: e.message });
      }
    });

    // 发送请求体
    if (body.length > 0) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
});

// 启动服务器
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Freerun Proxy] 运行在 http://0.0.0.0:${PORT}`);
  console.log(`[Freerun Proxy] 目标: ${TARGET}`);
  console.log(`[Freerun Proxy] 代理鉴权: ${PROXY_TOKEN ? '已启用' : '未启用'}`);
  console.log(`[Freerun Proxy] 健康检查: http://localhost:${PORT}/health`);
});

// 错误处理
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`[Freerun Proxy] 端口 ${PORT} 已被占用`);
  } else {
    console.error(`[Freerun Proxy] 服务器错误: ${e.message}`);
  }
  process.exit(1);
});
