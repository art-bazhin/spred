# Spred

[![npm](https://img.shields.io/npm/v/@spred/core.svg)](http://npm.im/@spred/core)
[![codecov](https://codecov.io/gh/art-bazhin/spred/branch/master/graph/badge.svg?token=G3AF7HLH7W)](https://codecov.io/gh/art-bazhin/spred)
[![gzip size](https://img.badgesize.io/https:/unpkg.com/@spred/core/dist/spred.min.js?label=gzip&compression=gzip)](https://unpkg.com/@spred/core/dist/spred.min.js)

Simple and fast JavaScript reactive programming library.

- **Small.** 2 KB minified and gzipped. No dependencies
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

const formattedBirthday = signal((get) =>
  formatter.format(new Date(get(birthday)))
);

effect((get) =>
  console.log(
    `Hello. My name is ${get(name)}, I play ${get(instrument)} ` +
      `and I was born on ${get(formattedBirthday)}.`
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

[Signal](https://art-bazhin.github.io/spred/classes/Signal.html) is the basic reactive primitive of the library. A signal stores a value and notifies its subscribers when it changes. To create a [writable signal](https://art-bazhin.github.io/spred/classes/WritableSignal.html) you should call the [signal](https://art-bazhin.github.io/spred/functions/signal-1.html) function with an initial value that is not a function.

```ts
import { signal, on } from '@spred/core';

const counter = signal(0);
```

You can get the current value of a signal by the [value](https://art-bazhin.github.io/spred/classes/Signal.html#value) field.

```ts
console.log(counter.value);
// > 0
```

To set a new value of a writable signal, you should call the [set](https://art-bazhin.github.io/spred/classes/WritableSignal.html#set) method with the new value.

```ts
counter.set(1);
console.log(counter.value);
// > 1
```

A call of the [signal](https://art-bazhin.github.io/spred/functions/signal-1.html) function with a function argument creates a computed signal. That signal tracks the dependencies accessed by the passed getter and recalculates its own value when the dependencies change. The return value of the passed computation function must depend only on other signals accessed by the getter.

```ts
const doubleCounter = signal((get) => get(counter) * 2);
console.log(doubleCounter.value);
// > 2
```

Signal value updates can be subscribed to using the [subscribe](https://art-bazhin.github.io/spred/classes/Signal.html#subscribe) method. The second argument of the method specifies whether the function should be called immediately after subscribing, and defaults to true. The method returns the unsubscribe function.

```ts
const unsub = doubleCounter.subscribe((value) =>
  console.log('Double value is ' + value)
);
// > Double value is 2

counter.set(2);
// > Double value is 4

unsub();
counter.set(3);
// Nothing

console.log(doubleCounter.value);
// > 6
```

You can also subscribe to a signal value updates without immediately executing the subscriber using [on](https://art-bazhin.github.io/spred/functions/on.html) function, which is a shorthand for `someSignal.subscribe(someFn, false)`.

```ts
on(doubleCounter, (value) => console.log('Double value is ' + value));
// Nothing

counter.set(4);
// > Double value is 8
```

Computed signals initialize their values lazily. That means that the calculation function triggers only when the signal has at least one subscriber or dependent signal with a subscriber.

## Batching Updates

Writable signal updates are immediate and synchronous.

```ts
import { signal, batch, on, action } from '@spred/core';

const a = signal(0);
const b = signal(0);
const sum = signal((get) => get(a) + get(b));

sum.subscribe((s) => console.log('a + b = ' + s));
// > a + b = 0

a.set(1);
// > a + b = 1

b.set(1);
// > a + b = 2
```

You can commit several updates as a single transaction using the [batch](https://art-bazhin.github.io/spred/functions/batch.html) function.

```ts
batch(() => {
  a.set(2);
  b.set(2);
});
// > a + b = 4
```

You can also wrap your function in [action](https://art-bazhin.github.io/spred/functions/action.html) to batch the updates made during its execution.

```ts
const act = action(() => {
  a.set(3);
  b.set(3);
});

act();
// > a + b = 6
```

All updates made inside subscribers and computations are batched too.

```ts
const trigger = signal(0);

on(trigger, () => {
  a.set(4);
  b.set(4);
});

trigger.set(1);
// > a + b = 8
```

## Change Detection

By default, all signals trigger their dependents and subscribers only if their value changes.

```ts
import { signal } from '@spred/core';

const counter = signal(0);
const doubleCounter = signal((get) => get(counter) * 2);

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

Signals use [Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is) to compare values, but you can set custom equality function in [signal options](https://art-bazhin.github.io/spred/classes/SignalOptions.html).

```ts
const obj = signal(
  { value: 1 },
  {
    equal(a, b) {
      return a.value === (b && b.value);
    },
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
const oddCounter = signal((get) => {
  if (get(counter) % 2) return get(counter);
});

oddCounter.subscribe((value) => console.log('Odd value is ' + value));
// > Odd value is 1

counter.set(2);
// Nothing

counter.set(3);
// > Odd value is 3
```

By design, assigning `undefined` to a writable signal has no effect — such updates are silently ignored.
However, the initial value of a signal can be `undefined`, so the following is valid:

```ts
const userId = signal<string>();

console.log(userId.value);
// > undefined

userId.set(123);
console.log(userId.value);
// > 123
```

In this case, the signal value has the type `string | undefined`, and its initial value is `undefined`.

Assigning `undefined` again later is ignored and won’t trigger updates or propagate changes. To make this behavior clearer and safer, TypeScript prevents calling `someSignal.set(undefined)` altogether.

```ts
userId.set(undefined);
// TypeScript error

console.log(userId.value);
// > 123
```

If you need a truly "empty" assignable value — for example, to explicitly clear the signal — consider using `null` instead:

```ts
const nullableUserId = signal<string | null>(null);

console.log(nullableUserId.value);
// > null

nullableUserId.set(123);
console.log(nullableUserId.value);
// > 123

nullableUserId.set(null);
console.log(nullableUserId.value);
// > null
```

## Effects

[effect](https://art-bazhin.github.io/spred/functions/effect.html) calls the passed function immediately and every time its dependencies change.

```ts
import { signal, effect, batch } from '@spred/core';

const a = signal('Hello');
const b = signal('World');

const dispose = effect((get) => {
  console.log(`${get(a)} ${get(b)}!`);
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

Every signal has lifecycle hooks whose handlers can be set in the [signal options](https://art-bazhin.github.io/spred/classes/SignalOptions.html).

- `onCreate` - the signal is created;
- `onActivate` - the signal becomes active (has at least one subscriber or dependent signal with a subscriber);
- `onDeactivate` - the signal becomes inactive (doesn't have any subscriber or dependent signal with a subscriber);
- `onUpdate` - the signal updates its value;
- `onCleanup` - the signal value is going to be computed or the signal becomes inactive;
- `onException` - an unhandled exception occurs during the signal computation.

[Example on StackBlitz](https://stackblitz.com/edit/spred-lifecycle-hooks?file=index.ts)

## Integration

### Svelte

Spred signals implement [Svelte store contract](https://svelte.dev/docs/svelte-components#script-4-prefix-stores-with-$-to-access-their-values) so you don't need any additional package to use them in Svelte apps.

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
