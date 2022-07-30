const ERROR_NAME = '[SPRED ERROR]';

export class CircularDependencyError extends Error {
  constructor() {
    super();
    this.name = ERROR_NAME;
    this.message = 'Circular dependency detected';
  }
}

export class SubscriptionInsideComputationError extends Error {
  constructor() {
    super();
    this.name = ERROR_NAME;
    this.message =
      'Subscriptions inside computations are forbidden. Use isolate function';
  }
}
