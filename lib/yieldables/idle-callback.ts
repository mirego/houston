import { Yieldable, YieldableState } from './yieldable';

class IdleCallbackYieldable extends Yieldable {
  callbackId?: number;

  onYield(state: YieldableState) {
    this.callbackId = requestIdleCallback(() => state.next());
  }

  onDestroy() {
    if (!this.callbackId) return;

    cancelIdleCallback(this.callbackId);
  }
}

export const idleCallback = () => new IdleCallbackYieldable();
