const DEFAULT_CLUB_AUTO_CONFIG = {
  enabled: false,
  sign_in_lead_minutes: 10,
  sign_out_delay_minutes: 10,
  sign_in_done: false,
  sign_out_done: false,
  last_attempt_at: '',
  last_result: '',
  last_action: '',
  last_success_at: '',
};

const { maskToken } = require('./token-store');

function normalizeTarget(value) {
  return `${value || ''}`.trim().replace(/\/+$/, '');
}

function normalizeBoolean(value) {
  return value === true || value === 1 || value === '1' || value === 'true';
}

function normalizePositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

function resolveClubAutoConfig(value = {}) {
  return {
    ...DEFAULT_CLUB_AUTO_CONFIG,
    ...value,
    enabled: normalizeBoolean(value.enabled),
    sign_in_lead_minutes: normalizePositiveInteger(
      value.sign_in_lead_minutes,
      DEFAULT_CLUB_AUTO_CONFIG.sign_in_lead_minutes,
    ),
    sign_out_delay_minutes: normalizePositiveInteger(
      value.sign_out_delay_minutes,
      DEFAULT_CLUB_AUTO_CONFIG.sign_out_delay_minutes,
    ),
  };
}

function parseDateTime(value) {
  const raw = `${value || ''}`.trim();
  if (!raw) return null;

  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDateTime(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '';
  return [
    value.getFullYear(),
    pad2(value.getMonth() + 1),
    pad2(value.getDate()),
  ].join('-') + ` ${pad2(value.getHours())}:${pad2(value.getMinutes())}:${pad2(value.getSeconds())}`;
}

function addMinutes(date, minutes) {
  if (!date) return null;
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function isSigned(value) {
  return Number(value) === 1;
}

function normalizeClubTask(value) {
  if (!value || typeof value !== 'object') return null;
  const activityId = Number(value.activityId || value.activity_id || value.clubActivityId || value.configurationId);
  if (!Number.isFinite(activityId) || activityId <= 0) return null;

  return {
    ...value,
    activityId,
    activityName: String(value.activityName || value.activity_name || value.itemName || ''),
    startTime: String(value.startTime || value.start_time || value.yymmdd || ''),
    endTime: String(value.endTime || value.end_time || ''),
    signInTime: String(value.signInTime || value.sign_in_time_text || value.signInTimeText || value.startTime || ''),
    signBackLimitTime: String(
      value.signBackLimitTime || value.signBackLimitTimeText || value.sign_back_limit_time_text || value.endTime || '',
    ),
    signInStatus: Number(value.signInStatus || value.sign_in_status || 0),
    signBackStatus: Number(value.signBackStatus || value.sign_back_status || 0),
    latitude: String(value.latitude || ''),
    longitude: String(value.longitude || ''),
  };
}

function resolveClubStatus({ config = {}, task = null, now = new Date() } = {}) {
  const resolvedConfig = resolveClubAutoConfig(config);
  const normalizedTask = normalizeClubTask(task);
  const signInTime = parseDateTime(normalizedTask?.signInTime);
  const signBackLimitTime = parseDateTime(normalizedTask?.signBackLimitTime);
  const signInWindowAt = addMinutes(signInTime, -resolvedConfig.sign_in_lead_minutes);
  const signOutWindowAt = addMinutes(signBackLimitTime, resolvedConfig.sign_out_delay_minutes);
  const nowTime = now instanceof Date ? now : new Date(now);
  const hasTask = !!normalizedTask;
  const signInDone = hasTask && isSigned(normalizedTask.signInStatus);
  const signOutDone = hasTask && isSigned(normalizedTask.signBackStatus);

  const shouldSignIn =
    resolvedConfig.enabled &&
    hasTask &&
    !signInDone &&
    !!signInWindowAt &&
    nowTime.getTime() >= signInWindowAt.getTime();

  const shouldSignOut =
    resolvedConfig.enabled &&
    hasTask &&
    signInDone &&
    !signOutDone &&
    !!signOutWindowAt &&
    nowTime.getTime() >= signOutWindowAt.getTime();

  return {
    enabled: resolvedConfig.enabled ? 1 : 0,
    sign_in_lead_minutes: resolvedConfig.sign_in_lead_minutes,
    sign_out_delay_minutes: resolvedConfig.sign_out_delay_minutes,
    should_sign_in: shouldSignIn,
    should_sign_out: shouldSignOut,
    sign_in_done: signInDone,
    sign_out_done: signOutDone,
    last_attempt_at: resolvedConfig.last_attempt_at || '',
    last_result: resolvedConfig.last_result || '',
    last_action: resolvedConfig.last_action || '',
    last_success_at: resolvedConfig.last_success_at || '',
    has_task: hasTask,
    activity_id: normalizedTask?.activityId || 0,
    activity_name: normalizedTask?.activityName || '',
    start_time: normalizedTask?.startTime || '',
    end_time: normalizedTask?.endTime || '',
    sign_in_status: normalizedTask?.signInStatus || 0,
    sign_back_status: normalizedTask?.signBackStatus || 0,
    sign_in_time_text: normalizedTask?.signInTime || '',
    sign_back_limit_time_text: normalizedTask?.signBackLimitTime || '',
    sign_in_window_at: formatDateTime(signInWindowAt),
    sign_out_window_at: formatDateTime(signOutWindowAt),
  };
}

function resolveStudentId(userInfo = {}) {
  const value = userInfo.studentId || userInfo.studentID || userInfo.student_id;
  const studentId = Number(value);
  return Number.isFinite(studentId) && studentId > 0 ? studentId : 0;
}

async function executeClubAuto({
  token,
  config = {},
  task,
  userInfo,
  unirunRequest,
  now = new Date(),
  force = false,
}) {
  if (typeof unirunRequest !== 'function') {
    throw new Error('unirunRequest is required');
  }

  const status = resolveClubStatus({ config, task, now });
  const normalizedTask = normalizeClubTask(task);
  if (!normalizedTask) {
    return { performed: false, action: '', message: '当前没有可操作的俱乐部签到任务' };
  }

  const studentId = resolveStudentId(userInfo);
  if (!studentId) {
    return { performed: false, action: '', message: '无法获取学生信息，请重新登录' };
  }

  const hasCoordinates = normalizedTask.latitude && normalizedTask.longitude;
  if (!hasCoordinates) {
    return { performed: false, action: '', message: '签到坐标缺失，暂无法执行操作' };
  }

  let action = '';
  let signType = '';
  if (force) {
    if (!isSigned(normalizedTask.signInStatus)) {
      action = 'sign_in';
      signType = '1';
    } else if (!isSigned(normalizedTask.signBackStatus)) {
      action = 'sign_out';
      signType = '2';
    }
  } else if (status.should_sign_in) {
    action = 'sign_in';
    signType = '1';
  } else if (status.should_sign_out) {
    action = 'sign_out';
    signType = '2';
  }

  if (!signType) {
    return { performed: false, action: '', message: '当前未到自动签到/签退时间' };
  }

  const data = await unirunRequest({
    path: '/clubactivity/signInOrSignBack',
    method: 'POST',
    token,
    body: {
      activityId: normalizedTask.activityId,
      latitude: normalizedTask.latitude,
      longitude: normalizedTask.longitude,
      signType,
      studentId,
    },
  });

  if (data?.code !== 10000) {
    throw new Error(data?.msg || data?.message || '俱乐部签到请求失败');
  }

  const actionText = action === 'sign_in' ? '签到' : '签退';
  return {
    performed: true,
    action,
    message: data?.response?.resultDesc || data?.msg || `${actionText}成功`,
    raw: data,
  };
}

async function fetchClubSignTask({ token, userInfo, unirunRequest }) {
  const studentId = resolveStudentId(userInfo);
  if (!studentId) return null;

  const data = await unirunRequest({
    path: '/clubactivity/getSignInTf',
    method: 'GET',
    token,
    query: { studentId },
  });

  if (data?.code !== 10000) return null;
  return normalizeClubTask(data.response);
}

async function joinClubActivity({ token, userInfo, activityId, unirunRequest }) {
  const studentId = resolveStudentId(userInfo);
  const id = Number(activityId);
  if (!studentId || !Number.isFinite(id) || id <= 0) {
    return { performed: false, message: '缺少有效的活动或学生信息' };
  }

  const data = await unirunRequest({
    path: '/clubactivity/joinClubActivity',
    method: 'GET',
    token,
    query: { activityId: id, studentId },
  });

  if (data?.code !== 10000) {
    return { performed: false, message: data?.msg || data?.message || '抢报失败', raw: data };
  }

  return {
    performed: true,
    scheduled: false,
    message: data?.msg || data?.response?.resultDesc || '抢报成功',
    raw: data,
  };
}

function getToken(req) {
  return req.headers.authorization?.replace(/^Bearer\s+/i, '') || '';
}

function ensureTask(tasks, token) {
  if (!tasks[token]) tasks[token] = {};
  if (!tasks[token].club_auto) tasks[token].club_auto = { ...DEFAULT_CLUB_AUTO_CONFIG };
  if (!Array.isArray(tasks[token].club_rush_tasks)) tasks[token].club_rush_tasks = [];
  return tasks[token];
}

function registerClubRoutes(app, context) {
  const { tasks, saveTasks, getUserInfo, unirunRequest, now = () => new Date() } = context;

  app.post('/api/club/status', async (req, res) => {
    const token = getToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
      const taskState = ensureTask(tasks, token);
      const userInfo = taskState.user_info || (await getUserInfo(token));
      const clubTask = await fetchClubSignTask({ token, userInfo, unirunRequest });
      const data = resolveClubStatus({ config: taskState.club_auto, task: clubTask, now: now() });
      return res.json({ success: true, data });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/club/config', async (req, res) => {
    const token = getToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const taskState = ensureTask(tasks, token);
    taskState.club_auto = resolveClubAutoConfig({
      ...taskState.club_auto,
      ...req.body,
      enabled: req.body?.enabled ?? taskState.club_auto.enabled,
    });
    saveTasks();
    return res.json({ success: true, data: taskState.club_auto });
  });

  app.post('/api/club/trigger', async (req, res) => {
    const token = getToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
      const taskState = ensureTask(tasks, token);
      const userInfo = taskState.user_info || (await getUserInfo(token));
      const clubTask = await fetchClubSignTask({ token, userInfo, unirunRequest });
      const result = await executeClubAuto({
        token,
        config: taskState.club_auto,
        task: clubTask,
        userInfo,
        unirunRequest,
        now: now(),
        force: true,
      });

      taskState.club_auto = {
        ...resolveClubAutoConfig(taskState.club_auto),
        last_attempt_at: formatDateTime(now()),
        last_result: result.message,
        last_action: result.action || taskState.club_auto.last_action || '',
        last_success_at: result.performed ? formatDateTime(now()) : taskState.club_auto.last_success_at || '',
      };
      saveTasks();
      return res.json({ success: true, data: { result } });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/club/rush', async (req, res) => {
    const token = getToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });

    try {
      const taskState = ensureTask(tasks, token);
      const userInfo = taskState.user_info || (await getUserInfo(token));
      const activityId = req.body?.activity_id || req.body?.activityId;
      const result = await joinClubActivity({ token, userInfo, activityId, unirunRequest });
      const item = {
        id: Date.now(),
        activity_id: Number(activityId || 0),
        execute_at: formatDateTime(now()),
        status: result.performed ? 'done' : 'failed',
        last_result: result.message,
      };
      taskState.club_rush_tasks = [item, ...(taskState.club_rush_tasks || [])].slice(0, 20);
      saveTasks();
      return res.json({ success: true, data: { result } });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });

  app.post('/api/club/rush/status', (req, res) => {
    const token = getToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const taskState = ensureTask(tasks, token);
    return res.json({ success: true, data: { tasks: taskState.club_rush_tasks || [] } });
  });

  app.post('/api/club/rush/cancel', (req, res) => {
    const token = getToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const taskState = ensureTask(tasks, token);
    const activityId = Number(req.body?.activity_id || req.body?.activityId || 0);
    taskState.club_rush_tasks = (taskState.club_rush_tasks || []).map((task) => {
      if (Number(task.activity_id) === activityId && task.status === 'pending') {
        return { ...task, status: 'cancelled', last_result: '已取消' };
      }
      return task;
    });
    saveTasks();
    return res.json({ success: true, data: { result: { message: '已取消待执行抢报任务' } } });
  });
}

async function runDueClubAutoTasks({ tasks, saveTasks, getUserInfo, unirunRequest, now = () => new Date() }) {
  for (const token of Object.keys(tasks)) {
    const taskState = ensureTask(tasks, token);
    const config = resolveClubAutoConfig(taskState.club_auto);
    if (!config.enabled) continue;

    try {
      const userInfo = taskState.user_info || (await getUserInfo(token));
      const clubTask = await fetchClubSignTask({ token, userInfo, unirunRequest });
      const result = await executeClubAuto({
        token,
        config,
        task: clubTask,
        userInfo,
        unirunRequest,
        now: now(),
        force: false,
      });

      if (result.performed || result.action) {
        taskState.club_auto = {
          ...config,
          last_attempt_at: formatDateTime(now()),
          last_result: result.message,
          last_action: result.action || config.last_action || '',
          last_success_at: result.performed ? formatDateTime(now()) : config.last_success_at || '',
        };
        saveTasks();
      }
    } catch (error) {
      taskState.club_auto = {
        ...config,
        last_attempt_at: formatDateTime(now()),
        last_result: error.message,
      };
      saveTasks();
      console.error(`[club] 自动签到失败 token=${maskToken(token)}: ${error.message}`);
    }
  }
}

module.exports = {
  DEFAULT_CLUB_AUTO_CONFIG,
  executeClubAuto,
  fetchClubSignTask,
  formatDateTime,
  normalizeClubTask,
  normalizeTarget,
  registerClubRoutes,
  resolveClubAutoConfig,
  resolveClubStatus,
  runDueClubAutoTasks,
};
