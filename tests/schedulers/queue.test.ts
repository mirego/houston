import { expect, test, describe } from 'vitest';
import { task as taskFactory, timeout } from '../../lib';
import { TaskState } from '../../lib/task/task';

describe('Queue scheduler', () => {
  describe('state', () => {
    test('should return the scheduler type "enqueue"', () => {
      const task = taskFactory(
        { enqueue: true, maxConcurrency: 1 },
        function* () {
          yield timeout(1000);
        }
      );

      expect(task.schedulerType).toEqual('enqueue');
    });

    test('should return the `maxConcurrency`', () => {
      const task1 = taskFactory({ enqueue: true }, function* () {
        yield timeout(1000);
      });

      const task2 = taskFactory(
        { enqueue: true, maxConcurrency: 1 },
        function* () {
          yield timeout(1000);
        }
      );

      const task3 = taskFactory(
        { enqueue: true, maxConcurrency: 4 },
        function* () {
          yield timeout(1000);
        }
      );

      expect(task1.maxConcurrency).toEqual(1);
      expect(task2.maxConcurrency).toEqual(1);
      expect(task3.maxConcurrency).toEqual(4);
    });

    test('should set the `state` when task is idle or running', () => {
      const task = taskFactory(
        { enqueue: true, maxConcurrency: 1 },
        function* () {
          yield timeout(1000);
        }
      );

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
      test('should run the first task to completion and then the next one', async () => {
        const task = taskFactory(
          { enqueue: true, maxConcurrency: 1 },
          function* () {
            yield timeout(100);
          }
        );

        const taskInstance1 = task.perform();
        const taskInstance2 = task.perform();
        const taskInstance3 = task.perform();

        expect(taskInstance1.isRunning).toEqual(true);
        expect(taskInstance2.isPending).toEqual(true);
        expect(taskInstance2.isRunning).toEqual(false);
        expect(taskInstance3.isPending).toEqual(true);
        expect(taskInstance3.isRunning).toEqual(false);

        await taskInstance1;

        expect(taskInstance1.isRunning).toEqual(false);
        expect(taskInstance1.isSuccessful).toEqual(true);
        expect(taskInstance2.isRunning).toEqual(true);
        expect(taskInstance3.isPending).toEqual(true);
        expect(taskInstance3.isRunning).toEqual(false);

        await taskInstance2;

        expect(taskInstance1.isRunning).toEqual(false);
        expect(taskInstance1.isSuccessful).toEqual(true);
        expect(taskInstance2.isRunning).toEqual(false);
        expect(taskInstance2.isSuccessful).toEqual(true);
        expect(taskInstance3.isRunning).toEqual(true);

        await taskInstance3;

        expect(taskInstance1.isRunning).toEqual(false);
        expect(taskInstance1.isSuccessful).toEqual(true);
        expect(taskInstance2.isRunning).toEqual(false);
        expect(taskInstance3.isSuccessful).toEqual(true);
        expect(taskInstance3.isRunning).toEqual(false);
        expect(taskInstance3.isSuccessful).toEqual(true);
      });
    });

    describe('with maxConcurrency=3', () => {
      test('should run the first three tasks to completion and cancel any other performed while the first three are running', async () => {
        const task = taskFactory(
          { enqueue: true, maxConcurrency: 3 },
          function* () {
            yield timeout(100);
          }
        );

        const taskInstance1 = task.perform();
        const taskInstance2 = task.perform();
        const taskInstance3 = task.perform();
        const taskInstance4 = task.perform();
        const taskInstance5 = task.perform();
        const taskInstance6 = task.perform();

        expect(taskInstance1.isRunning).toEqual(true);
        expect(taskInstance2.isRunning).toEqual(true);
        expect(taskInstance3.isRunning).toEqual(true);
        expect(taskInstance4.isPending).toEqual(true);
        expect(taskInstance5.isPending).toEqual(true);
        expect(taskInstance6.isPending).toEqual(true);

        await Promise.allSettled([taskInstance1, taskInstance2, taskInstance3]);

        expect(taskInstance1.isRunning).toEqual(false);
        expect(taskInstance1.isSuccessful).toEqual(true);
        expect(taskInstance2.isRunning).toEqual(false);
        expect(taskInstance2.isSuccessful).toEqual(true);
        expect(taskInstance3.isRunning).toEqual(false);
        expect(taskInstance3.isSuccessful).toEqual(true);
        expect(taskInstance4.isRunning).toEqual(true);
        expect(taskInstance5.isRunning).toEqual(true);
        expect(taskInstance6.isRunning).toEqual(true);

        await Promise.allSettled([taskInstance4, taskInstance5, taskInstance6]);

        expect(taskInstance1.isRunning).toEqual(false);
        expect(taskInstance1.isSuccessful).toEqual(true);
        expect(taskInstance2.isRunning).toEqual(false);
        expect(taskInstance2.isSuccessful).toEqual(true);
        expect(taskInstance3.isRunning).toEqual(false);
        expect(taskInstance3.isSuccessful).toEqual(true);
        expect(taskInstance4.isRunning).toEqual(false);
        expect(taskInstance4.isSuccessful).toEqual(true);
        expect(taskInstance5.isRunning).toEqual(false);
        expect(taskInstance5.isSuccessful).toEqual(true);
        expect(taskInstance6.isRunning).toEqual(false);
        expect(taskInstance6.isSuccessful).toEqual(true);
      });
    });
  });

  describe('cancelAll', () => {
    test('should cancel all tasks including enqueued tasks', async () => {
      const task = taskFactory(
        { enqueue: true, maxConcurrency: 1 },
        function* () {
          yield timeout(100);
        }
      );

      const taskInstance1 = task.perform();
      const taskInstance2 = task.perform();
      const taskInstance3 = task.perform();

      expect(taskInstance1.isCanceled).toEqual(false);
      expect(taskInstance2.isCanceled).toEqual(false);
      expect(taskInstance3.isCanceled).toEqual(false);

      task.cancelAll();

      expect(taskInstance1.isCanceled).toEqual(true);
      expect(taskInstance2.isCanceled).toEqual(true);
      expect(taskInstance3.isCanceled).toEqual(true);
    });
  });
});
