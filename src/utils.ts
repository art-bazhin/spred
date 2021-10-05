export function removeFromArray<T>(arr: T[], el: T) {
  let cur = null;
  let i = 0;

  while (arr[i] && el !== cur) cur = arr[i++];
  if (el !== cur) return;

  i--;

  while(arr[i]) arr[i] = arr[++i];

  arr.pop();
}

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