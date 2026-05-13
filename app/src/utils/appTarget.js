import { isDesktopAppTarget, normalizeAppTarget } from './appTarget-core';

export const APP_TARGET = normalizeAppTarget(import.meta.env.VITE_APP_TARGET);
export const IS_DESKTOP_APP = isDesktopAppTarget(APP_TARGET);
