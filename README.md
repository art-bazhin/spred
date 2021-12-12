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

## TODO
