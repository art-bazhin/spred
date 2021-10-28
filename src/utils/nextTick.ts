
export const nextTick = function() {
  const w : any = window;
  
  if (w.queueMicrotask) {
    return function(func: () => any) {
      queueMicrotask(func);
    };
  }

  const promise = Promise.resolve();

  return function(func: () => any) {
    promise.then(func);
  };
}();