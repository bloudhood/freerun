import test from 'node:test';
import assert from 'node:assert/strict';

import {
  readStoredAutorunServerBase,
  resolveAutorunServerBase,
  writeStoredAutorunServerBase,
} from '../src/sdk/autorun/config.js';

test('production autorun defaults to the local machine service', () => {
  assert.equal(
    resolveAutorunServerBase({ configuredBase: '', isDev: false }),
    'http://127.0.0.1:5891',
  );
});

test('dev autorun also defaults to the local machine service without proxy config', () => {
  assert.equal(
    resolveAutorunServerBase({ configuredBase: '', isDev: true }),
    'http://127.0.0.1:5891',
  );
});

test('dev autorun still uses the Vite proxy when explicitly configured', () => {
  assert.equal(
    resolveAutorunServerBase({ configuredBase: 'http://127.0.0.1:5891', isDev: true }),
    '/autorunserver',
  );
});

test('runtime autorun server override wins over build-time config', () => {
  assert.equal(
    resolveAutorunServerBase({
      configuredBase: 'https://autorun.example.com',
      storedBase: 'http://192.168.1.23:5891/',
      isDev: false,
    }),
    'http://192.168.1.23:5891',
  );
});

test('relative autorun base supports same-origin reverse proxy deployments', () => {
  assert.equal(
    resolveAutorunServerBase({ configuredBase: '/autorunserver/', isDev: false }),
    '/autorunserver',
  );
});

test('stored autorun server base is persisted in the shared autorun state', () => {
  const store = new Map();
  const storage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
  };

  writeStoredAutorunServerBase(storage, 'http://10.0.0.8:5891/');

  assert.equal(readStoredAutorunServerBase(storage), 'http://10.0.0.8:5891');
  assert.deepEqual(JSON.parse(storage.getItem('unirun.autorun_state')), {
    apiBaseUrl: 'http://10.0.0.8:5891',
  });
});
