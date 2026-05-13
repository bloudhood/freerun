const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildRunPlan,
  buildTaskStatusPayload,
  computeDurationFromDistance,
} = require('../run-core');

test('autorun duration generation uses the current 6-15 min/km bounds', () => {
  const duration = computeDurationFromDistance(1000, { rng: () => 0.999 });

  assert.ok(duration > 14.9);
  assert.ok(duration <= 15);
});

test('autorun run plan exposes next-run data for AutoConfig', () => {
  const plan = buildRunPlan({
    userInfo: { gender: '1' },
    runStandard: {
      boyOnceDistanceMin: 1000,
      boyOnceDistanceMax: 2000,
      boyOnceTimeMin: 0,
      boyOnceTimeMax: 0,
    },
    rng: () => 0.5,
  });

  assert.ok(plan.runDistance >= 1001);
  assert.ok(plan.runDistance <= 3001);
  assert.ok(plan.runTime > 0);
  assert.ok(plan.paceMinutesPerKm >= 6);
  assert.ok(plan.paceMinutesPerKm <= 15);
});

test('autorun status payload matches AutoConfig field contract', () => {
  const payload = buildTaskStatusPayload(
    {
      enabled: true,
      executed: true,
      last_run_at: '2026-05-13T08:00:00.000Z',
      today_success: true,
      today_result: '成功',
    },
    {
      now: new Date('2026-05-13T10:00:00.000Z'),
      nextRun: {
        runDistance: 1601,
        runTime: 13,
        paceMinutesPerKm: 8.12,
      },
    },
  );

  assert.equal(payload.enabled, 1);
  assert.equal(payload.today_executed, 1);
  assert.equal(payload.today_success, 1);
  assert.equal(payload.today_result, '成功');
  assert.equal(payload.next_run_distance, 1601);
  assert.equal(payload.next_run_time, 13);
  assert.equal(payload.next_run_pace, 8.12);
});
