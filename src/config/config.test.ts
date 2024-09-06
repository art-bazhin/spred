import { signal, configure } from '..';

describe('configure function', () => {
  describe('logException property', () => {
    it('sets exception logging function', () => {
      const logException = jest.fn();

      configure({ logException });

      const comp = signal((get) => {
        throw 'ERRROR';
      });

      comp.get();
      expect(logException).toHaveBeenCalledTimes(1);

      configure();
    });
  });
});
