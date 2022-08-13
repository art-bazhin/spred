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
        expect(startSpy).toBeCalledTimes(1);
        expect(endSpy).toBeCalledTimes(0);
      }, false);

      counter(1);
      expect(endSpy).toBeCalledTimes(1);
    });
  });
});
