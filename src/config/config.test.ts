import { signal } from '../signal/signal';
import { configure } from './config';

describe('configure function', () => {
  describe('logException property', () => {
    it('sets exception logging function', () => {
      const logException = jest.fn();

      configure({ logException });

      const comp = signal(() => {
        throw 'ERRROR';
      });

      comp.get();
      expect(logException).toHaveBeenCalledTimes(1);

      configure();
    });
  });
});
