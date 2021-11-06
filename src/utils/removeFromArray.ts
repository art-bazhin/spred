export function removeFromArray<T>(arr: T[], el: T) {
  let i = 0;
  let cur = arr[i];

  while (cur && el !== cur) cur = arr[++i];
  if (!cur) return;

  while (arr[i]) arr[i] = arr[++i];

  arr.pop();
}
