const DEFAULT_DISTANCE_MIN = 1001;
const DEFAULT_DISTANCE_MAX = 9000;
const MIN_PACE_MINUTES_PER_KM = 6;
const MAX_PACE_MINUTES_PER_KM = 15;

const toFiniteNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toPositiveNumber = (value) => {
  const num = toFiniteNumber(value, 0);
  return num > 0 ? num : 0;
};

const toInteger = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? Math.trunc(num) : fallback;
};

function getRandom(rng) {
  if (typeof rng === 'function') {
    const v = Number(rng());
    if (Number.isFinite(v) && v >= 0 && v < 1) return v;
  }
  return Math.random();
}

function randomInt(min, max, rng) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(getRandom(rng) * (hi - lo + 1));
}

function normalizeGender(raw) {
  const gender = String(raw ?? '').trim().toLowerCase();
  if (['1', 'male', 'man', 'm', 'boy', 'nan'].includes(gender)) return 'male';
  if (['2', 'female', 'woman', 'f', 'girl', 'nv'].includes(gender)) return 'female';
  return '';
}

function calculateDistanceBounds(gender, runStandard = {}, defaults = {}) {
  const defaultMin = Math.max(1, Math.trunc(toFiniteNumber(defaults?.min, DEFAULT_DISTANCE_MIN)));
  const defaultMax = Math.max(defaultMin, Math.trunc(toFiniteNumber(defaults?.max, DEFAULT_DISTANCE_MAX)));
  const normalized = normalizeGender(gender);
  const boyMin = toPositiveNumber(runStandard?.boyOnceDistanceMin);
  const girlMin = toPositiveNumber(runStandard?.girlOnceDistanceMin);
  const boyMax = toPositiveNumber(runStandard?.boyOnceDistanceMax);
  const girlMax = toPositiveNumber(runStandard?.girlOnceDistanceMax);

  let onceDistanceMin = 0;
  let onceDistanceMax = 0;

  if (normalized === 'male') {
    onceDistanceMin = boyMin;
    onceDistanceMax = boyMax;
  } else if (normalized === 'female') {
    onceDistanceMin = girlMin;
    onceDistanceMax = girlMax;
  } else {
    onceDistanceMin = Math.max(boyMin, girlMin);
    onceDistanceMax = Math.max(boyMax, girlMax);
  }

  let minDistance = defaultMin;
  let maxDistance = defaultMax;

  if (onceDistanceMin > 0) {
    minDistance = Math.max(1, Math.trunc(onceDistanceMin) + 1);
  }
  if (onceDistanceMax > 0) {
    maxDistance = Math.max(minDistance, Math.trunc(onceDistanceMax) + 1001);
  }
  if (maxDistance < minDistance) maxDistance = minDistance;

  return { min: minDistance, max: maxDistance };
}

function calculateTimeBounds(gender, runStandard = {}) {
  const normalized = normalizeGender(gender);
  const boyMin = toPositiveNumber(runStandard?.boyOnceTimeMin);
  const boyMax = toPositiveNumber(runStandard?.boyOnceTimeMax);
  const girlMin = toPositiveNumber(runStandard?.girlOnceTimeMin);
  const girlMax = toPositiveNumber(runStandard?.girlOnceTimeMax);

  let minTime = 0;
  let maxTime = 0;

  if (normalized === 'male') {
    minTime = boyMin;
    maxTime = boyMax;
  } else if (normalized === 'female') {
    minTime = girlMin;
    maxTime = girlMax;
  } else {
    minTime = boyMin > 0 && girlMin > 0 ? Math.min(boyMin, girlMin) : boyMin || girlMin;
    maxTime = Math.max(boyMax, girlMax);
  }

  if (minTime > 0 && maxTime > 0 && minTime > maxTime) {
    return { min: maxTime, max: minTime };
  }

  return { min: minTime, max: maxTime };
}

function resolveRunBoundsFromStandard(userInfo = {}, runStandard = {}, defaults = {}) {
  const gender = normalizeGender(userInfo?.gender ?? userInfo?.sex);
  const distance = calculateDistanceBounds(gender, runStandard, defaults);
  const time = calculateTimeBounds(gender, runStandard);

  return {
    gender,
    distanceMin: distance.min,
    distanceMax: distance.max,
    timeMin: time.min,
    timeMax: time.max,
  };
}

function avoidRoundedTenValue(value, min, max, rng) {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const current = Math.max(lo, Math.min(Math.trunc(value), hi));
  if (current % 10 !== 0) return current;

  let bestDelta = hi - lo + 1;
  const candidates = [];
  for (let v = lo; v <= hi; v += 1) {
    if (v % 10 === 0) continue;
    const delta = Math.abs(v - current);
    if (delta < bestDelta) {
      bestDelta = delta;
      candidates.length = 0;
      candidates.push(v);
    } else if (delta === bestDelta) {
      candidates.push(v);
    }
  }

  if (!candidates.length) return current;
  return candidates[randomInt(0, candidates.length - 1, rng)];
}

