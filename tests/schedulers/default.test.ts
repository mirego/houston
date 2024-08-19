import { expect, test, describe, vi } from 'vitest';
import { task as taskFactory, timeout } from '../../lib';

describe('Default scheduler', () => {
  describe('performing a single task', async () => {
    test('should call `then` and `finally` when performed without error', async () => {
      const task = taskFactory({ default: true }, function* () {
        yield timeout(10);
      });

      const thenCallback = vi.fn();
      const catchCallback = vi.fn();
      const finallyCallback = vi.fn();

      await task
        .perform()
        .then(thenCallback)
        .catch(catchCallback)
        .finally(finallyCallback);

      expect(thenCallback).toHaveBeenCalledOnce();
      expect(catchCallback).not.toHaveBeenCalledOnce();
      expect(finallyCallback).toHaveBeenCalledOnce();
    });

    test('should call `catch` and `finally` when performed with an error', async () => {
      const task = taskFactory({ default: true }, function* () {
        throw new Error();
      });

      const thenCallback = vi.fn();
      const catchCallback = vi.fn();
      const finallyCallback = vi.fn();

      try {
        await task
          .perform()
          .then(thenCallback)
          .catch(catchCallback)
          .finally(finallyCallback);
      } catch (_error) {
        expect(thenCallback).not.toHaveBeenCalledOnce();
        expect(catchCallback).toHaveBeenCalledOnce();
        expect(finallyCallback).toHaveBeenCalledOnce();
      }
    });
  });

  describe('performing mutliple task', async () => {
    test('should run all tasks at the same time', async () => {
      const taskThen1 = vi.fn();
      const taskCatch1 = vi.fn();

      const taskThen2 = vi.fn();
      const taskCatch2 = vi.fn();

      const task = taskFactory({ default: true }, function* () {
        yield timeout(100);
      });

      await Promise.all([
        task.perform().then(taskThen1).catch(taskCatch1),
        task.perform().then(taskThen2).catch(taskCatch2),
      ]);

      expect(taskThen1).toHaveBeenCalledOnce();
      expect(taskCatch1).not.toHaveBeenCalled();
      expect(taskThen2).toHaveBeenCalledOnce();
      expect(taskCatch2).not.toHaveBeenCalled();
    });
  });
});
