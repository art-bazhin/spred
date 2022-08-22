const ERROR_NAME = '[SPRED ERROR]';

export class CircularDependencyError extends Error {
  constructor() {
    super();
    this.name = ERROR_NAME;
    this.message = 'Circular dependency detected';
  }
}

export class StateTypeError extends Error {
  constructor() {
    super();
    this.name = ERROR_NAME;
    this.message =
      'State data must be a plain object or an array or a primitive';
  }
}
