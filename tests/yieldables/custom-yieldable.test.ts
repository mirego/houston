import { expect, test, describe, vi } from 'vitest';
import { Yieldable, YieldableState } from '../../lib';

class CustomYieldable extends Yieldable {
  onYieldCallback: (state: YieldableState) => void;

  constructor(onYieldCallback: (state: YieldableState) => void) {
    super();
    this.onYieldCallback = onYieldCallback;
  }

  onYield(state: YieldableState): void {
    this.onYieldCallback(state);
  }
}

describe('Custom yieldable', () => {
  test('calling `state.next` should resolve the yieldable promise', async () => {
    const thenCallback = vi.fn();
    const finallyCallback = vi.fn();

    const yieldable = new CustomYieldable((state) => {
      state.next('yielded-value');
    });

    await yieldable.then(thenCallback).finally(finallyCallback);

    expect(thenCallback).toHaveBeenCalledOnce();
    expect(thenCallback).toHaveBeenCalledWith('yielded-value');
    expect(finallyCallback).toHaveBeenCalledOnce();
  });

  test('calling `state.return` should resolve the yieldable promise', async () => {
    const thenCallback = vi.fn();
    const finallyCallback = vi.fn();

    const yieldable = new CustomYieldable((state) => {
      state.return('returned-value');
    });

    await yieldable.then(thenCallback).finally(finallyCallback);

    expect(thenCallback).toHaveBeenCalledOnce();
    expect(thenCallback).toHaveBeenCalledWith('returned-value');
    expect(finallyCallback).toHaveBeenCalledOnce();
  });

  test('calling `state.throw` should reject the yieldable promise', async () => {
    const catchCallback = vi.fn();
    const finallyCallback = vi.fn();

    try {
      const yieldable = new CustomYieldable((state) => {
        state.throw('yielded-error');
      });

      await yieldable.catch(catchCallback);
      await yieldable.finally(finallyCallback);
    } catch (_error) {
      // The error was already handled
    } finally {
      expect(catchCallback).toHaveBeenCalledOnce();
      expect(catchCallback).toHaveBeenCalledWith('yielded-error');
      expect(finallyCallback).toHaveBeenCalledOnce();
    }
  });

  test('calling `state.cancel` should reject the yieldable promise', async () => {
    const catchCallback = vi.fn();
    const finallyCallback = vi.fn();

    const yieldable = new CustomYieldable((state) => {
      state.cancel();
    });

    try {
      await yieldable.catch(catchCallback);
      await yieldable.finally(finallyCallback);
    } catch (_error) {
    } finally {
      expect(catchCallback).toHaveBeenCalledOnce();
      expect(finallyCallback).toHaveBeenCalledOnce();
    }
  });
});
