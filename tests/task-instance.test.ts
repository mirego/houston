import { expect, test, describe, vi } from 'vitest';
import {
  isTaskCanceledError,
  TaskCancelationError,
  task as taskFactory,
} from '../lib';
import { timeout } from '../lib/yieldables/timeout';

describe('TaskInstance', () => {
  describe('helpers', () => {
    describe('isTaskCanceledError', () => {
      test('should return `true` when the argument passed is a TaskCancelationError and `false` otherwise', () => {
        expect(isTaskCanceledError(new TaskCancelationError())).toEqual(true);
        expect(isTaskCanceledError(new Error())).toEqual(false);
        expect(isTaskCanceledError('foo')).toEqual(false);
      });
    });
  });

  describe('states', () => {
    describe('isRunning', () => {
      test('returns `true` when the task is performed and `false` when it completes', async () => {
        const task = taskFactory(function* () {
          yield timeout(100);
        });

        const taskInstance = task.perform();

        expect(taskInstance.isRunning).toEqual(true);

        await taskInstance;

        expect(taskInstance.isRunning).toEqual(false);
      });
    });

    describe('isSuccessful and value', () => {
      test('when the task runs to completion, `isSuccessful` is true and `value` is set to the return value', async () => {
        const task = taskFactory(function* () {
          yield timeout(100);
          return 'return-test';
        });

        const taskInstance = task.perform();

        expect(taskInstance.isSuccessful).toEqual(false);
        expect(taskInstance.value).toEqual(null);

        await taskInstance;

        expect(taskInstance.isSuccessful).toEqual(true);
        expect(taskInstance.value).toEqual('return-test');
      });
    });

    describe('isError and error', () => {
      test('when the task throws an error, `isError` is true and `error` is set to the error thrown', () => {
        const task = taskFactory(function* () {
          yield timeout(100);
          throw new Error('TestError');
        });

        const taskInstance = task.perform();

        taskInstance.catch((error) => {
          expect(error?.message).toEqual('TestError');
        });

        expect(taskInstance.isError).toEqual(false);
        expect(taskInstance.error).toEqual(null);
      });
    });

    describe('isCanceled and error', () => {
      test('when the task is canceled, `isCanceled` is true and `error` is set to a TaskCancelationError', async () => {
        const task = taskFactory(function* () {
          yield timeout(100);
        });

        const taskInstance = task.perform();

        try {
          expect(taskInstance.isCanceled).toEqual(false);
          expect(taskInstance.error).toEqual(null);

          taskInstance.cancel();
        } catch (_error) {
          expect(taskInstance.isCanceled).toEqual(true);
          expect(taskInstance.error).toBeInstanceOf(TaskCancelationError);
        }
      });
    });
  });

  describe('yielding promises', () => {
    test('should resolve or reject the task with the value of the promise', async () => {
      const afterReject = vi.fn();

      const resolveTask = taskFactory(function* () {
        return yield new Promise((resolve) => {
          resolve('promise-return');
        });
      });

      const rejectTask = taskFactory(function* () {
        yield new Promise((_resolve, reject) => {
          reject('promise-error');
        });

        afterReject();
      });

      const value = await resolveTask.perform();
      expect(value).toEqual('promise-return');

      try {
        await rejectTask.perform();
      } catch (error) {
        expect(error).toEqual('promise-error');
        expect(afterReject).not.toHaveBeenCalled();
      }
    });
  });
});
