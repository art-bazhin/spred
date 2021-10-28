export interface Config {
  async: boolean;
};

const DEFAULT_CONFIG = {
  async: true
};

export const config = Object.assign({}, DEFAULT_CONFIG);

export function configure(newConfig: Config) {
  Object.assign(config, newConfig);
}
