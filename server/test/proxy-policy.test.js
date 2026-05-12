const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildCorsHeaders,
  enforceProxyAccess,
  parseAllowList,
} = require('../../lib/proxy-policy');

test('parseAllowList normalizes comma separated origins', () => {
  assert.deepEqual(parseAllowList(' https://a.example.com,https://b.example.com/ '), [
    'https://a.example.com',
    'https://b.example.com',
  ]);
});

test('enforceProxyAccess allows requests when no proxy token is configured', () => {
  const result = enforceProxyAccess({
    headers: {},
    origin: 'https://app.example.com',
    proxyToken: '',
    originAllowList: [],
  });

  assert.equal(result.allowed, true);
});

test('enforceProxyAccess rejects missing proxy token when configured', () => {
  const result = enforceProxyAccess({
    headers: {},
    origin: 'https://app.example.com',
    proxyToken: 'secret',
    originAllowList: [],
  });

  assert.equal(result.allowed, false);
  assert.equal(result.status, 401);
});

test('enforceProxyAccess accepts bearer or x-proxy-token credentials', () => {
  assert.equal(
    enforceProxyAccess({
      headers: { authorization: 'Bearer secret' },
      origin: 'https://app.example.com',
      proxyToken: 'secret',
      originAllowList: [],
    }).allowed,
    true,
  );

  assert.equal(
    enforceProxyAccess({
      headers: { 'x-proxy-token': 'secret' },
      origin: 'https://app.example.com',
      proxyToken: 'secret',
      originAllowList: [],
    }).allowed,
    true,
  );
});

test('enforceProxyAccess rejects origins outside allowlist', () => {
  const result = enforceProxyAccess({
    headers: {},
    origin: 'https://evil.example.com',
    proxyToken: '',
    originAllowList: ['https://app.example.com'],
  });

  assert.equal(result.allowed, false);
  assert.equal(result.status, 403);
});

test('buildCorsHeaders reflects allowed origin and credentials when allowlist is set', () => {
  assert.deepEqual(
    buildCorsHeaders({
      origin: 'https://app.example.com',
      originAllowList: ['https://app.example.com'],
    }),
    {
      'Access-Control-Allow-Origin': 'https://app.example.com',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, appKey, sign, token, Authorization, X-Proxy-Token',
      Vary: 'Origin',
    },
  );
});

test('buildCorsHeaders does not wildcard disallowed origins when allowlist is set', () => {
  assert.equal(
    buildCorsHeaders({
      origin: 'https://evil.example.com',
      originAllowList: ['https://app.example.com'],
    })['Access-Control-Allow-Origin'],
    'https://app.example.com',
  );
});
