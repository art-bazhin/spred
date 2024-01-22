import { writable } from '../writable/writable';
import { configure } from './config';

describe('configure function', () => {
  describe('_notificationWrapper property', () => {
    it('sets function which wraps all subscriber notifications', () => {
      const startSpy = jest.fn();
      const endSpy = jest.fn();

      const wrapper = (fn: () => void) => {
        startSpy();
        fn();
        endSpy();
      };

      configure({
        _notificationWrapper: wrapper,
      } as any);

      const counter = writable(0);

      counter.subscribe(() => {
        expect(startSpy).toHaveBeenCalledTimes(1);
        expect(endSpy).toHaveBeenCalledTimes(0);
      }, false);

      counter.set(1);
      expect(endSpy).toHaveBeenCalledTimes(1);
    });
  });
});
