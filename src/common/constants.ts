export const NOOP_FN = () => {};

export const COMPUTING = 1 << 0;
export const NOTIFIED = 1 << 1;
export const CHANGED = 1 << 2;
export const FORCED = 1 << 3;
export const HAS_STALE_DEPS = 1 << 4;
export const HAS_EXCEPTION = 1 << 5;
export const FROZEN = 1 << 6;
