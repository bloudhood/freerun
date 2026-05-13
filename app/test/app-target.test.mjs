import test from 'node:test';
import assert from 'node:assert/strict';

import { isDesktopAppTarget, normalizeAppTarget } from '../src/utils/appTarget-core.js';

test('desktop target is opt-in only', () => {
  assert.equal(isDesktopAppTarget('desktop'), true);
  assert.equal(isDesktopAppTarget(' DESKTOP '), true);
  assert.equal(isDesktopAppTarget('web'), false);
  assert.equal(isDesktopAppTarget(''), false);
  assert.equal(isDesktopAppTarget(undefined), false);
});

test('app target normalization lowercases and trims values', () => {
  assert.equal(normalizeAppTarget(' Desktop '), 'desktop');
  assert.equal(normalizeAppTarget(null), '');
});
