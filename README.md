# Spred

[![npm](https://img.shields.io/npm/v/spred.svg)](http://npm.im/spred)
[![codecov](https://codecov.io/gh/art-bazhin/spred/branch/master/graph/badge.svg?token=G3AF7HLH7W)](https://codecov.io/gh/art-bazhin/spred)
[![gzip size](http://img.badgesize.io/https://unpkg.com/spred/dist/spred.min.js?compression=gzip&label=gzip)](https://unpkg.com/spred/dist/spred.min.js)

Simple and fast JavaScript reactive programming library.

- **Small.** 3 KB minified and gziped. No dependencies
- **Fast.** No unnecessary calculations and excellent performance
- **Simple.** Small API and autotracking of dependencies
- **Well typed.** Written in TypeScript

## Example

```ts
import { computed, watch, writable } from 'spred';

const formatter = new Intl.DateTimeFormat('en-GB');

const name = writable('Paul');
const instrument = writable('bass');
const birthday = writable('1942-06-18');

const formattedBirthday = computed(() =>
  formatter.format(new Date(birthday()))
);

watch(() => {
  console.log(
    `Hello. My name is ${name()}, I play ${instrument()} and I was born on ${formattedBirthday()}.`
  );
});

// Hello. My name is Paul, I play bass and I was born on 18/06/1942.

name('Ringo');
instrument('drums');
birthday('1940-07-07');

// Hello. My name is Ringo, I play drums and I was born on 07/07/1940.
```

## Installation

```sh
npm install spred --save
```

## Atoms

[Atom](https://art-bazhin.github.io/spred/interfaces/Atom.html) is the basic reactive primitive of the library. An atom stores a value and notifies its subscribers when it changes. There are two kinds of atoms - writable and computed.

### Writable Atoms

[Writable atoms](https://art-bazhin.github.io/spred/interfaces/WritableAtom.html) are created with a [writable](https://art-bazhin.github.io/spred/modules.html#writable) function that takes the initial value of the atom.

```ts
import { writable } from 'spred';

const counter = writable(0);
```

To get the value of the atom, you need to call it without arguments.

```ts
/*...*/

console.log(counter()); // 0
```

To set a new value of the writable atom, you need to pass the value as an argument.

```ts
/*...*/

counter(1);
console.log(counter()); // 1
```

Atom value updates can be subscribed to using the [subscribe](https://art-bazhin.github.io/spred/interfaces/Atom.html#subscribe) method. The second argument of the method specifies whether the function should be called immediately after subscribing, and defaults to true. The method returns the unsubscribe function. By default, atom subscribers are only triggered when its value changes.

```ts
/*...*/

const unsub = counter.subscribe((value) =>
  console.log('The value is ' + value)
);

// > The value is 1

counter(2);

// > The value is 2

counter(2);

// nothing
```

Atom value updates are grouped to prevent unnecessary calculations and applied on the next browser tick.

```ts
/*...*/

counter(3);
counter(4);
counter(5);

// > The value is 5
```

### Computed Atoms

Computed atoms automatically track their dependencies and recalculate their value when any of the dependencies changes.
A computed atom can be created using the [computed](https://art-bazhin.github.io/spred/modules.html#computed) function. It takes as its argument a function that calculates the value of the atom and depends only on other atom values.

```ts
import { writable, computed } from 'spred';

const counter = writable(0);
const doubleCounter = computed(() => counter() * 2);

doubleCounter.subscribe((value) => console.log('Double value is ' + value));

// > Double value is 0

counter(1);

// > Double value is 2
```

## TODO
