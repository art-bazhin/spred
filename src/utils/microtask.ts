const globalScope = new Function(
  'try{if(this===window)return window}catch(e){return global}'
)();

export const microtask = (function () {
  if (globalScope.queueMicrotask) {
    return queueMicrotask;
  }

  const promise = Promise.resolve();

  return function (func: () => any) {
    promise.then(func);
  };
})();
