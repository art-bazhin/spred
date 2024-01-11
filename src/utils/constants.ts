export const NOOP_FN = () => {};
export const FALSE_FN = () => false;
export const TRUE_FN = () => true;

export const VOID: unique symbol = Object.freeze({}) as any;

export const ACTIVATING_STATUS = 1;
export const SCHEDULED_STATUS = 2;

export const TRACKING = 1 << 0;
export const NOTIFIED = 1 << 1;
export const CHANGED = 1 << 2;
export const ACTIVATING = 1 << 3;
export const FORCED = 1 << 4;
export const HAS_EXCEPTION = 1 << 5;
export const FREEZED = 1 << 6;
