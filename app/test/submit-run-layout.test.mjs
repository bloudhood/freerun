import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '../..');
const submitRunSource = fs.readFileSync(
  path.join(repoRoot, 'app/src/components/SubmitRun.vue'),
  'utf8',
);

test('manual submit inputs can shrink inside the default desktop window', () => {
  assert.match(submitRunSource, /input-container[^"]*w-full[^"]*min-w-0/);
  assert.match(submitRunSource, /input-wrapper[^"]*min-w-0[^"]*flex-1/);
  assert.match(submitRunSource, /class="[^"]*min-w-0[^"]*w-full[^"]*flex-1[^"]*"/);
  assert.match(submitRunSource, /class="[^"]*shrink-0[\s\S]*aria-label="随机里程"/);
});

test('status and route text truncate instead of widening cards', () => {
  assert.match(submitRunSource, /summary-card[^"]*min-w-0/);
  assert.match(submitRunSource, /selected-route[^"]*min-w-0/);
  assert.match(submitRunSource, /route-name[^"]*truncate/);
});
