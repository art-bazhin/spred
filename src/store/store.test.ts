import { Atom } from '../atom/atom';
import { store, Store } from './store';

interface Person {
  id: string;
  name: string;
  surname?: string;
}

describe('store', () => {
  let persons: Store<Person>;
  let ringo: Atom<Person | undefined>;
  let paul: Atom<Person | undefined>;
  let ringoSurname: string | undefined;

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
    const nobody = persons.get('123');
    const sameNobody = persons.get('123');

    paul = persons.get('2');
    ringo = persons.get('4');

    expect(nobody).toBeDefined();
    expect(nobody).toBe(sameNobody);
    expect(nobody()).toBeUndefined();

    expect(ringo).toBeDefined();
    expect(ringo()).toBeDefined();
    expect(ringo()?.name).toBe('Ringo');

    expect(paul()?.name).toBe('Paul');
  });

  it('allows to set items', () => {
    ringo.subscribe((person) => {
      ringoSurname = person && person.surname;
    });

    persons.set(
      { ...ringo()!, surname: 'Starr' },
      { ...paul()!, surname: 'McCartney' }
    );

    expect(paul()?.surname).toBe('McCartney');
    expect(ringo()?.surname).toBe('Starr');
    expect(ringoSurname).toBe('Starr');
  });

  it('allows to delete items', () => {
    persons.delete('4');

    expect(ringo()).toBeUndefined();
    expect(ringoSurname).toBeUndefined();
  });

  it('allows to clear store', () => {
    persons.clear();

    expect(persons.get('1')()).toBeUndefined();
    expect(persons.get('2')()).toBeUndefined();
    expect(persons.get('3')()).toBeUndefined();
  });
});
