# Freerun 与新版 UNIRUN APK 差异分析

## 问题定位

Freerun 项目用不了的核心原因：

### 1. 登录 Body 字段名变更 ❌ [关键]

**老版本 Freerun** (`app/src/sdk/app/client.js` 第194行):
```javascript
appVersion: this.appVersion,   // 单数
sysVersion: device.sysVersion, // 单数
```

**新版 APK** (`LoginBody.java`):
```java
private String appVersions;   // 复数
private String sysVersions;   // 复数
```

新版本服务端可能不再识别单数字段名，导致登录失败。

### 2. AppVersion 版本号过旧 ⚠️

**老版本**: `1.8.3`
**新版 APK**: `3.6.8`

服务端可能校验版本号，过旧的版本可能被拒绝。

### 3. 签名算法特殊字符 ✅ [一致]

老版本和新版本实际上是一样的:
```javascript
const specialChars = [' ', '~', '!', '(', ')', "'"];
```

APK中的 `l.s = "("`, `l.t = ")"`, `Constants.WAVE_SEPARATOR = "~"`，确认一致。

### 4. API 返回格式 ✅ [一致]

`BaseRespone.java` 使用 `@JsonProperty("response")` 注解:
```java
@JsonProperty("response")
private T data;
```

成功码: `CODE_SUCCESS = 10000`

返回格式仍然是:
```json
{
  "code": 10000,
  "msg": "success",
  "response": {...}
}
```

这部分没变，老版本的 `data.code === 10000` 和 `data.response` 处理是正确的。

### 5. 代理服务器 ⚠️ [可能问题]

直接请求 `https://run-lb.tanmasports.com/v1` 会返回 405 错误。
必须通过代理服务器（Vercel Functions / Cloudflare Worker / 本地 Express）转发。

检查你的代理服务器是否正常运行。

---

## 需要更新的内容

### 必须修改

**文件**: `app/src/sdk/app/client.js`

```javascript
// 第193-202行，login 方法
login(userPhone, password) {
    const device = this.deviceResolver();
    return this.http.post('/auth/login/password', {
      appVersions: this.appVersion,      // 改: appVersion → appVersions
      password: CryptoJS.MD5(password).toString(),
      userPhone,
      brand: device.brand,
      deviceToken: '',
      deviceType: device.deviceType,
      mobileType: device.mobileType,
      sysVersions: device.sysVersion,    // 改: sysVersion → sysVersions
    });
}
```

### 建议修改

**文件**: `app/src/sdk/app/client.js`

更新 appVersion 版本号（如果服务端校验版本）:
```javascript
// 找到配置 appVersion 的地方，更新为:
appVersion: '3.6.8'
```

### autorun-local/server.js 同步更新

**文件**: `autorun-local/server.js`

```javascript
// 第44行
appVersion: '3.6.8',  // 更新版本号

// 第183-192行，loginAndGetToken 函数
const body = {
    appVersions: CONFIG.appVersion,  // 改: appVersion → appVersions
    password: md5(password),
    userPhone,
    brand: 'Apple',
    deviceToken: '',
    deviceType: '2',
    mobileType: 'iPhone',
    sysVersions: '18.6',             // 改: sysVersion → sysVersions
};
```

### saveRunRecord 函数

**文件**: `autorun-local/server.js` 第214-232行

```javascript
const body = {
    againRunStatus: '0',
    againRunTime: 0,
    appVersions: CONFIG.appVersion,  // 确认是复数
    brand: 'Apple',
    mobileType: 'iPhone',
    sysVersions: '18.6',             // 确认是复数
    trackPoints,
    distanceTimeStatus: '1',
    innerSchool: '1',
    runDistance: Math.round(runDistance),
    runTime: Math.round(runTime),
    userId: Number(userId),
    vocalStatus: '1',
    yearSemester,
    recordDate,
};
```

这部分已经是复数形式，无需修改。

---

## 新增功能 (可选)

新版 APK 增加了以下功能，Freerun 可以考虑支持:

### 1. realityTrackPoints 字段

新版提交跑步记录时有 `realityTrackPoints` 字段（原始轨迹），与 `trackPoints`（平滑轨迹）分开。

```javascript
// saveRunRecord 中添加
const body = {
    ...
    trackPoints: smoothedTrack,        // 平滑后的轨迹
    realityTrackPoints: rawTrack,      // 原始轨迹
    ...
};
```

### 2. 学校区域查询 API

```javascript
// GET /unirun/querySchoolBound?schoolId=xxx
// 返回学校跑步区域的边界多边形
```

### 3. 语音验证状态

`vocalStatus` 字段:
- "0" = 未验证
- "1" = 已验证

当跑步时间达到 `vocalVerifyTime`（从 runStandard 获取）时需要语音验证。

---

## 测试步骤

1. 修改 `app/src/sdk/app/client.js` 中的字段名
2. 更新版本号
3. 确保代理服务器正常运行
4. 测试登录是否成功
5. 测试提交跑步记录是否成功

---

## 总结

| 问题 | 严重程度 | 修改位置 |
|------|----------|----------|
| appVersion → appVersions | ❌ 必须 | client.js, server.js |
| sysVersion → sysVersions | ❌ 必须 | client.js, server.js |
| 版本号 1.8.3 过旧 | ⚠️ 建议 | client.js, server.js |
| realityTrackPoints 缺失 | ⚠️ 可选 | server.js |
| 签名算法 | ✅ 无需修改 | - |
| API返回格式 | ✅ 无需修改 | - |
