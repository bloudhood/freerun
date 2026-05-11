/**
 * Byerun Local Proxy Server
 * 
 * 运行在用户本地电脑（国内），转发请求到 run-lb.tanmasports.com
 * 通过 Cloudflare Tunnel 暴露到公网
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 18923;
const TARGET = 'https://run-lb.tanmasports.com';

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Content-Type': 'application/json',
};

// 创建 HTTP 服务器
const server = http.createServer((req, res) => {
  // 健康检查端点
  if (req.url === '/health') {
    res.writeHead(200, CORS_HEADERS);
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    return;
  }

  // OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  // 解析目标 URL - 添加 /v1 前缀
  const targetUrl = TARGET + '/v1' + req.url;
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
  req.on('data', chunk => body.push(chunk));
  req.on('end', () => {
    body = Buffer.concat(body);

    // 发送请求到目标服务器
    const proxyReq = https.request(options, (proxyRes) => {
      // 构建响应 headers
      const responseHeaders = { ...CORS_HEADERS };
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
      res.writeHead(500, CORS_HEADERS);
      res.end(JSON.stringify({ error: e.message }));
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
  console.log(`[Byerun Proxy] 运行在 http://0.0.0.0:${PORT}`);
  console.log(`[Byerun Proxy] 目标: ${TARGET}`);
  console.log(`[Byerun Proxy] 健康检查: http://localhost:${PORT}/health`);
});

// 错误处理
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`[Byerun Proxy] 端口 ${PORT} 已被占用`);
  } else {
    console.error(`[Byerun Proxy] 服务器错误: ${e.message}`);
  }
  process.exit(1);
});