function randomIntNonThousand(min = DEFAULT_DISTANCE_MIN, max = DEFAULT_DISTANCE_MAX, rng) {
  let lo = toInteger(min, DEFAULT_DISTANCE_MIN);
  let hi = toInteger(max, DEFAULT_DISTANCE_MAX);
  if (lo > hi) {
    const tmp = lo;
    lo = hi;
    hi = tmp;
  }

  if (lo === hi) return avoidRoundedTenValue(lo, lo, hi, rng);

  const span = hi - lo + 1;
  for (let i = 0; i < 64; i += 1) {
    const v = lo + Math.floor(getRandom(rng) * span);
    if (v % 10 !== 0) return v;
  }
  return avoidRoundedTenValue(lo + Math.floor(getRandom(rng) * span), lo, hi, rng);
}

function avoidMultipleOf(value, modulus = 1000, opts = {}) {
  const current = Number(value) || 0;
  if (!modulus || current % modulus !== 0) return current;

  const minOffset = toInteger(opts?.min, 1);
  const maxOffset = toInteger(opts?.max, 59);
  return current + randomInt(Math.min(minOffset, maxOffset), Math.max(minOffset, maxOffset), opts?.rng);
}

function computeDurationFromDistance(distanceMeters, opts = {}) {
  const dist = toFiniteNumber(distanceMeters, 0);
  if (dist <= 0) return 0;

  let minMinutes = toPositiveNumber(opts?.minMinutes);
  let maxMinutes = toPositiveNumber(opts?.maxMinutes);
  if (minMinutes > 0 && maxMinutes > 0 && minMinutes > maxMinutes) {
    const tmp = minMinutes;
    minMinutes = maxMinutes;
    maxMinutes = tmp;
  }

  const rng = opts?.rng;
  const km = dist / 1000;
  let minPace = MIN_PACE_MINUTES_PER_KM;
  let maxPace = MAX_PACE_MINUTES_PER_KM;
  if (minMinutes > 0) minPace = Math.max(minPace, minMinutes / km);
  if (maxMinutes > 0) maxPace = Math.min(maxPace, maxMinutes / km);

  const pace =
    minPace <= maxPace
      ? minPace + (maxPace - minPace) * getRandom(rng)
      : MIN_PACE_MINUTES_PER_KM +
        (MAX_PACE_MINUTES_PER_KM - MIN_PACE_MINUTES_PER_KM) * getRandom(rng);
  let seconds = Math.round(km * pace * 60);
  if (seconds % 1000 === 0) {
    seconds = avoidMultipleOf(seconds, 1000, { min: 5, max: 59, rng });
  }

  let duration = Math.max(1, seconds / 60);
  if (minMinutes > 0 && duration < minMinutes) duration = minMinutes;
  if (maxMinutes > 0 && duration > maxMinutes) duration = maxMinutes;
  return Number(duration.toFixed(1));
}

function deriveRoundedRunTimeBounds(distanceMeters, minMinutes = 0, maxMinutes = 0) {
  const dist = toPositiveNumber(distanceMeters);
  let minRounded = minMinutes > 0 ? Math.ceil(minMinutes) : 1;
  let maxRounded = maxMinutes > 0 ? Math.floor(maxMinutes) : 0;

  if (dist > 0) {
    const km = dist / 1000;
    minRounded = Math.max(minRounded, Math.ceil(km * MIN_PACE_MINUTES_PER_KM));
    const paceMaxRounded = Math.floor(km * MAX_PACE_MINUTES_PER_KM);
    if (paceMaxRounded > 0 && (maxRounded === 0 || paceMaxRounded < maxRounded)) {
      maxRounded = paceMaxRounded;
    }
  }

  if (maxRounded > 0 && maxRounded < minRounded) maxRounded = minRounded;
  if (minRounded < 1) minRounded = 1;
  return { minRounded, maxRounded };
}

function avoidRoundedTenMinute(value, minBound = 1, maxBound = 0, rng) {
  let current = Math.max(1, Math.trunc(value));
  const lowerBound = Math.max(1, Math.trunc(minBound));
  let upperBound = Math.trunc(maxBound);
  if (upperBound > 0 && upperBound < lowerBound) upperBound = lowerBound;
  if (current % 10 !== 0) return current;

  if (upperBound > 0) {
    const adjusted = avoidRoundedTenValue(current, lowerBound, upperBound, rng);
    if (adjusted % 10 !== 0) return adjusted;
  }

  for (let step = 1; step <= 9; step += 1) {
    const up = current + step;
    if (up >= lowerBound && up % 10 !== 0) return up;
    const down = current - step;
    if (down >= lowerBound && down % 10 !== 0) return down;
  }

  current += 1;
  if (current < lowerBound) current = lowerBound;
  if (current % 10 === 0) current += 1;
  return current;
}

