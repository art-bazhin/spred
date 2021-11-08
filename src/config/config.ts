interface Config {
  async?: boolean;
  logError?: (err: Error) => any;
  checkDirty?: (value: any, prevValue: any) => boolean;
}

const DEFAULT_CONFIG = {
  async: true,
  logError: /* istanbul ignore next */ (err: unknown) => console.error(err),
  checkDirty: (value: any, prevValue: any) => !Object.is(value, prevValue),
};

export const config = Object.assign({}, DEFAULT_CONFIG);

export function configure(configUpdate?: Config) {
  Object.assign(config, configUpdate || DEFAULT_CONFIG);
}
