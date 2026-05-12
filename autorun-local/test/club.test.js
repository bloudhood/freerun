const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_CLUB_AUTO_CONFIG,
  executeClubAuto,
  normalizeTarget,
  resolveClubStatus,
  runDueClubAutoTasks,
} = require('../club');

const sampleTask = {
  activityId: 101,
  activityName: 'Morning club',
  startTime: '2026-05-12 09:00:00',
  endTime: '2026-05-12 11:00:00',
  signInTime: '2026-05-12 09:00:00',
  signBackLimitTime: '2026-05-12 10:00:00',
  signInStatus: 0,
  signBackStatus: 0,
  latitude: '30.123',
  longitude: '104.456',
};

test('normalizes upstream target without trailing slashes', () => {
  assert.equal(normalizeTarget('https://run-lb.tanmasports.com/v1///'), 'https://run-lb.tanmasports.com/v1');
});

test('club status exposes sign windows and pending sign-in action', () => {
  const status = resolveClubStatus({
    config: { ...DEFAULT_CLUB_AUTO_CONFIG, enabled: true },
    task: sampleTask,
    now: new Date('2026-05-12T08:55:00+08:00'),
  });

  assert.equal(status.enabled, 1);
  assert.equal(status.has_task, true);
  assert.equal(status.activity_id, 101);
  assert.equal(status.sign_in_status, 0);
  assert.equal(status.sign_back_status, 0);
  assert.equal(status.sign_in_window_at, '2026-05-12 08:50:00');
  assert.equal(status.sign_out_window_at, '2026-05-12 10:10:00');
  assert.equal(status.should_sign_in, true);
  assert.equal(status.should_sign_out, false);
});

test('executeClubAuto signs in through Unirun when sign-in is due', async () => {
  const calls = [];
  const result = await executeClubAuto({
    token: 'token-a',
    config: { ...DEFAULT_CLUB_AUTO_CONFIG, enabled: true },
    task: sampleTask,
    userInfo: { studentId: 9001 },
    now: new Date('2026-05-12T08:55:00+08:00'),
    force: false,
    unirunRequest: async (request) => {
      calls.push(request);
      return { code: 10000, msg: 'ok', response: { resultDesc: 'signed in' } };
    },
  });

  assert.equal(result.performed, true);
  assert.equal(result.action, 'sign_in');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/clubactivity/signInOrSignBack');
  assert.deepEqual(calls[0].body, {
    activityId: 101,
    latitude: '30.123',
    longitude: '104.456',
    signType: '1',
    studentId: 9001,
  });
});

test('executeClubAuto signs out after sign-out window', async () => {
  const calls = [];
  const result = await executeClubAuto({
    token: 'token-b',
    config: { ...DEFAULT_CLUB_AUTO_CONFIG, enabled: true },
    task: { ...sampleTask, signInStatus: 1, signBackStatus: 0 },
    userInfo: { studentId: 9002 },
    now: new Date('2026-05-12T10:15:00+08:00'),
    force: false,
    unirunRequest: async (request) => {
      calls.push(request);
      return { code: 10000, msg: 'ok', response: { resultDesc: 'signed out' } };
    },
  });

  assert.equal(result.performed, true);
  assert.equal(result.action, 'sign_out');
  assert.equal(calls[0].body.signType, '2');
});

test('executeClubAuto requires a real studentId field', async () => {
  const calls = [];
  const result = await executeClubAuto({
    token: 'token-c',
    config: { ...DEFAULT_CLUB_AUTO_CONFIG, enabled: true },
    task: sampleTask,
    userInfo: { id: 9003, userId: 9004 },
    now: new Date('2026-05-12T08:55:00+08:00'),
    force: false,
    unirunRequest: async (request) => {
      calls.push(request);
      return { code: 10000, msg: 'ok' };
    },
  });

  assert.equal(result.performed, false);
  assert.equal(result.action, '');
  assert.match(result.message, /学生信息/);
  assert.equal(calls.length, 0);
});

test('runDueClubAutoTasks does not persist when an enabled task is not due', async () => {
  const tasks = {
    'token-d': {
      club_auto: { ...DEFAULT_CLUB_AUTO_CONFIG, enabled: true },
      user_info: { studentId: 9005 },
    },
  };
  let saveCount = 0;

  await runDueClubAutoTasks({
    tasks,
    saveTasks: () => {
      saveCount += 1;
    },
    getUserInfo: async () => ({ studentId: 9005 }),
    now: () => new Date('2026-05-12T08:00:00+08:00'),
    unirunRequest: async ({ path }) => {
      if (path === '/clubactivity/getSignInTf') {
        return { code: 10000, response: sampleTask };
      }
      throw new Error(`unexpected request: ${path}`);
    },
  });

  assert.equal(saveCount, 0);
  assert.equal(tasks['token-d'].club_auto.last_attempt_at, '');
  assert.equal(tasks['token-d'].club_auto.last_result, '');
});
