
export const nextTick = function() {
  const w : any = window;
  
  if (w?.queueMicrotask) {
    return queueMicrotask;
  }

  const promise = Promise.resolve();

  return function(func: () => any) {
    promise.then(func);
  };
}();