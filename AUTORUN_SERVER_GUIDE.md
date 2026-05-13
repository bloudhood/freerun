# Freerun 自动任务服务

`autorun-local` 是可选服务，只在需要定时跑步、俱乐部自动签到/签退、俱乐部抢报时使用。

只用 `Freerun.exe` 手动提交，不需要启动它。

## 本机启动

```bash
cd autorun-local
copy .env.example .env
npm install
npm start
```

macOS/Linux 把 `copy` 换成 `cp`。

默认地址是：

```text
http://127.0.0.1:5891
```

打开 `Freerun.exe` 后，在管理页填写服务地址并应用。

## 长期运行

需要电脑或服务器长期在线时，可以用 PM2：

```bash
cd autorun-local
cp .env.example .env
npm install
npm install pm2 -g
pm2 start ecosystem.config.js
pm2 save
```

常用命令：

```bash
pm2 list
pm2 logs freerun-autorun
pm2 restart freerun-autorun
pm2 stop freerun-autorun
```

## 公开部署

公开或多用户部署必须设置 `TASK_SECRET`，否则本地任务文件会使用明文兼容格式。

```env
TASK_SECRET=replace-with-a-random-local-secret
AUTORUN_ORIGIN_ALLOWLIST=https://your-domain.example.com,http://localhost:5173
REQUEST_BODY_LIMIT=1mb
```

如果服务不在本机，把管理页的服务地址改成实际地址：

```text
https://autorun.example.com
```

同源反向代理可以填：

```text
/autorunserver
```
