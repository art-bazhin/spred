import { computed } from "../computed/computed";
import { atom } from "../atom/atom";
import { recalc } from "../main";

describe('observable', () => {
  const counter = atom(0);
  let unsub: () => any; 
  let num: number;
  const subscriber = jest.fn((value: number) => num = value);

  it('runs subscribers on subscribe', () => {
    unsub = counter.subscribe(subscriber);

    expect(subscriber).toBeCalled();
    expect(num).toBe(0);
  });

  it('runs subscribers on value change', () => {
    counter(1);
    recalc();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(num).toBe(1);
  });

  it('doesn\'t subscribe one subscriber more than 1 time', () => {
    counter.subscribe(subscriber);

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(num).toBe(1);
  });

  it('stops to trigger subscribers after unsubscribe', () => {
    unsub();
    counter(2);
    recalc();

    expect(subscriber).toHaveBeenCalledTimes(2);
    expect(num).toBe(1);
  })
});