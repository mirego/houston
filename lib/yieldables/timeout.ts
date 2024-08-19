import { Yieldable, YieldableState } from './yieldable';

class TimeoutYieldable extends Yieldable {
  timeoutMs: number;
  timeoutId?: number;

  constructor(timeoutMs: number) {
    super();
    this.timeoutMs = timeoutMs;
  }

  onYield(state: YieldableState) {
    this.timeoutId = window.setTimeout(() => state.next(), this.timeoutMs);
  }

  onDestroy() {
    clearTimeout(this.timeoutId);
  }
}

export const timeout = (timeoutMs: number) => new TimeoutYieldable(timeoutMs);
