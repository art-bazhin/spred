import { Signal } from '../signal/signal';
import { store, Store } from './store';
import { writable } from '../writable/writable';
import { computed } from '../computed/computed';
import { batch } from '../core/core';
import { on } from '../on/on';

interface Person {
  id: string;
  name: string;
  surname?: string;
}

describe('store', () => {
  let persons: Store<Person>;
  let ringo: Signal<Person | null>;
  let paul: Signal<Person | null>;
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

  it('allows to get the item writable by id', () => {
    const nobody = persons.getSignal('123');
    const sameNobody = persons.getSignal('123');

    paul = persons.getSignal('2');
    ringo = persons.getSignal('4');

    expect(nobody).toBeDefined();
    expect(nobody).toBe(sameNobody);
    expect(nobody()).toBeNull();

    expect(ringo).toBeDefined();
    expect(ringo()).toBeDefined();
    expect(ringo()?.name).toBe('Ringo');

    expect(paul()?.name).toBe('Paul');
  });

  it('allows to set items', () => {
    ringo.subscribe((person: any) => {
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

  it('does not cause redundant calculations', () => {
    const subscriber = jest.fn();
    const id5Subscriber = jest.fn();

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

    itemStore.getSignal('5').subscribe(id5Subscriber, false);

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
    expect(id5Subscriber).toBeCalledTimes(0);
  });

  describe('data property', () => {
    it('pass data to subscribers in every update', () => {
      const items = store<any>();
      const spy = jest.fn();

      on(items.data, spy);

      items.set({ id: '1', value: 1 });
      items.set({ id: '2', value: 2 });
      items.delete('1');
      items.delete('2');
      items.clear();

      expect(spy).toBeCalledTimes(5);
    });
  });
});
