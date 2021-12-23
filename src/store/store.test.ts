import { Atom } from '../atom/atom';
import { store, Store } from './store';
import { writable } from '../writable/writable';
import { computed } from '../computed/computed';
import { batch } from '..';

interface Person {
  id: string;
  name: string;
  surname?: string;
}

describe('store', () => {
  let persons: Store<Person>;
  let ringo: Atom<Person | null>;
  let paul: Atom<Person | null>;
  let ringoSurname: string | null;

  it('is created by store function', () => {
    persons = store();
    expect(persons).toBeDefined();

    persons = store([
      {
        id: '1',
        name: 'John',
      },
      {
        id: '2',
        name: 'Paul',
      },
      {
        id: '3',
        name: 'George',
      },
      {
        id: '4',
        name: 'Ringo',
      },
    ]);

    expect(persons).toBeDefined();
  });

  it('allows to get the item atom by id', () => {
    const nobody = persons.getAtom('123');
    const sameNobody = persons.getAtom('123');

    paul = persons.getAtom('2');
    ringo = persons.getAtom('4');

    expect(nobody).toBeDefined();
    expect(nobody).toBe(sameNobody);
    expect(nobody()).toBeNull();

    expect(ringo).toBeDefined();
    expect(ringo()).toBeDefined();
    expect(ringo()?.name).toBe('Ringo');

    expect(paul()?.name).toBe('Paul');
  });

  it('allows to set items', () => {
    ringo.subscribe((person) => {
      ringoSurname = (person && person.surname) || null;
    });

    persons.set([
      { id: '5', name: 'Pete' },
      { ...ringo()!, surname: 'Starr' },
      { ...paul()!, surname: 'McCartney' },
    ]);

    expect(persons.get('5')?.name).toBe('Pete');
    expect(paul()?.surname).toBe('McCartney');
    expect(ringo()?.surname).toBe('Starr');
    expect(ringoSurname).toBe('Starr');
  });

  it('allows to delete items', () => {
    persons.delete('4');
    persons.delete('1234');

    expect(ringo()).toBeNull();
    expect(ringoSurname).toBeNull();
  });

  it('allows to clear store', () => {
    persons.clear();

    expect(persons.get('1')).toBeNull();
    expect(persons.get('2')).toBeNull();
    expect(persons.get('3')).toBeNull();
    expect(persons.get('4')).toBeNull();
    expect(persons.get('5')).toBeNull();
  });

  it('it updates previously created items after clearing', () => {
    persons.set([
      {
        id: '4',
        name: '4',
        surname: '4',
      },
      { id: '2', name: '2' },
    ]);

    expect(paul()?.name).toBe('2');
    expect(ringoSurname).toBe('4');
  });

  it('uses shouldUpdate option to check if the value needs to be updated', () => {
    const testStore = store<{ id: string; num: number }>([], {
      shouldUpdate: (value, prevValue) =>
        (value && value.num) !== (prevValue && prevValue.num),
    });

    const atom = testStore.getAtom('1');
    const subscriber = jest.fn();

    atom.subscribe(subscriber, false);

    testStore.set({ id: '1', num: 6 });
    expect(subscriber).toBeCalledTimes(1);

    testStore.set({ id: '1', num: 6 });
    expect(subscriber).toBeCalledTimes(1);

    testStore.set({ id: '1', num: 8 });
    expect(subscriber).toBeCalledTimes(2);
  });

  it('does not cause redundant calculations', () => {
    const subscriber = jest.fn();

    const items = [
      {
        id: '1',
        text: 'one',
      },
      {
        id: '2',
        text: 'two',
      },
      {
        id: '3',
        text: 'three',
      },
      {
        id: '4',
        text: 'four',
      },
      {
        id: '5',
        text: 'five',
      },
    ];

    const itemStore = store(items);

    const ids = items.map((item) => item.id);

    const $ids = writable(ids);
    const $itemList = computed(() => $ids().map((id) => itemStore.get(id)));

    $itemList.subscribe(subscriber, false);

    batch(() => {
      itemStore.set({
        id: '1',
        text: 'foo',
      });

      itemStore.set({
        id: '2',
        text: 'bar',
      });

      itemStore.set({
        id: '3',
        text: 'hello',
      });
    });

    expect(subscriber).toBeCalledTimes(1);

    batch(() => {
      itemStore.delete('1');
      itemStore.delete('2');
      itemStore.delete('3');
    });

    expect(subscriber).toBeCalledTimes(2);
  });
});
