import { computed } from '../computed/computed';
import { writable } from '../writable/writable';
import { isSignal, isWritableSignal } from './guards';

describe('guard functions', () => {
  const w = writable('foo');
  const c = computed(() => w);
  const fn = () => {};
  const str = 'bar';

  describe('isSignal', () => {
    it('returns truthy value if the argument is a signal', () => {
      expect(isSignal(w)).toBeTruthy();
      expect(isSignal(c)).toBeTruthy();
      expect(isSignal(fn)).toBeFalsy();
      expect(isSignal(str)).toBeFalsy();
    });
  });

  describe('isWritableSignal', () => {
    it('returns truthy value if the argument is a writable signal', () => {
      expect(isWritableSignal(w)).toBeTruthy();
      expect(isWritableSignal(c)).toBeFalsy();
      expect(isWritableSignal(fn)).toBeFalsy();
      expect(isWritableSignal(str)).toBeFalsy();
    });
  });
});
