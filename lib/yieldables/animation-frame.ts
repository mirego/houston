import { Yieldable, YieldableState } from './yieldable';

class AnimationFrameYieldable extends Yieldable {
  timerId?: number;

  onYield(state: YieldableState) {
    this.timerId = requestAnimationFrame(() => state.next());
  }

  onDestroy() {
    if (!this.timerId) return;

    cancelAnimationFrame(this.timerId);
  }
}

export const animationFrame = () => new AnimationFrameYieldable();
