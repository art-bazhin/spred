/**
 * A library configuration object.
 * @property {Config} logException A function that logs exceptions. Default is console.error.
 */
export interface Config {
  logException: (e: unknown) => any;
}

const DEFAULT_CONFIG: any = {
  logException: /* istanbul ignore next */ (e: unknown) => console.error(e),
};

export const config = Object.assign({}, DEFAULT_CONFIG);

/**
 * Configurates the library. Call without arguments to use the default configuration.
 * @param configUpdate A configuration object.
 */
export function configure(configUpdate?: Partial<Config>) {
  Object.assign(config, configUpdate || DEFAULT_CONFIG);
}
