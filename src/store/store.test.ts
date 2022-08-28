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
  parent: {
    empty: any;
  };
  child: number;
  childObj: {
    value: number;
  };
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
  parent: {
    empty: undefined,
  },
  child: 1,
  childObj: {
    value: 1,
  },
};

describe('store', () => {
  const state = store(INITIAL_STATE);

  const stateSpy = jest.fn();
  state.subscribe(stateSpy);

  describe('state signal', () => {
    it('emits new state on every store update', () => {
      expect(stateSpy).toBeCalledTimes(1);
      expect(state().users['1']!.name).toBe('John');

      state.update((state) => {
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

      state.update(() => {
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
      const users = state.select('users');
      const nested = state.select('nested');
      const userArr = state.select('userArr');

      let usersUnsub: any;

      it('creates a derived store from the field of the parent', () => {
        expect(users).toBeDefined();
        expect(users.select).toBeDefined();
        expect(users.update).toBeDefined();
      });

      describe('derived store', () => {
        it('can update itself and the root store', () => {
          const usersSpy = jest.fn();
          usersUnsub = users.subscribe(usersSpy);

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
          userArr.subscribe(userArrSpy);

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
          expect(countStore()).toBe(1);

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
          const childOfEmpty = state
            .select('empty')
            .select('foo')
            .select('bar');

          expect(childOfEmpty()).toBeNull();

          childOfEmpty.update(() => 'test');
          expect(childOfEmpty()).toBeNull();
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

            state.update((state) => ({
              ...state,
              nested: {
                ...state.nested,
                count: state.nested.count + 1,
              },
            }));

            state.select('empty').update(() => 'test');
          });

          expect(stateSpy).toBeCalledTimes(8);
          expect(state().nested.count).toBe(6);
          expect(state().empty).toBe('test');
        });

        it('can use batching (case 2)', () => {
          batch(() => {
            nested.select('count').set(1);
            nested.select('count').update((state) => state + 1);
          });

          expect(state().nested.count).toBe(2);
        });

        it('returns same instance on every select before deactivation', () => {
          expect(users).toBe(state.select('users'));

          usersUnsub();

          expect(users).not.toBe(state.select('users'));
          expect(state.select('users')).toBe(state.select('users'));
        });

        it('can take a new state as an argument of the set method', () => {
          users.set({
            '1': {
              name: 'Freddy',
              id: '1',
            },
          });
          expect(users.select('1')()!.name).toBe('Freddy');

          state.set(INITIAL_STATE);
          expect(users.select('1')()!.name).toBe('John');
        });
      });
    });
  });

  describe('update and set methods with the key argument', () => {
    it('update the state field by the key', () => {
      state.set('child', 2);
      expect(state().child).toBe(2);

      state.update('child', (state) => state * 2);
      expect(state().child).toBe(4);

      state.update('childObj', (state) => {
        state.value = 10;
      });
      expect(state().childObj.value).toBe(10);
    });

    it('do nothing if the store is empty', () => {
      const emptyState = store(null as any);

      emptyState.set('child', 2);
      expect(emptyState()).toBe(null);
    });

    it('do nothing if the store is empty', () => {
      const emptyState = store(null as any);

      emptyState.set('child', 2);
      expect(emptyState()).toBe(null);

      emptyState.update('child', (state: any) => state + 1);
      expect(emptyState()).toBe(null);
    });
  });

  it('can use batching', () => {
    const state = store(1);

    batch(() => {
      state.update((state) => state + 1);
      state.set(10);
      state.update((state) => state + 1);
    });

    expect(state()).toBe(11);
  });
});
