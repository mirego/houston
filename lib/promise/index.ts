import { TaskInstance } from '../task/task-instance';
import { Yieldable, YieldableState } from '../yieldables/yieldable';

class PromiseArrayYieldable extends Yieldable {
  functionName: 'all' | 'allSettled' | 'race';
  maybePromises: any[];

  constructor(functionName: 'all' | 'allSettled' | 'race', promises: any[]) {
    super();
    this.functionName = functionName;
    this.maybePromises = promises;
  }

  onYield(state: YieldableState) {
    const arrayFunction: (promises: PromiseLike<any>[]) => Promise<any> =
      Promise[this.functionName].bind(Promise);

    arrayFunction(this.maybePromises)
      .then((values) => state.next(values))
      .catch((error) => state.throw(error));
  }

  onDestroy() {
    this.maybePromises.forEach((maybePromise) => {
      if (maybePromise instanceof TaskInstance) {
        maybePromise.cancel();
        return;
      }

      if (maybePromise instanceof Yieldable) {
        maybePromise.onDestroy();
        return;
      }
    });
  }
}

export const all = <T extends any[]>(promises: T) => {
  return new PromiseArrayYieldable('all', promises);
};

export const allSettled = <T extends any[]>(promises: T) => {
  return new PromiseArrayYieldable('allSettled', promises);
};

export const race = <T extends any[]>(promises: T) => {
  return new PromiseArrayYieldable('race', promises);
};
