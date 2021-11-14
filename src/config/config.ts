interface Config {
  batchUpdates?: boolean;
  logException?: (err: Error) => any;
  checkValueChange?: (value: any, prevValue: any) => boolean;
}

const DEFAULT_CONFIG: Config = {
  batchUpdates: true,
  logException: /* istanbul ignore next */ (err: unknown) => console.error(err),
  checkValueChange: (value: any, prevValue: any) =>
    !Object.is(value, prevValue),
};

export const config = Object.assign({}, DEFAULT_CONFIG);

export function configure(configUpdate?: Config) {
  Object.assign(config, configUpdate || DEFAULT_CONFIG);
}
