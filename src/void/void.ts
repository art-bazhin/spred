/**
 * A constant denoting the uncalculated value of an atom. This value is always ignored when notifying subscribers and updating dependent atoms, so it can be used to filter atom values.
 */
export const VOID: unique symbol = {
  description: 'The value has not been calculated yet.',
} as any;

export type VOID = typeof VOID;
