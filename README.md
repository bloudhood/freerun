# Freerun

校园跑 Web 客户端与代理工具。项目改自 byrun，适配新版 Unirun 服务端接口；目前验证和支持的学校是 CUIT。

## 本地快速使用

适合只想在自己电脑上使用校园跑功能的用户。不需要部署服务器、Cloudflare、Worker 或自动任务服务。

```bash
git clone https://github.com/bloudhood/freerun
cd freerun
copy app\.env.example app\.env
npm --prefix app install
npm run dev
```

macOS/Linux 用户把 `copy` 换成 `cp`。

默认配置是本地模式：

```env
VITE_API_MODE=local
VITE_UNIRUN_API_BASE=https://run-lb.tanmasports.com/v1
```

前端会请求 `/devproxy`，由 Vite dev server 转发到 Unirun，用于避开浏览器 CORS。只要本机网络能访问 Unirun，本地模式即可使用。

## 网站部署

前端构建：

```bash
cd app
npm install
npm run build
```

### 国内域名代理

适合服务器出口能访问 Unirun 的情况。

```bash
cd server
copy .env.example .env
npm install
npm start
```

前端配置：

```env
VITE_API_MODE=domain
VITE_API_BASE_URL=https://api.example.com
```

公网部署建议在代理侧配置 `PROXY_TOKEN` 和 `ORIGIN_ALLOWLIST`。

### Cloudflare Pages + 本机代理

适合 Cloudflare 等国外出口无法访问新版 Unirun，但本机国内网络可访问的情况。

本机启动代理：

```bash
cd local-proxy
copy .env.example .env
npm start
```

把 `http://127.0.0.1:18923` 通过 Cloudflare Tunnel 或其它隧道暴露出去，然后在 Pages 环境变量中配置：

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

## 可选：自动任务服务

`autorun-local` 提供跑步定时任务、俱乐部自动签到/签退和俱乐部抢报接口。简单本地使用不需要它。

```bash
cd autorun-local
copy .env.example .env
npm install
npm start
```

公开或多用户部署必须配置 `TASK_SECRET`，否则 `tasks.json` 会使用兼容的明文 token 格式。

前端启用：

```env
VITE_AUTORUN_SERVER_BASE=https://autorun.example.com
```

## 目录

| 目录 | 作用 |
| --- | --- |
| `app` | Vue 前端 |
| `server` | 国内服务器/域名 Node 代理 |
| `local-proxy` | 本机网络轻量代理 |
| `worker` | Cloudflare Worker 代理示例 |
| `autorun-local` | 可选自动任务服务 |

不要提交本机运行产物：`.tools/`、`.playwright-mcp/`、`.wrangler/`、`.env`、`tasks.json`。

## 免责声明

本仓库仅供学习、研究、个人实验和内部验证使用，不提供任何形式的商业授权、适用性保证或结果保证。

作者及仓库维护者不对因使用、修改、分发、部署或依赖本项目而产生的任何直接或间接损失、账号封禁、数据丢失、法律风险或第三方索赔负责。

请勿将本项目用于违反服务条款、协议、法律法规或平台规则的场景。商业使用前请自行确认 LICENSE、相关协议以及你是否获得了作者的书面许可。

## 许可

基于 [CC BY-NC License, Version 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 发布。
