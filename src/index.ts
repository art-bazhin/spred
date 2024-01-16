import { writable, WritableSignal } from './writable/writable';
import {
  onActivate,
  onDeactivate,
  onUpdate,
  onException,
} from './lifecycle/lifecycle';
import { computed } from './computed/computed';
import { configure, Config } from './config/config';
import { Signal } from './signal/signal';
import { watch } from './watch/watch';
import {
  batch,
  Computation,
  Subscriber,
  EqualityFn,
  get,
  set,
  subscribe,
  createSignalState,
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
import { named } from './named/named';
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
  Effect,
  EffectStatus,
  EffectStatusObject,
  Config,
  Subscriber,
  EqualityFn,
  Computation,
  writable,
  computed,
  watch,
  batch,
  on,
  onActivate,
  onDeactivate,
  onUpdate,
  onException,
  effect,
  configure,
  isSignal,
  isWritableSignal,
  getValue,
  sampleValue,
  isolate,
  collect,
  named,
  VOID,
  __INTERNAL__,
};
