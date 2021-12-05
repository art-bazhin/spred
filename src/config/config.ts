import { Filter } from '../filter/filter';

interface Config {
  batchUpdates: boolean;
  logException: (e: unknown) => any;
  shouldUpdate: Filter<any>;
}

const DEFAULT_CONFIG: Config = {
  batchUpdates: true,
  logException: /* istanbul ignore next */ (e: unknown) => console.error(e),
  shouldUpdate: (value: any, prevValue?: any) => !Object.is(value, prevValue),
};

export const config = Object.assign({}, DEFAULT_CONFIG);

export function configure(configUpdate?: Partial<Config>) {
  Object.assign(config, configUpdate || DEFAULT_CONFIG);
}
