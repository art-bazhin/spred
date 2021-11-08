const global = new Function(
  'try{if(this===window)return window}catch(e){return global}'
)();

export const microtask = (function () {
  if (global.queueMicrotask) {
    return queueMicrotask;
  }

  const promise = Promise.resolve();

  return function (func: () => any) {
    promise.then(func);
  };
})();