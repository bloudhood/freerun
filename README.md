# Freerun

校园跑 Web 客户端与代理工具。项目默认可本地运行，也支持国内域名代理和 Cloudflare Pages + 本机代理的绕行模式。

## 目录

| 目录 | 作用 |
| --- | --- |
| `app` | Vue 前端 |
| `server` | 可部署到国内服务器/域名的 Node 代理 |
| `local-proxy` | 运行在本机国内网络的轻量代理 |
| `worker` | Cloudflare Worker 代理示例 |
| `autorun-local` | 可选的自动任务服务 |

## API 模式

前端通过 `app/.env` 的 `VITE_API_MODE` 选择接口路径。

| 模式 | 场景 | 前端请求路径 |
| --- | --- | --- |
| `local` | 本地开发或局域网使用 | `/devproxy`，由 Vite dev server 转发 |
| `domain` | 国内服务器/国内域名代理 | `VITE_API_BASE_URL` |
| `tunnel` | Cloudflare Pages 等国外域名被目标服务拦截 | `/devproxy`，由 Pages Function 转发到本机代理 |
| `direct` | 目标网络和 CORS 都允许直连时 | `VITE_UNIRUN_API_BASE` |

默认模式是 `local`。

## 1. 本地运行

```bash
cp app/.env.example app/.env
npm run setup
npm run dev
```

访问 Vite 输出的本地地址。局域网设备访问时，使用电脑的局域网 IP 和 Vite 端口。

## 2. 国内域名代理

先部署代理：

```bash
cd server
cp .env.example .env
npm install
npm start
```

`server/.env`：

```env
PORT=3000
UNIRUN_TARGET=https://run-lb.tanmasports.com/v1
```

然后配置前端：

```env
VITE_API_MODE=domain
VITE_API_BASE_URL=https://api.example.com
```

构建前端：

```bash
cd app
npm run build
```

将 `app/dist` 部署到你的站点，确保 `VITE_API_BASE_URL` 指向国内可访问的代理域名。

## 3. Cloudflare 域名 + 本机代理

当国外 Worker/Pages 直接请求目标服务被拦截时，让目标服务看到本机国内网络出口。

在本机启动代理：

```bash
cd local-proxy
cp .env.example .env
npm start
```

`local-proxy/.env`：

```env
PORT=18923
UNIRUN_TARGET=https://run-lb.tanmasports.com/v1
PROXY_TOKEN=change-me
ORIGIN_ALLOWLIST=https://your-pages.pages.dev
REQUEST_BODY_LIMIT=10mb
```

再用 Cloudflare Tunnel 或其它隧道把 `http://127.0.0.1:18923` 暴露出去。Cloudflare Pages 需要设置服务端环境变量：

```env
LOCAL_PROXY_URL=https://proxy.example.com
LOCAL_PROXY_TOKEN=change-me
ORIGIN_ALLOWLIST=https://your-pages.pages.dev
```

前端配置：

```env
VITE_API_MODE=tunnel
VITE_TUNNEL_API_BASE=/devproxy
```

Pages Function 会把 `/devproxy/*` 转发到 `LOCAL_PROXY_URL`。

## 可选：自动任务服务

```bash
cd autorun-local
cp .env.example .env
npm install
npm start
```

`autorun-local/.env`：

```env
PORT=5891
UNIRUN_TARGET=https://run-lb.tanmasports.com/v1
APP_KEY=389885588s0648fa
APP_SECRET=56E39A1658455588885690425C0FD16055A21676
TASK_SECRET=replace-with-a-random-local-secret
AUTORUN_ORIGIN_ALLOWLIST=https://freerun.example.com,http://localhost:5173
```

前端启用：

```env
VITE_AUTORUN_SERVER_BASE=https://autorun.example.com
```

该服务提供跑步定时任务、俱乐部自动签到/签退、俱乐部抢报接口。部署位置必须能访问 `UNIRUN_TARGET`；如果国外服务器出口被拦截，应把该服务部署在国内网络，或把 `UNIRUN_TARGET` 指向可用的国内代理。公开或多用户部署必须配置 `TASK_SECRET`，否则 `tasks.json` 会使用兼容的明文 token 格式。

PM2：

```bash
npm run pm2
```

## 配置项

| 变量 | 所在目录 | 说明 |
| --- | --- | --- |
| `VITE_API_MODE` | `app` | `local`、`domain`、`tunnel`、`direct` |
| `VITE_UNIRUN_API_BASE` | `app` | 官方接口地址，默认 `https://run-lb.tanmasports.com/v1` |
| `VITE_API_BASE_URL` | `app` | 国内代理地址 |
| `VITE_TUNNEL_API_BASE` | `app` | tunnel 模式前端入口，默认 `/devproxy` |
| `VITE_PROXY_TOKEN` | `app` | 访问启用 `PROXY_TOKEN` 的 domain/worker 代理；会进入浏览器包，不是服务端秘密 |
| `LOCAL_PROXY_URL` | Cloudflare Pages | Pages Function 要转发到的本机代理公网地址 |
| `LOCAL_PROXY_TOKEN` | Cloudflare Pages | Pages Function 访问本机代理时附加的服务端 token |
| `PROXY_TOKEN` | `server`、`local-proxy`、`worker`、Cloudflare Pages | 代理访问令牌；`local-proxy` 配合 `LOCAL_PROXY_TOKEN` 使用最安全 |
| `ORIGIN_ALLOWLIST` | `server`、`local-proxy`、`worker`、Cloudflare Pages | CORS 来源白名单，多个来源用英文逗号分隔 |
| `UNIRUN_TARGET` | `server`、`local-proxy`、`worker` | 代理上游地址 |
| `UNIRUN_TARGET` | `autorun-local` | 自动任务服务调用的上游地址 |
| `TASK_SECRET` | `autorun-local` | 加密 `tasks.json` 里的 token；公开或多用户部署必须设置 |
| `AUTORUN_ORIGIN_ALLOWLIST` | `autorun-local` | 自动任务服务的 CORS 来源白名单 |

`APP_KEY` / `APP_SECRET` 是从客户端签名协议中抽出的公开兼容常量，用于生成 Unirun 请求签名；它们不是本项目的服务端鉴权密钥。保护自己的部署请使用 `PROXY_TOKEN`、`LOCAL_PROXY_TOKEN` 和 `TASK_SECRET`。

## 发布前检查

```bash
cd app
npm run build
```

不要提交本机运行产物：`.tools/`、`.playwright-mcp/`、`.wrangler/`、`.env`、`tasks.json`。如果当前仓库历史曾提交过本机域名、Wrangler 缓存或其它敏感文件，公开到 GitHub 前必须使用干净新仓库或重写 Git 历史；只删除 HEAD 文件不等于历史已脱敏。

## 声明

本项目仅供学习研究使用，不得用于商业或非法用途。如需体验完整功能，请使用官方应用。

## 致谢

[@msojocs/AutoRun](https://github.com/msojocs/AutoRun)

## 许可

基于 [CC BY-NC License, Version 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 发布。
