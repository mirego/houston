import { expect, test, describe, vi } from 'vitest';
import { Task, TaskState } from '../lib/task/task';
import { timeout } from '../lib/yieldables/timeout';
import { TaskInstance } from '../lib/task/task-instance';

describe('Task', () => {
  describe('derived states', () => {
    describe('runningTasksCount', () => {
      test('returns the number of task currently running', async () => {
        const task = new Task(
          function* () {
            yield timeout(100);
          },
          { default: true }
        );

        const taskInstance1 = task.perform();

        expect(task.runningTasksCount).toEqual(1);

        const taskInstance2 = task.perform();

        expect(task.runningTasksCount).toEqual(2);

        await Promise.all([taskInstance1, taskInstance2]);

        expect(task.runningTasksCount).toEqual(0);
      });

      test('resets when cancelAll is called', () => {
        const task = new Task(
          function* () {
            yield timeout(100);
          },
          { default: true }
        );

        task.perform();
        task.perform();

        expect(task.runningTasksCount).toEqual(2);

        task.cancelAll();

        expect(task.runningTasksCount).toEqual(0);
      });
    });

    describe('state', () => {
      test('returns TaskState.RUNNING when a task is currently running and return to TaskState.IDLE when tasks are done running', async () => {
        const task = new Task(
          function* () {
            yield timeout(100);
          },
          { default: true }
        );

        const taskInstance = task.perform();

        expect(task.state).toEqual(TaskState.RUNNING);

        await taskInstance;

        expect(task.state).toEqual(TaskState.IDLE);
      });
    });

    describe('isRunning', () => {
      test('returns `false` when a task has no running instances and `true` when at least one instance is running', async () => {
        const task = new Task(
          function* () {
            yield timeout(100);
          },
          { default: true }
        );

        expect(task.isRunning).toEqual(false);

        const taskInstance = task.perform();

        expect(task.isRunning).toEqual(true);

        await taskInstance;

        expect(task.isRunning).toEqual(false);
      });
    });

    describe('isIdle', () => {
      test('returns `true` when a task has no running instances and `false` when at least one instance is running', async () => {
        const task = new Task(
          function* () {
            yield timeout(100);
          },
          { default: true }
        );

        expect(task.isIdle).toEqual(true);

        const taskInstance = task.perform();

        expect(task.isIdle).toEqual(false);

        await taskInstance;

        expect(task.isIdle).toEqual(true);
      });
    });
  });

  describe('perform', () => {
    test('returns a promise-like TaskInstance', () => {
      const task = new Task(function* () {}, { default: true });
      const taskInstance = task.perform();

      expect(taskInstance).toHaveProperty('then');
      expect(taskInstance).toHaveProperty('catch');
      expect(taskInstance).toHaveProperty('finally');
      expect(taskInstance).toBeInstanceOf(TaskInstance);
    });

    test('should pass through all the generator steps without interruption', async () => {
      const beforeYield = vi.fn();
      const afterYield = vi.fn();

      const task = new Task(
        function* () {
          beforeYield();
          yield timeout(10);
          afterYield();
        },
        { default: true }
      );

      const taskInstance = task.perform();

      expect(beforeYield).toHaveBeenCalledOnce();
      expect(afterYield).not.toHaveBeenCalled();

      await taskInstance;

      expect(afterYield).toHaveBeenCalledOnce();
    });

    test('can pass arguments and return values', async () => {
      const task = new Task<[arg1: string], string>(
        function* (arg1: string) {
          return `return-${arg1}`;
        },
        { default: true }
      );

      const returnValue = await task.perform('test');

      expect(returnValue).toEqual('return-test');
    });
  });

  describe('cancelAll', () => {
    test('cancels all task instances, skips `then` and `catch` but calls `finally` callbacks', async () => {
      const task = new Task(
        function* () {
          yield timeout(10000);
        },
        { default: true }
      );

      const taskInstance1 = task.perform();
      const taskInstance2 = task.perform();

      const resolveCallback1 = vi.fn();
      const rejectCallback1 = vi.fn();
      const finallyCallback1 = vi.fn();
      const resolveCallback2 = vi.fn();
      const rejectCallback2 = vi.fn();
      const finallyCallback2 = vi.fn();

      taskInstance1
        .then(resolveCallback1, rejectCallback1)
        .finally(finallyCallback1);
      taskInstance2
        .then(resolveCallback2, rejectCallback2)
        .finally(finallyCallback2);

      task.cancelAll();

      expect(resolveCallback1).not.toHaveBeenCalled();
      expect(resolveCallback2).not.toHaveBeenCalled();

      expect(rejectCallback1).not.toHaveBeenCalled();
      expect(rejectCallback2).not.toHaveBeenCalled();

      expect(finallyCallback1).toHaveBeenCalledOnce();
      expect(finallyCallback2).toHaveBeenCalledOnce();
    });

    test('should cancel the task and not execute any further code', async () => {
      const beforeYield = vi.fn();
      const afterYield = vi.fn();

      const task = new Task(
        function* () {
          beforeYield();
          yield timeout(1000);
          afterYield();
        },
        { default: true }
      );

      task.perform();
      task.cancelAll();

      expect(beforeYield).toHaveBeenCalledOnce();
      expect(afterYield).not.toHaveBeenCalled();
    });

    test('should send an abort signal', () => {
      const beforeYield = vi.fn();
      const afterYield = vi.fn();

      const task = new Task(
        function* ({ signal }) {
          beforeYield(signal);
          yield timeout(1000);
          afterYield();
        },
        { default: true }
      );

      task.perform();
      task.cancelAll();

      expect(beforeYield).toHaveBeenCalledOnce();
      expect(beforeYield.mock.lastCall?.[0]).toBeInstanceOf(AbortSignal);
      expect(beforeYield.mock.lastCall?.[0].aborted).toEqual(true);

      expect(afterYield).not.toHaveBeenCalled();
    });
  });
});
