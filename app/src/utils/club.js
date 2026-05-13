export const CLUB_ALL_DATES_VALUE = 'all';

const WEEKDAY_TEXT = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '日',
};

export function formatDateValue(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function resolveWeekDayNumber(date) {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

export function formatClubQueryTime(value) {
  const raw = String(value || '').trim().replace(/\//g, '-');
  if (!raw || raw === CLUB_ALL_DATES_VALUE) return '';

  const datePart = raw.split(' ')[0].split('T')[0];
  const match = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return '';

  const year = match[1];
  const month = match[2].padStart(2, '0');
  const day = match[3].padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildClubDateOptions(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start.getFullYear(), 11, 31);
  const result = [];

  const current = new Date(start);
  while (current <= end) {
    const weekDay = resolveWeekDayNumber(current);
    result.push({
      value: formatDateValue(current),
      label: `周${WEEKDAY_TEXT[weekDay]}`,
    });
    current.setDate(current.getDate() + 1);
  }

  return result;
}
