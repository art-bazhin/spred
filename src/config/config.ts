interface Config {
  batchUpdates?: boolean;
  logException?: (err: Error) => any;
  filter?: (value: any, prevValue: any) => boolean;
}

const DEFAULT_CONFIG = {
  batchUpdates: true,
  logException: /* istanbul ignore next */ (e: unknown) => console.error(e),
  filter: (value: any, prevValue: any) => !Object.is(value, prevValue),
};

export const config = Object.assign({}, DEFAULT_CONFIG);

export function configure(configUpdate?: Config) {
  Object.assign(config, configUpdate || DEFAULT_CONFIG);
}