function normalizeRoundedRunTime(runTimeMinutes, distanceMeters, opts = {}) {
  const rng = opts?.rng;
  const minMinutes = toPositiveNumber(opts?.minMinutes);
  const maxMinutes = toPositiveNumber(opts?.maxMinutes);

  let rounded = toFiniteNumber(runTimeMinutes, 0);
  if (rounded < 1) rounded = 1;

  const { minRounded, maxRounded } = deriveRoundedRunTimeBounds(distanceMeters, minMinutes, maxMinutes);
  const roundedMinutes = Math.floor(rounded);
  let adjusted = roundedMinutes < minRounded ? minRounded : roundedMinutes;
  if (maxRounded > 0 && adjusted > maxRounded) adjusted = maxRounded;

  adjusted = avoidRoundedTenMinute(adjusted, minRounded, maxRounded, rng);
  if (adjusted < minRounded) adjusted = minRounded;
  if (maxRounded > 0 && adjusted > maxRounded) adjusted = maxRounded;
  if (adjusted < 1) adjusted = 1;

  const seconds = (rounded - Math.floor(rounded)) * 60;
  return Number((adjusted + seconds / 60).toFixed(1));
}

function calculatePaceMinutesPerKm(distanceMeters, durationMinutes) {
  const distance = toFiniteNumber(distanceMeters, 0);
  const duration = toFiniteNumber(durationMinutes, 0);
  if (distance <= 0 || duration <= 0) return 0;
  const pace = duration / (distance / 1000);
  return Number.isFinite(pace) ? Number(pace.toFixed(2)) : 0;
}

function buildRunPlan({ userInfo = {}, runStandard = {}, rng } = {}) {
  const bounds = resolveRunBoundsFromStandard(userInfo, runStandard);
  const runDistance = randomIntNonThousand(bounds.distanceMin, bounds.distanceMax, rng);
  const duration = computeDurationFromDistance(runDistance, {
    minMinutes: bounds.timeMin,
    maxMinutes: bounds.timeMax,
    rng,
  });
  const runTime = normalizeRoundedRunTime(duration, runDistance, {
    minMinutes: bounds.timeMin,
    maxMinutes: bounds.timeMax,
    rng,
  });

  return {
    runDistance,
    runTime,
    paceMinutesPerKm: calculatePaceMinutesPerKm(runDistance, runTime),
  };
}

function datePart(value) {
  const raw = String(value || '').trim();
  const match = raw.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : '';
}

function isTruthyFlag(value) {
  return value === true || value === 1 || value === '1';
}

function buildTaskStatusPayload(task = {}, { now = new Date(), nextRun = null } = {}) {
  const current = task || {};
  const today = datePart(now.toISOString());
  const lastRunAt = current.last_run_at || null;
  const lastAttemptAt = current.last_attempt_at || '';
  const lastRunToday = datePart(lastRunAt) === today;
  const lastAttemptToday = datePart(lastAttemptAt) === today;
  const explicitTodayExecuted =
    current.today_executed !== undefined && current.today_executed !== null
      ? isTruthyFlag(current.today_executed)
      : null;
  const todayExecuted =
    explicitTodayExecuted !== null ? explicitTodayExecuted : !!current.executed && (lastRunToday || !lastRunAt);
  const todaySuccess =
    current.today_success !== undefined && current.today_success !== null
      ? isTruthyFlag(current.today_success)
      : todayExecuted && (lastRunToday || !!current.executed);
  const result = String(current.today_result || current.last_result || '').trim();

  return {
    enabled: isTruthyFlag(current.enabled) ? 1 : 0,
    executed: isTruthyFlag(current.executed),
    last_run_at: lastRunAt,
    last_attempt_at: lastAttemptAt,
    today_executed: todayExecuted || lastAttemptToday ? 1 : 0,
    today_success: todaySuccess ? 1 : 0,
    today_result: result || (todaySuccess ? '成功' : ''),
    last_scheduled: current.last_scheduled || current.cron || '',
    next_run_distance: Number(nextRun?.runDistance || 0),
    next_run_time: Number(nextRun?.runTime || 0),
    next_run_pace: Number(nextRun?.paceMinutesPerKm || 0),
  };
}

module.exports = {
  DEFAULT_DISTANCE_MIN,
  DEFAULT_DISTANCE_MAX,
  MIN_PACE_MINUTES_PER_KM,
  MAX_PACE_MINUTES_PER_KM,
  buildRunPlan,
  buildTaskStatusPayload,
  calculatePaceMinutesPerKm,
  computeDurationFromDistance,
  normalizeRoundedRunTime,
  randomIntNonThousand,
  resolveRunBoundsFromStandard,
};
