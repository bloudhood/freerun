import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CLUB_ALL_DATES_VALUE,
  buildClubDateOptions,
  formatClubQueryTime,
} from '../src/utils/club.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clubSource = fs.readFileSync(path.join(__dirname, '../src/components/Club.vue'), 'utf8');

test('club activity tabs do not repeat the same activity-list label', () => {
  const matches = clubSource.match(/label:\s*'活动列表'/g) || [];
  assert.equal(matches.length, 0);
});

test('club date picker starts from today and sends date-only queryTime', () => {
  const options = buildClubDateOptions(new Date('2026-05-13T10:00:00+08:00'));

  assert.notEqual(options[0].value, CLUB_ALL_DATES_VALUE);
  assert.equal(options[0].value, '2026-05-13');
  assert.equal(formatClubQueryTime('2026-05-13'), '2026-05-13');
});
