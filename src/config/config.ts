import { Logger } from '../logger/logger';
import { NOOP_FN } from '../utils/constants';

export interface Config {
  logException: (e: unknown) => any;
  logger: Logger | null | false;
}

const DEFAULT_CONFIG: any = {
  logException: /* istanbul ignore next */ (e: unknown) => console.error(e),
  _log: NOOP_FN,
};

export const config = Object.assign({}, DEFAULT_CONFIG);

export function configure(configUpdate?: Partial<Config>) {
  Object.assign(config, configUpdate || DEFAULT_CONFIG);

  if (!config.logger) (config as any)._log = NOOP_FN;
  else (config as any)._log = config.logger;
}
