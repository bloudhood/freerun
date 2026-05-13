# Freerun

校园跑桌面工具。改自 byrun，适配新版 Unirun 接口；支持 CUIT。

## 使用

Windows 用户优先使用发布包里的 `Freerun.exe`，双击即可。

- 不需要启动 `server`、`local-proxy` 或 `autorun-local`
- “记住我”会保存在本机 WebView 数据里
- 打不开时，安装 Microsoft Edge WebView2 Runtime

## 源码开发

```bash
git clone https://github.com/bloudhood/freerun
cd freerun
copy app\.env.example app\.env
npm --prefix app install
npm run dev
```

打开终端里显示的 `http://localhost:5173/`。macOS/Linux 把 `copy` 换成 `cp`。

```bash
npm run desktop:build
```

构建完成后使用根目录的 `Freerun.exe`。

## 可选功能

- 自动任务服务：见 `AUTORUN_SERVER_GUIDE.md`
- 网站/代理部署：按需使用 `server`、`local-proxy` 或 `worker`
- 公开部署时配置访问限制和密钥，不要裸奔

## 目录

| 目录 | 作用 |
| --- | --- |
| `app` | Vue 前端 |
| `desktop` | Windows 桌面版打包 |
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
