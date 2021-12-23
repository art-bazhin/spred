export interface Config {
  logException: (e: unknown) => any;
}

const DEFAULT_CONFIG: Config = {
  logException: /* istanbul ignore next */ (e: unknown) => console.error(e),
};

export const config = Object.assign({}, DEFAULT_CONFIG);

export function configure(configUpdate?: Partial<Config>) {
  Object.assign(config, configUpdate || DEFAULT_CONFIG);
}
