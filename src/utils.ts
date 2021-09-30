export function removeFromArray<T>(arr: T[], el: T) {
  let cur = null;
  let i = 0;

  while (arr[i] && el !== cur) cur = arr[i++];
  if (el !== cur) return;

  i--;

  while(arr[i]) arr[i] = arr[++i];

  arr.pop();
}