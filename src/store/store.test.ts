import { batch } from '../core/core';
import { store } from './store';

interface User {
  id: string;
  name: string;
}

class Custom {
  value = 1;
}

interface TestState {
  users: Record<string, User | undefined>;
  userArr: User[];
  nested: {
    count: number;
    users: Record<string, User | undefined>;
    opt?: number;
    custom: Custom;
  };
  empty: any;
}

const INITIAL_STATE: TestState = {
  users: {
    '1': {
      name: 'John',
      id: '1',
    },
  },
  userArr: [],
  nested: {
    count: 1,
    users: {},
    custom: new Custom(),
  },
  empty: undefined,
};

describe('store', () => {
  const { state, update, select } = store(INITIAL_STATE);

  const stateSpy = jest.fn();
  state.subscribe(stateSpy);

  describe('state signal', () => {
    it('emits new state on every store update', () => {
      expect(stateSpy).toBeCalledTimes(1);
      expect(state().users['1']!.name).toBe('John');

      update((state) => {
        state.users = {
          ...state.users,
          '1': {
            ...state.users['1']!,
            name: 'Paul',
          },
        };
      });

      expect(stateSpy).toBeCalledTimes(2);
      expect(state().users['1']!.name).toBe('Paul');

      update(() => {
        const newState = {
          ...INITIAL_STATE,
          nested: {
            ...INITIAL_STATE.nested,
            count: 1,
          },
        };

        return newState;
      });

      expect(stateSpy).toBeCalledTimes(3);
      expect(state().users['1']!.name).toBe('John');
      expect(state().nested.count).toBe(1);
    });

    describe('select function', () => {
      const users = select('users');
      const nested = select('nested');
      const userArr = select('userArr');

      let usersUnsub: any;

      it('creates a derived store from the field of the parent', () => {
        expect(users.state).toBeDefined();
        expect(users.select).toBeDefined();
        expect(users.update).toBeDefined();
      });

      describe('derived store', () => {
        it('can update itself and the root store', () => {
          const usersSpy = jest.fn();
          usersUnsub = users.state.subscribe(usersSpy);

          expect(usersSpy).toBeCalledTimes(1);

          users.update((state) => {
            state['1'] = {
              id: '1',
              name: 'George',
            };
          });

          expect(stateSpy).toBeCalledTimes(4);
          expect(usersSpy).toBeCalledTimes(2);
          expect(state().users['1']!.name).toBe('George');

          users.select('2').update(() => ({
            id: '2',
            name: 'Ringo',
          }));

          expect(stateSpy).toBeCalledTimes(5);
          expect(usersSpy).toBeCalledTimes(3);
          expect(state().users['2']!.name).toBe('Ringo');
        });

        it('can handle array stores', () => {
          const userArrSpy = jest.fn();
          userArr.state.subscribe(userArrSpy);

          expect(userArrSpy).toBeCalledTimes(1);

          userArr.update((state) => {
            state.push({
              id: '123',
              name: 'Foo',
            });
          });

          expect(stateSpy).toBeCalledTimes(6);
          expect(userArrSpy).toBeCalledTimes(2);
          expect(state().userArr.length).toBe(1);
          expect(state().userArr[0].name).toBe('Foo');
        });

        it('can handle deep nested stores', () => {
          const countStore = nested.select('count');
          expect(countStore.state()).toBe(1);

          countStore.update((state) => state + 1);

          expect(stateSpy).toBeCalledTimes(7);
          expect(state().nested.count).toBe(2);
        });

        it('throws error if a class instance is triggered to update', () => {
          const custom = nested.select('custom');

          const upd = () => {
            custom.update((state) => {
              state.value = 5;
            });
          };

          expect(upd).toThrowError();
        });

        it('does not update the state if the parent state is absent', () => {
          const childOfEmpty = select('empty').select('foo').select('bar');

          expect(childOfEmpty.state()).toBeNull();

          childOfEmpty.update(() => 'test');
          expect(childOfEmpty.state()).toBeNull();
          expect(stateSpy).toBeCalledTimes(7);
        });

        it('can use batching', () => {
          batch(() => {
            nested.select('count').update((state) => state + 1);
            nested.select('count').update((state) => state + 1);

            nested.update((state) => ({
              ...state,
              count: state.count + 1,
            }));

            update((state) => ({
              ...state,
              nested: {
                ...state.nested,
                count: state.nested.count + 1,
              },
            }));

            select('empty').update(() => 'test');
          });

          expect(stateSpy).toBeCalledTimes(8);
          expect(state().nested.count).toBe(6);
          expect(state().empty).toBe('test');
        });

        it('returns same instance on every select before deactivation', () => {
          expect(users).toBe(select('users'));

          usersUnsub();

          expect(users).not.toBe(select('users'));
          expect(select('users')).toBe(select('users'));
        });
      });
    });
  });
});
