import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authPageSource = fs.readFileSync(path.join(__dirname, '../src/views/AuthPage.vue'), 'utf8');

test('login page does not show server status text', () => {
  assert.equal(authPageSource.includes('接口服务可用'), false);
  assert.equal(authPageSource.includes('接口服务不可用'), false);
});

test('login submit button is not gated by proxy status', () => {
  assert.equal(authPageSource.includes('!proxyOnline'), false);
});
