import { computed } from '../computed/computed';
import { store } from '../store/store';
import { writable } from '../writable/writable';
import {
  getValue,
  isSignal,
  isStore,
  isWritableSignal,
  sampleValue,
} from './guards';

describe('guard functions', () => {
  const w = writable('foo');
  const c = computed(w);
  const s = store({});
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

  describe('isStore', () => {
    it('returns truthy value if the argument is a store', () => {
      expect(isStore(w)).toBeFalsy();
      expect(isStore(c)).toBeFalsy();
      expect(isStore(fn)).toBeFalsy();
      expect(isStore(str)).toBeFalsy();
      expect(isStore(s)).toBeTruthy();
    });
  });

  describe('get', () => {
    it('returns the argument itself if it is not a signal or a signal value otherwise', () => {
      expect(getValue(w)).toBe('foo');
      expect(getValue(str)).toBe('bar');
    });
  });

  describe('sample', () => {
    it('is same as get but without dependency tracling', () => {
      expect(sampleValue(w)).toBe('foo');
      expect(sampleValue(str)).toBe('bar');
    });
  });
});
