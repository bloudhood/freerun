export function normalizeAppTarget(value) {
  return String(value || '').trim().toLowerCase();
}

export function isDesktopAppTarget(value) {
  return normalizeAppTarget(value) === 'desktop';
}
