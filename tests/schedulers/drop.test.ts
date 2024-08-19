import { expect, test, describe } from 'vitest';
import { task as taskFactory, timeout } from '../../lib';
import { TaskState } from '../../lib/task/task';

describe('Drop scheduler', () => {
  describe('state', () => {
    test('should return the scheduler type "drop"', () => {
      const task = taskFactory({ drop: true, maxConcurrency: 1 }, function* () {
        yield timeout(1000);
      });

      expect(task.schedulerType).toEqual('drop');
    });

    test('should return the `maxConcurrency`', () => {
      const task1 = taskFactory({ drop: true }, function* () {
        yield timeout(1000);
      });

      const task2 = taskFactory(
        { drop: true, maxConcurrency: 1 },
        function* () {
          yield timeout(1000);
        }
      );

      const task3 = taskFactory(
        { drop: true, maxConcurrency: 4 },
        function* () {
          yield timeout(1000);
        }
      );

      expect(task1.maxConcurrency).toEqual(1);
      expect(task2.maxConcurrency).toEqual(1);
      expect(task3.maxConcurrency).toEqual(4);
    });

    test('should set the `state` when task is idle or running', () => {
      const task = taskFactory({ drop: true, maxConcurrency: 1 }, function* () {
        yield timeout(1000);
      });

      expect(task.runningTasksCount).toEqual(0);
      expect(task.state).toEqual(TaskState.IDLE);
      expect(task.isIdle).toEqual(true);
      expect(task.isRunning).toEqual(false);

      task.perform();

      expect(task.runningTasksCount).toEqual(1);
      expect(task.state).toEqual(TaskState.RUNNING);
      expect(task.isIdle).toEqual(false);
      expect(task.isRunning).toEqual(true);
    });
  });

  describe('performing mutliple task', async () => {
    describe('with maxConcurrency=1', () => {
      test('should run the first task to completion and cancel any other performed while the first one is running', async () => {
        const task = taskFactory(
          { drop: true, maxConcurrency: 1 },
          function* () {
            yield timeout(1000);
          }
        );

        const taskInstance1 = task.perform();
        const taskInstance2 = task.perform();
        const taskInstance3 = task.perform();

        expect(taskInstance1.isCanceled).toEqual(false);
        expect(taskInstance2.isCanceled).toEqual(true);
        expect(taskInstance3.isCanceled).toEqual(true);
      });
    });

    describe('with maxConcurrency=3', () => {
      test('should run the first three tasks to completion and cancel any other performed while the first three are running', async () => {
        const task = taskFactory(
          { drop: true, maxConcurrency: 3 },
          function* () {
            yield timeout(1000);
          }
        );

        const taskInstance1 = task.perform();
        const taskInstance2 = task.perform();
        const taskInstance3 = task.perform();
        const taskInstance4 = task.perform();

        expect(taskInstance1.isCanceled).toEqual(false);
        expect(taskInstance2.isCanceled).toEqual(false);
        expect(taskInstance3.isCanceled).toEqual(false);
        expect(taskInstance4.isCanceled).toEqual(true);
      });
    });
  });

  describe('performing a task after dropping other tasks', () => {
    test('should perform the following task', async () => {
      const task = taskFactory({ drop: true, maxConcurrency: 1 }, function* () {
        yield timeout(100);
      });

      const taskInstance1 = task.perform();
      const taskInstance2 = task.perform();

      await Promise.allSettled([taskInstance1, taskInstance2]);
      expect(taskInstance1.isCanceled).toEqual(false);
      expect(taskInstance2.isCanceled).toEqual(true);

      const taskInstance3 = task.perform();
      const taskInstance4 = task.perform();

      await Promise.allSettled([taskInstance3, taskInstance4]);

      expect(taskInstance3.isCanceled).toEqual(false);
      expect(taskInstance4.isCanceled).toEqual(true);
    });
  });
});
