import { expect, test, describe } from 'vitest';
import { task as taskFactory } from '../lib';
import { Task } from '../lib/task/task';

describe('task', () => {
  describe('when called with no generator function', () => {
    test('should throw an error', () => {
      expect(() => {
        taskFactory({ default: true });
      }).toThrowError('Task function must be defined');
    });
  });

  describe('when called with only a generator function', () => {
    test('returns a default Task instance', () => {
      const task = taskFactory(function* () {});

      expect(task).toBeInstanceOf(Task);
      expect(task.schedulerType).toEqual('default');
    });
  });

  describe('when called with a modifier option', () => {
    test('returns a restartable Task instance', () => {
      const task = taskFactory(
        { restartable: true, maxConcurrency: 2 },
        function* () {}
      );

      expect(task).toBeInstanceOf(Task);
      expect(task.schedulerType).toEqual('restartable');
      expect(task.maxConcurrency).toEqual(2);
    });

    test('returns a enqueue Task instance', () => {
      const task = taskFactory(
        { enqueue: true, maxConcurrency: 3 },
        function* () {}
      );

      expect(task).toBeInstanceOf(Task);
      expect(task.schedulerType).toEqual('enqueue');
      expect(task.maxConcurrency).toEqual(3);
    });

    test('returns a drop Task instance', () => {
      const task = taskFactory(
        { drop: true, maxConcurrency: 4 },
        function* () {}
      );

      expect(task).toBeInstanceOf(Task);
      expect(task.schedulerType).toEqual('drop');
      expect(task.maxConcurrency).toEqual(4);
    });

    test('returns a keepLatest Task instance', () => {
      const task = taskFactory(
        { keepLatest: true, maxConcurrency: 5 },
        function* () {}
      );

      expect(task).toBeInstanceOf(Task);
      expect(task.schedulerType).toEqual('keepLatest');
      expect(task.maxConcurrency).toEqual(5);
    });
  });
});
