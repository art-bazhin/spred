import { writable, WritableSignal } from './writable/writable';
import { computed } from './computed/computed';
import { configure, Config } from './config/config';
import { Signal } from './signal/signal';
import { watch } from './watch/watch';
import {
  batch,
  Subscriber,
  get,
  set,
  subscribe,
  createSignalState,
  SignalOptions,
  Computation,
} from './core/core';
import { on } from './on/on';
import {
  effect,
  Effect,
  EffectStatus,
  EffectStatusObject,
} from './effect/effect';
import {
  isSignal,
  isWritableSignal,
  getValue,
  sampleValue,
} from './guards/guards';
import { isolate } from './isolate/isolate';
import { collect } from './collect/collect';
import { VOID } from './utils/constants';

const __INTERNAL__ = {
  get,
  set,
  subscribe,
  createSignalState,
};

export {
  Signal,
  WritableSignal,
  SignalOptions,
  Effect,
  EffectStatus,
  EffectStatusObject,
  Config,
  Subscriber,
  Computation,
  writable,
  computed,
  watch,
  batch,
  on,
  effect,
  configure,
  isSignal,
  isWritableSignal,
  getValue,
  sampleValue,
  isolate,
  collect,
  VOID,
  __INTERNAL__,
};
