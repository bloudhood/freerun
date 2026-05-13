# Freerun

校园跑 Web 客户端与代理工具。改自 byrun，适配新版 Unirun 接口；支持 CUIT。

## 本地使用

只想在自己电脑上用，按下面跑即可。

```bash
git clone https://github.com/bloudhood/freerun
cd freerun
copy app\.env.example app\.env
npm --prefix app install
npm run dev
```

打开终端里显示的 `http://localhost:5173/`。

macOS/Linux 把 `copy` 换成 `cp`。

默认配置：

```env
VITE_API_MODE=local
VITE_UNIRUN_API_BASE=https://run-lb.tanmasports.com/v1
```

不要直接打开 `app/dist/index.html`，也不要用普通静态服务器跑构建产物。本地模式依赖 Vite 的 `/devproxy` 代理。

不要把 `VITE_API_MODE=direct` 当作日常使用方式。浏览器直连 Unirun 可能被 CORS 或上游安全策略拦截。

## 网站部署

先构建前端：

```bash
cd app
npm install
npm run build
```

### 国内域名代理

服务器能访问 Unirun 时使用。

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

公开使用建议配置 `PROXY_TOKEN` 和 `ORIGIN_ALLOWLIST`。

### Cloudflare Pages + 本机代理

适合 Pages 出口访问不了 Unirun、但本机网络可以访问的情况。

本机代理：

```bash
cd local-proxy
copy .env.example .env
npm start
```

用 Cloudflare Tunnel 或其它隧道暴露 `http://127.0.0.1:18923`，然后在 Pages 配置：

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

`autorun-local` 用于跑步定时任务、俱乐部自动签到/签退和俱乐部抢报。普通本地使用不需要启动它。

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


## 免责声明

本仓库仅供学习、研究、个人实验和内部验证使用，不提供任何形式的商业授权、适用性保证或结果保证。

作者及仓库维护者不对因使用、修改、分发、部署或依赖本项目而产生的任何直接或间接损失、账号封禁、数据丢失、法律风险或第三方索赔负责。

请勿将本项目用于违反服务条款、协议、法律法规或平台规则的场景。商业使用前请自行确认 LICENSE、相关协议以及你是否获得了作者的书面许可。

## 许可

基于 [CC BY-NC License, Version 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 发布。
