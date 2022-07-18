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
import { createSignal, createComputed, watch, batch } from 'spred';

const formatter = new Intl.DateTimeFormat('en-GB');

const [name, setName] = createSignal('Paul');
const [instrument, setInstrument] = createSignal('bass');
const [birthday, setBirthday] = createSignal('1942-06-18');

const formattedBirthday = createComputed(() =>
  formatter.format(new Date(birthday()))
);

watch(() => {
  console.log(
    `Hello. My name is ${name()}, I play ${instrument()} and I was born on ${formattedBirthday()}.`
  );
});

// Hello. My name is Paul, I play bass and I was born on 18/06/1942.

batch(() => {
  setName('Ringo');
  setInstrument('drums');
  setBirthday('1940-07-07');
});

// Hello. My name is Ringo, I play drums and I was born on 07/07/1940.
```

## Installation

```sh
npm install spred --save
```

## Signals

[Signal](https://art-bazhin.github.io/spred/interfaces/Signal.html) is the basic reactive primitive of the library. A signal stores a value and notifies its subscribers when it changes. There are two kinds of signals - writable and computed.

### Writable Signals

[Writable signals](https://art-bazhin.github.io/spred/interfaces/WritableSignal.html) are created with a [createWritable](https://art-bazhin.github.io/spred/modules.html#createWritable) function that takes the initial value of the signal.

```ts
import { createWritable } from 'spred';

const counter = createWritable(0);
```

To get the value of the signal, you need to call it without arguments.

```ts
/*...*/

console.log(counter()); // 0
```

To set a new value of the writable signal, you need to pass the value as an argument.

```ts
/*...*/

counter(1);
console.log(counter()); // 1
```

Signal value updates can be subscribed to using the [subscribe](https://art-bazhin.github.io/spred/interfaces/Signal.html#subscribe) method. The second argument of the method specifies whether the function should be called immediately after subscribing, and defaults to true. The method returns the unsubscribe function.

```ts
/*...*/

const unsub = counter.subscribe((value) =>
  console.log('The value is ' + value)
);

// > The value is 1

counter(2);

// > The value is 2
```

### Computed Signals

Computed signals automatically track their dependencies and recalculate their value when any of the dependencies changes.
A computed signal can be created using the [createComputed](https://art-bazhin.github.io/spred/modules.html#createComputed) function. It takes as its argument a function that calculates the value of the signal and depends only on other signal values.

```ts
import { createWritable, createComputed } from 'spred';

const counter = createWritable(0);
const doubleCounter = createComputed(() => counter() * 2);

doubleCounter.subscribe((value) => console.log('Double value is ' + value));

// > Double value is 0

counter(1);

// > Double value is 2
```

### Signal Creation

If you need to create a readonly signal and a separate setter at once, you can use the [createSignal](https://art-bazhin.github.io/spred/modules.html#createSignal) function.

```ts
import { createSignal } from 'spred';

const [counter, setCounter] = createSignal(0);

counter.subscribe((value) => console.log('The value is ' + value));

// > The value is 0

setCounter(1);

// > The value is 2
```

## TODO
