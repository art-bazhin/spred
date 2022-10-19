# Spred

[![npm](https://img.shields.io/npm/v/spred.svg)](http://npm.im/spred)
[![codecov](https://codecov.io/gh/art-bazhin/spred/branch/master/graph/badge.svg?token=G3AF7HLH7W)](https://codecov.io/gh/art-bazhin/spred)
[![gzip size](http://img.badgesize.io/https://unpkg.com/spred/dist/spred.min.js?compression=gzip&label=gzip)](https://unpkg.com/spred/dist/spred.min.js)

Simple and fast JavaScript reactive programming library.

- **Small.** 3 KB minified and gziped. No dependencies
- **Fast.** No unnecessary calculations and excellent performance
- **Simple.** Small API and autotracking of dependencies
- **Well typed.** Written in TypeScript

## Basic Example

```ts
import { writable, computed, batch } from 'spred';

const formatter = new Intl.DateTimeFormat('en-GB');

const name = writable('Paul');
const instrument = writable('bass');
const birthday = writable('1942-06-18');

const formattedBirthday = computed(() =>
  formatter.format(new Date(birthday()))
);

const greeting = computed(
  () =>
    `Hello. My name is ${name()}, I play ${instrument()} and I was born on ${formattedBirthday()}.`
);

greeting.subscribe((str) => console.log(str));
// > Hello. My name is Paul, I play bass and I was born on 18/06/1942.

batch(() => {
  name('Ringo');
  instrument('drums');
  birthday('1940-07-07');
});
// > Hello. My name is Ringo, I play drums and I was born on 07/07/1940.
```

[All examples on StackBlitz](https://stackblitz.com/@art-bazhin/collections/spred-examples)

## Installation

```sh
npm install spred --save
```

# v0.28.0 Docs

## Signals

[Signal](https://art-bazhin.github.io/spred/interfaces/Signal.html) is the basic reactive primitive of the library. A signal stores a value and notifies its subscribers when it changes. There are two kinds of signals - writable and computed.

### Writable Signals

[Writable signals](https://art-bazhin.github.io/spred/interfaces/WritableSignal.html) are created with a [writable](https://art-bazhin.github.io/spred/modules.html#writable) function that takes the initial value of the signal.

```ts
import { writable } from 'spred';

const counter = writable(0);
```

To get the value of the signal, you need to call it without arguments.

```ts
/*...*/

console.log(counter()); // 0
```

To set a new value of the writable signal, you need to pass the value as an argument. `undefined` values are ignored.

```ts
/*...*/

counter(1);
console.log(counter()); // 1

counter(undefined);
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

Computed signals automatically track their dependencies and recalculate their value when any of the dependencies triggered.
A computed signal can be created using the [computed](https://art-bazhin.github.io/spred/modules.html#computed) function. It takes as its argument a function that calculates the value of the signal and depends only on other signal values.

Computed signals initialize their values lazily. That means that the calculation function triggers only when the signal has at least one subscriber / dependent signal with a subscriber.

```ts
import { writable, computed } from 'spred';

const counter = writable(0);
const doubleCounter = computed(() => counter() * 2);

doubleCounter.subscribe((value) => console.log('Double value is ' + value));
// > Double value is 0

counter(1);
// > Double value is 2
```

`undefined` values are ignored and can be used to filter signal values.

```ts
/*...*/

const oddCounter = computed(() => {
  if (counter() % 2) return counter();
});

oddCounter.subscribe((value) => console.log('Odd value is ' + value));
// > Odd value is 1

counter(2);
// > Double value is 4

counter(3);
// > Double value is 6
// > Odd value is 3
```

### Memo Signals

Memo signal is a computed signal that triggers its dependants and subscribers only if its value changes. It can be created using [memo](https://art-bazhin.github.io/spred/modules.html#memo) function.

```ts
import { writable, computed, memo } from 'spred';

const counter = writable(0);
const doubleCounter = computed(() => counter() * 2);
const memoDoubleCounter = memo(() => counter() * 2);

doubleCounter.subscribe((value) =>
  console.log('Computed double value is ' + value)
);

memoDoubleCounter.subscribe((value) =>
  console.log('Memo double value is ' + value)
);
// > Computed double value is 0
// > Memo double value is 0

counter(0);
// > Computed double value is 0

counter(1);
// > Computed double value is 2
// > Memo double value is 2
```

By default it uses [Object.is](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is) to compare values. A custom equality function can be passed as a second argument.

```ts
/*...*/

const obj = writable({ value: 1 });
const memoObj = memo(obj, (a, b) => a.value === b.value);

memoObj.subscribe((obj) => console.log('Object value is ' + obj.value));
// > Object value is 1

obj({ value: 1 });
// Nothing

obj({ value: 2 });
// > Object value is 2
```

### Error Handling

By default any signal that have subscribers and an exception ocured during the computation will log the error in the console and will not cause recalculation of its dependants. You can create a computed signal that handles exceptions using the [catcher](https://art-bazhin.github.io/spred/modules.html#catcher) function.

```ts
import { catcher, computed, writable } from 'spred';

const sub = (value) => console.log('The value is ' + value);
const source = writable(0);
const withError = computed(() => {
  if (source() > 10) throw 'bigger than 10';
  return source();
});
const result = computed(withError);

const unsub = result.subscribe(sub);
// > The value is 0

source(11);
// > [X] bigger than 10

unsub();
const withCatchedError = catcher(result, (e) => e);

withCatchedError.subscribe(sub);
// > The value is bigger than 10

source(20);
// > The value is bigger than 10

source(5);
// > The value is 5
```

### Signal Creation

If you need to create a readonly signal and a separate setter at once, you can use the [signal](https://art-bazhin.github.io/spred/modules.html#signal) function.

```ts
import { signal } from 'spred';

const [counter, setCounter] = signal(0);

counter.subscribe((value) => console.log('The value is ' + value));

// > The value is 0

setCounter(1);

// > The value is 2
```

### Signal As Event Emitter

[on](https://art-bazhin.github.io/spred/modules.html#on) function allows to subscribe to a signal updates without immediate subscriber execution.

```ts
import { on, signal } from 'spred';

const [click, emitClick] = signal();
const unsub = on(click, () => console.log('CLICK'));

document.addEventListener('click', emitClick);
// [> CLICK] on every document click
```

### Batching Updates

Writable signal updates are immediate and synchronous.

```ts
import { batch, computed, on, writable } from 'spred';

const a = writable(0);
const b = writable(0);
const sum = computed(() => a() + b());

sum.subscribe((s) => console.log('a + b = ' + s));
// > a + b = 0

a(1);
// > a + b = 1

b(1);
// > a + b = 2
```

You can commit several updates as a single transaction using the [batch](https://art-bazhin.github.io/spred/modules.html#batch) function.

```ts
/*...*/

batch(() => {
  a(2);
  b(2);
});
// > a + b = 4
```

All updates inside subscriber functions are batched by default.

```ts
const trigger = writable(0);

on(trigger, () => {
  a(3);
  b(3);
});

trigger(1);
// > a + b = 6
```

### Watching

[watch](https://art-bazhin.github.io/spred/modules.html#watch) function calls the passed callback immediately and every time the signals it depends on are triggered.

```ts
import { batch, watch, writable } from 'spred';

const a = writable('Hello');
const b = writable('World');

watch(() => {
  console.log(`${a()} ${b()}!`);
});
// > Hello World!

batch(() => {
  a('Foo');
  b('Bar');
});
// > Foo Bar!
```

### Lifecycle Hooks

Every signal has several lifecycle hooks that can be subscribed to using special functions.

- `onActivate` - emits when the signal becomes active (has at least one subscriber / dependent signal with a subscriber);
- `onDectivate` - emits when the signal becomes inactive (doesn't have any subscriber / dependent signal with a subscriber);
- `onUpdate` - emits when the signal updates its value;
- `onNotifyStart` - emits before notificating signal subscribers;
- `onNotifyEnd` - emits after notificating signal subscribers;
- `onException` - emits when an exception is thrown during the signal computation.

[Example on StackBlitz](https://stackblitz.com/edit/spred-lifecycle-hooks?devToolsHeight=33&file=index.ts)

## Effects

[Effect](https://art-bazhin.github.io/spred/interfaces/Effect.html) is a wrapper for an asynchronous function. It creates auxiliary signals that represent the execution state of the function and its result.

```ts
import { effect, watch } from 'spred';

function fetchUser(id: number) {
  return fetch(`https://swapi.dev/api/people/${id}`).then((res) => res.json());
}

const userFx = effect(fetchUser);
```

Every effect has several signal properties.

- `data` - receives the result of the fulfilled effect;
- `exception` - receives the result of the rejected effect;
- `done` - receives any result of the effect, both fulfilled and rejected;
- `status` - receives status object of the effect;
- `aborted` - emits when effect is aborted or reset during execution, including a call when the previous call is still pending.

```ts
/*...*/

const { data, status, call } = userFx;

watch(() => {
  let html = '';

  switch (status().value) {
    case 'pending':
      html = 'Loading...';
      break;
    case 'rejected':
      html = 'Something went wrong';
      break;
    case 'fulfilled':
      html = `<pre>${JSON.stringify(data(), null, 2)}</pre>`;
  }

  document.body.innerHTML = html;
});

call(1);
```

[Example on StackBlitz](https://stackblitz.com/edit/spred-effects?file=index.ts)

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
