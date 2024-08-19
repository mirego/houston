import { expect, test, describe, vi } from 'vitest';
import { task as taskFactory, timeout } from '../lib';

describe('Child tasks', () => {
  test('should be canceled recursively when a parent task is canceled', async () => {
    const nestedChildTaskFunction = vi.fn();
    const childTaskFunction = vi.fn();

    const nestedChildTask = taskFactory(function* () {
      yield timeout(1000);
      nestedChildTaskFunction();
    });

    const childTask = taskFactory(function* () {
      yield timeout(1000);
      childTaskFunction();
      yield nestedChildTask.perform();
    });

    const task = taskFactory(function* () {
      yield childTask.perform();
    });

    const taskInstance = task.perform();
    task.cancelAll();

    try {
      await taskInstance;
    } catch (_error) {
      expect(childTaskFunction).not.toHaveBeenCalled();
      expect(nestedChildTaskFunction).not.toHaveBeenCalled();
    }
  });

  test('when a child errors out, the error should be propagated to the parent', async () => {
    const nestedChildTask = taskFactory(function* () {
      throw new Error('Nested child error');
    });

    const childTask = taskFactory(function* () {
      yield nestedChildTask.perform();
    });

    const task = taskFactory(function* () {
      yield childTask.perform();
    });

    const taskInstance = task.perform();

    try {
      await taskInstance;
    } catch (error) {
      expect(error.message).toEqual('Nested child error');
    }
  });
});
