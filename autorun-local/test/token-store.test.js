const test = require('node:test');
const assert = require('node:assert/strict');

const {
  hydrateTasksFromDisk,
  maskToken,
  serializeTasksForDisk,
} = require('../token-store');

test('serializeTasksForDisk keeps legacy plaintext format when no secret is configured', () => {
  const tasks = {
    'token-plain': { enabled: true, map_id: '1' },
  };

  assert.deepEqual(serializeTasksForDisk(tasks, ''), tasks);
});

test('serializeTasksForDisk encrypts token keys when TASK_SECRET is configured', () => {
  const tasks = {
    'token-secret': { enabled: true, map_id: '1' },
  };
  const saved = serializeTasksForDisk(tasks, 'local-secret');
  const raw = JSON.stringify(saved);

  assert.doesNotMatch(raw, /token-secret/);
  assert.equal(Object.keys(saved).length, 1);

  const hydrated = hydrateTasksFromDisk(saved, 'local-secret');
  assert.deepEqual(hydrated, tasks);
});

test('maskToken does not reveal token prefixes', () => {
  const masked = maskToken('token-secret');

  assert.match(masked, /^[a-f0-9]{8}$/);
  assert.notEqual(masked, 'token-se');
});
