import { expect, test, describe, beforeAll, vi, afterEach } from 'vitest';
import { idleCallback, task as taskFactory } from '../../lib';
import { uid } from '../../lib/utils/uid';

describe('IdleCallback yieldable', () => {
  beforeAll(() => {
    const IdleCallbackMock = vi.fn((callback) => {
      setTimeout(() => {
        callback();
      }, 100);

      return uid();
    });

    vi.stubGlobal('requestIdleCallback', IdleCallbackMock);
    vi.stubGlobal('cancelIdleCallback', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should make the task wait for the next idleCallback', async () => {
    const task = taskFactory(function* () {
      const time = Date.now();
      yield idleCallback();
      return Date.now() - time;
    });

    const timeSpent = await task.perform();

    expect(timeSpent).toBeGreaterThanOrEqual(100);
  });

  test('can be cancelled', async () => {
    const task = taskFactory(function* () {
      const time = Date.now();
      yield idleCallback();
      return Date.now() - time;
    });

    task.perform();
    task.cancelAll();

    expect(cancelIdleCallback).toHaveBeenCalledOnce();
  });
});
