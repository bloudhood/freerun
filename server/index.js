const express = require('express');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const morgan = require('morgan');
const path = require('path');
const { createLogger, transports, format } = require('winston');
const {
    buildCorsHeaders,
    enforceProxyAccess,
    parseAllowList
} = require('../lib/proxy-policy');

loadDotEnv(path.join(__dirname, '.env'));

const app = express();
const port = Number(process.env.PORT || 3000);
const target = normalizeTarget(process.env.UNIRUN_TARGET || 'https://run-lb.tanmasports.com/v1');
const proxyToken = `${process.env.PROXY_TOKEN || ''}`.trim();
const originAllowList = parseAllowList(process.env.ORIGIN_ALLOWLIST || '');

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

// 创建 winston 日志记录器
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
        })
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'combined.log' })
    ]
});

// 使用 morgan 中间件记录 HTTP 请求日志
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// 设置请求主体大小限制
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use((req, res, next) => {
    const corsHeaders = buildCorsHeaders({ origin: req.headers.origin, originAllowList });
    res.set(corsHeaders);

    if (req.method === 'OPTIONS') {
        const access = enforceProxyAccess({
            headers: req.headers,
            origin: req.headers.origin,
            proxyToken: '',
            originAllowList
        });
        return res.sendStatus(access.allowed ? 200 : access.status);
    } else {
        next();
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

app.all('*', async (req, res) => {
    const access = enforceProxyAccess({
        headers: req.headers,
        origin: req.headers.origin,
        proxyToken,
        originAllowList
    });
    if (!access.allowed) {
        return res.status(access.status).json({ error: access.message });
    }

    const url = new URL(req.originalUrl, `http://${req.headers.host}`);
    const backendUrl = target + url.pathname + url.search;

    logger.info(`Forwarding request to: ${backendUrl}`);

    const newHeaders = {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'User-Agent': 'okhttp/3.12.1',
        Accept: 'application/json'
    };

    if (req.headers.appkey) newHeaders.appKey = req.headers.appkey;
    if (req.headers.sign) newHeaders.sign = req.headers.sign;
    if (req.headers.token) newHeaders.token = req.headers.token;

    const init = {
        method: req.method,
        headers: newHeaders,
        body: req.method === 'GET' || req.method === 'HEAD' ? null : JSON.stringify(req.body ?? {})
    };

    try {
        const response = await fetch(backendUrl, init);
        const body = await response.text();

        const contentType = response.headers.get('content-type');
        if (contentType) res.set('Content-Type', contentType);

        res.status(response.status).send(body);
    } catch (error) {
        logger.error(`Error during fetch: ${error.message}`);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(port, () => {
    logger.info(`Server is running on http://localhost:${port}`);
    logger.info(`Forwarding to ${target}`);
});
