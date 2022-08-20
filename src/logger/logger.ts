import { EffectEventName } from '../effect/effect';
import { LifecycleHookName } from '../lifecycle/lifecycle';

type EventName = LifecycleHookName | EffectEventName;

export type Logger = (
  unitName: string,
  eventName: EventName,
  payload: any
) => any;

export function createLogger(opts?: {
  include?: EventName[];
  exclude?: EventName[];
}) {
  const include = opts && opts.include;
  const exclude = opts && opts.exclude;

  function log(unitName: string, ...rest: any[]) {
    console.log(
      `%c[${unitName}]%c`,
      'font-weight: bold',
      'font-weight: normal',
      ...rest
    );
  }

  function createLogFn() {
    return (unitName: string, ...rest: any[]) => {
      let shouldLog = true;

      if (include) shouldLog = include.includes(rest[0]);
      if (exclude) shouldLog = shouldLog && !exclude.includes(rest[0]);

      if (shouldLog) log(unitName, ...rest);
    };
  }

  return createLogFn();
}
