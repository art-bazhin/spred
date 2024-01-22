# Spred

[![npm](https://img.shields.io/npm/v/@spred/core.svg)](http://npm.im/@spred/core)
[![codecov](https://codecov.io/gh/art-bazhin/spred/branch/master/graph/badge.svg?token=G3AF7HLH7W)](https://codecov.io/gh/art-bazhin/spred)
[![gzip size](https://img.badgesize.io/https:/unpkg.com/@spred/core/dist/spred.min.js?label=gzip&compression=gzip)](https://unpkg.com/@spred/core/dist/spred.min.js)

Simple and fast JavaScript reactive programming library.

- **Small.** 2 KB minified and gziped. No dependencies
- **Fast.** No unnecessary calculations and excellent performance
- **Simple.** Small API and autotracking of dependencies
- **Well typed.** Written in TypeScript

[API Reference](https://art-bazhin.github.io/spred/modules.html)

## Basic Example

```ts
import { signal, effect, batch } from '@spred/core';

const formatter = new Intl.DateTimeFormat('en-GB');

const name = signal('Paul');
const instrument = signal('bass');
const birthday = signal('1942-06-18');

const formattedBirthday = signal(() =>
  formatter.format(new Date(birthday.get()))
);

effect(() =>
  console.log(
    `Hello. My name is ${name.get()}, I play ${instrument.get()} ` +
      `and I was born on ${formattedBirthday.get()}.`
  )
);
// > Hello. My name is Paul, I play bass and I was born on 18/06/1942.

batch(() => {
  name.set('Ringo');
  instrument.set('drums');
  birthday.set('1940-07-07');
});
// > Hello. My name is Ringo, I play drums and I was born on 07/07/1940.
```

[All examples on StackBlitz](https://stackblitz.com/@art-bazhin/collections/spred-examples)

## Installation

```sh
npm install @spred/core --save
```

## Signals

[Signal](https://art-bazhin.github.io/spred/interfaces/Signal.html) is the basic reactive primitive of the library. A signal stores a value and notifies its subscribers when it changes. To create a [writable signal](https://art-bazhin.github.io/spred/interfaces/WritableSignal.html) you should call the [signal](https://art-bazhin.github.io/spred/functions/signal-1.html) function with an initial value that is not a function.

```ts
import { signal, on } from '@spred/core';

const counter = signal(0);
```

To get the current value of the signal, you need to call the [get](https://art-bazhin.github.io/spred/interfaces/Signal.html#get) method.

```ts
/*...*/

console.log(counter.get());
// > 0
```

To set a new value of a writable signal, you should call the [set](https://art-bazhin.github.io/spred/interfaces/WritableSignal.html#set) method with the new value.

```ts
/*...*/

counter.set(1);
console.log(counter.get());
// > 1
```

A call of the [signal](https://art-bazhin.github.io/spred/functions/signal-1.html) function with a function argument will create a computed signal that automatically tracks dependencies and recalculates its own value when they change. The return value of the passed computation function must only depend on other signals.

```ts
/*...*/

const doubleCounter = signal(() => counter.get() * 2);
console.log(doubleCounter.get());
// > 2
```

Signal value updates can be subscribed to using the [subscribe](https://art-bazhin.github.io/spred/interfaces/Signal.html#subscribe) method. The second argument of the method specifies whether the function should be called immediately after subscribing, and defaults to true. The method returns the unsubscribe function.

```ts
/*...*/

const unsub = doubleCounter.subscribe((value) =>
  console.log('Double value is ' + value)
);
// > Double value is 2

counter.set(2);
// > Double value is 4

unsub();
counter.set(3);
// Nothing

console.log(doubleCounter.get());
// > 6
```

You can also subscribe to a signal value updates without immediately executing the subscriber using [on](https://art-bazhin.github.io/spred/functions/on.html) function, which is a shorthand for `someSignal.subscribe(someFn, false)`.

```ts
/*...*/

on(doubleCounter, (value) => console.log('Double value is ' + value));
// Nothing

counter.set(4);
// > Double value is 8
```

Computed signals initialize their values lazily. That means that the calculation function triggers only when the signal has at least one subscriber / dependent signal with a subscriber.

## Batching Updates

Writable signal updates are immediate and synchronous.

```ts
import { signal, batch, on } from '@spred/core';

const a = signal(0);
const b = signal(0);
const sum = signal(() => a.get() + b.get());

sum.subscribe((s) => console.log('a + b = ' + s));
// > a + b = 0

a.set(1);
// > a + b = 1

b.set(1);
// > a + b = 2
```

You can commit several updates as a single transaction using the [batch](https://art-bazhin.github.io/spred/functions/batch.html) function.

```ts
/*...*/

batch(() => {
  a.set(2);
  b.set(2);
});
// > a + b = 4
```

All updates inside subscriber functions and computations are batched by default.

```ts
const trigger = signal(0);

on(trigger, () => {
  a.set(3);
  b.set(3);
});

trigger.set(1);
// > a + b = 6
```

## Change Detection

By default all signals trigger their dependents and subscribers only if its value changes.

```ts
import { signal } from '@spred/core';

const counter = signal(0);
const doubleCounter = signal(() => counter.get() * 2);

const unsub = doubleCounter.subscribe((value) =>
  console.log('Double value is ' + value)
);
// > Double value is 0

counter.set(0);
// Nothing

counter.set(1);
// > Double value is 2

unsub();
```

Signals use [Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is) to compare values, but you can set custom equality function in [signal options](https://art-bazhin.github.io/spred/interfaces/SignalOptions.html).

```ts
/*...*/

const obj = signal(
  { value: 1 },
  {
    equal: (a, b) => a.value === (b && b.value),
  }
);

obj.subscribe((obj) => console.log('Object value is ' + obj.value));
// > Object value is 1

obj.set({ value: 1 });
// Nothing

obj.set({ value: 2 });
// > Object value is 2
```

Undefined values are ignored and can be used for filtering.

```ts
/*...*/

const oddCounter = signal(() => {
  if (counter.get() % 2) return counter.get();
});

oddCounter.subscribe((value) => console.log('Odd value is ' + value));
// > Odd value is 1

counter.set(2);
// Nothing

counter.set(3);
// Odd value is 3
```

## Error Handling

Any signal that have subscribers and an exception ocured during the computation will log the error in the console and will not cause recalculation of its dependents. You can set an exception handler in the [signal options](https://art-bazhin.github.io/spred/interfaces/SignalOptions.html). It will return the new signal value and stop the exception propagation.

```ts
import { signal } from '@spred/core';

const sub = (value) => console.log('The value is ' + value);
const source = signal(0);
const withError = signal(() => {
  if (source.get() > 10) throw 'bigger than 10';
  return source.get();
});
const result = signal(() => withError.get());

const unsub = result.subscribe(sub);
// > The value is 0

source.set(11);
// > [X] bigger than 10

unsub();
const withCatchedError = signal(() => result.get(), {
  catch(e) {
    return e;
  },
});

withCatchedError.subscribe(sub);
// > The value is bigger than 10

source.set(20);
// Nothing

source.set(5);
// > The value is 5
```

## Effects

[effect](https://art-bazhin.github.io/spred/functions/effect.html) calls the passed function immediately and every time its dependencies change.

```ts
import { signal, effect, batch } from '@spred/core';

const a = signal('Hello');
const b = signal('World');

const dispose = effect(() => {
  console.log(`${a.get()} ${b.get()}!`);
});
// > Hello World!

batch(() => {
  a.set('Foo');
  b.set('Bar');
});
// > Foo Bar!

dispose();
a.set('Hello');
// Nothing
```

Under the hood, the effect is simply a computed signal that becomes active at the moment of creation.

## Lifecycle Hooks

Every signal has lifecycle hooks whose handlers can be set in the [signal options](https://art-bazhin.github.io/spred/interfaces/SignalOptions.html).

- `onActivate` - emits when the signal becomes active (has at least one subscriber / dependent signal with a subscriber);
- `onDectivate` - emits when the signal becomes inactive (doesn't have any subscriber / dependent signal with a subscriber);
- `onUpdate` - emits when the signal updates its value;
- `onException` - emits when an unhandled exception occurs during the signal computation.

```ts
import { signal } from '@spred/core';

const source = signal(0);
const result = signal(
  () => {
    if (source.get() > 10) throw 'ERROR';
    return source.get() * 2;
  },
  {
    onActivate() {
      console.log('ACTIVATE');
    },

    onUpdate(value, prevValue) {
      console.log(`UPDATE ${prevValue} -> ${value}`);
    },

    onException(e) {
      console.log('EXCEPTION ' + e);
    },

    onDeactivate() {
      console.log('DEACTIVATE');
    },
  }
);

const unsub = result.subscribe(() => {});
// > UPDATE undefined -> 2
// > ACTIVATE

source.set(1);
// > UPDATE 0 -> 2

source.set(11);
// > EXCEPTION ERROR
// > [X] ERROR

unsub();
// > DEACTIVATE
```

## Integration

### Svelte

Spred signals implement [Svelte store contract](https://svelte.dev/docs#run-time-svelte-store) so you don't need any additional package to use them in Svelte apps.

[Example on StackBlitz](https://stackblitz.com/edit/spred-svelte?file=src/lib/Counter.svelte)

### React

Use the [spred-react](https://github.com/art-bazhin/spred-react) package.

[Example on StackBlitz](https://stackblitz.com/edit/spred-react?file=App.tsx)

## References

Big thanks for inspiration to

- [cellx](https://github.com/Riim/cellx)
- [effector](https://github.com/effector/effector)
- [SolidJS](https://github.com/solidjs/solid)
- [Vue 3](https://github.com/vuejs/core)
- [nanostores](https://github.com/nanostores/nanostores)
- [$mol](https://github.com/hyoo-ru/mam_mol)
- [preact](https://github.com/preactjs/signals)
- [act](https://github.com/artalar/act)
