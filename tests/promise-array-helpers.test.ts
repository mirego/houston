import { test, describe, vi, expect } from 'vitest';
import {
  all,
  allSettled,
  race,
  task as taskFactory,
  timeout,
  Yieldable,
  YieldableState,
} from '../lib';

class CustomYieldable extends Yieldable {
  onYieldCallback?: (yieldNext: (value: any) => void) => void;
  onDestroyCallback?: () => void;

  constructor(
    onYieldCallback?: (yieldNext: (value: any) => void) => void,
    onDestroyCallback?: () => void
  ) {
    super();
    this.onYieldCallback = onYieldCallback;
    this.onDestroyCallback = onDestroyCallback;
  }

  onYield(state: YieldableState): void {
    if (this.onYieldCallback) {
      this.onYieldCallback((value) => state.next(value));
    } else {
      state.next();
    }
  }

  onDestroy() {
    this.onDestroyCallback?.();
  }
}

describe('Promise array helpers', () => {
  describe('all', () => {
    test('should run tasks and yieldables as it would "normal" promises', async () => {
      const childTask = taskFactory(function* () {
        yield timeout(1000);
        return 'child-task-return';
      });

      const task = taskFactory(function* () {
        const [
          childTaskReturnValue,
          yieldableReturnValue,
          promiseReturnValue,
          primitiveReturnValue,
        ] = yield all([
          childTask.perform(),
          new CustomYieldable((yieldNext) => {
            yieldNext('yieldable-return');
          }),
          Promise.resolve('promise-return'),
          'primitive-return',
        ]);

        return [
          childTaskReturnValue,
          yieldableReturnValue,
          promiseReturnValue,
          primitiveReturnValue,
        ];
      });

      const [
        childTaskReturnValue,
        yieldableReturnValue,
        promiseReturnValue,
        primitiveReturnValue,
      ] = await task.perform();

      expect(childTaskReturnValue).toEqual('child-task-return');
      expect(yieldableReturnValue).toEqual('yieldable-return');
      expect(promiseReturnValue).toEqual('promise-return');
      expect(primitiveReturnValue).toEqual('primitive-return');
    });

    test('should cancel enclosing tasks when the main task is canceled', async () => {
      const childTaskFunction = vi.fn();

      const childTask = taskFactory(function* () {
        yield timeout(1000);
        childTaskFunction();
        return 'child-task-return';
      });

      const task = taskFactory(function* () {
        const [childTaskReturnValue] = yield all([childTask.perform()]);

        return [childTaskReturnValue];
      });

      const taskInstance = task.perform();

      task.cancelAll();

      taskInstance.catch(() => {
        expect(childTaskFunction).not.toHaveBeenCalled();
      });
    });

    test('should cancel enclosing yieldables when the main task is canceled', async () => {
      const yieldableDestroyFunction = vi.fn();

      const task = taskFactory(function* () {
        const [yieldableReturnValue] = yield all([
          new CustomYieldable((yieldNext) => {
            yieldNext('yieldable-return');
          }, yieldableDestroyFunction),
        ]);

        return [yieldableReturnValue];
      });

      const taskInstance = task.perform();

      task.cancelAll();

      taskInstance.catch(() => {
        expect(yieldableDestroyFunction).toHaveBeenCalledOnce();
      });
    });
  });

  describe('allSettled', () => {
    test('should run tasks and yieldables as it would "normal" promises', async () => {
      const childTask = taskFactory(function* () {
        yield timeout(1000);
        return 'child-task-return';
      });

      const task = taskFactory(function* () {
        const [
          childTaskReturn,
          yieldableReturn,
          promiseReturn,
          primitiveReturn,
        ] = yield allSettled([
          childTask.perform(),
          new CustomYieldable((yieldNext) => {
            yieldNext('yieldable-return');
          }),
          Promise.resolve('promise-return'),
          'primitive-return',
        ]);

        return [
          childTaskReturn,
          yieldableReturn,
          promiseReturn,
          primitiveReturn,
        ];
      });

      const [childTaskReturn, yieldableReturn, promiseReturn, primitiveReturn] =
        await task.perform();

      expect(childTaskReturn.value).toEqual('child-task-return');
      expect(yieldableReturn.value).toEqual('yieldable-return');
      expect(promiseReturn.value).toEqual('promise-return');
      expect(primitiveReturn.value).toEqual('primitive-return');
    });

    test('should cancel enclosing tasks when the main task is canceled', async () => {
      const childTaskFunction = vi.fn();

      const childTask = taskFactory(function* () {
        yield timeout(1000);
        childTaskFunction();
        return 'child-task-return';
      });

      const task = taskFactory(function* () {
        const [childTaskReturn] = yield allSettled([childTask.perform()]);

        return [childTaskReturn];
      });

      const taskInstance = task.perform();

      task.cancelAll();

      taskInstance.catch(() => {
        expect(childTaskFunction).not.toHaveBeenCalled();
      });
    });

    test('should cancel enclosing yieldables when the main task is canceled', async () => {
      const yieldableDestroyFunction = vi.fn();

      const task = taskFactory(function* () {
        const [yieldableReturn] = yield allSettled([
          new CustomYieldable((yieldNext) => {
            yieldNext('yieldable-return');
          }, yieldableDestroyFunction),
        ]);

        return [yieldableReturn];
      });

      const taskInstance = task.perform();

      task.cancelAll();

      taskInstance.catch(() => {
        expect(yieldableDestroyFunction).toHaveBeenCalledOnce();
      });
    });
  });

  describe('race', () => {
    test('should run tasks and yieldables as it would "normal" promises', async () => {
      const childTask = taskFactory(function* () {
        yield timeout(1000);
        return 'child-task-return';
      });

      const task = taskFactory(function* () {
        const returnValue = yield race([
          childTask.perform(),
          new CustomYieldable((yieldNext) => {
            yieldNext('yieldable-return');
          }),
          Promise.resolve('promise-return'),
        ]);

        return returnValue;
      });

      const returnValue = await task.perform();

      expect(returnValue).toEqual('promise-return');
    });

    test('should cancel enclosing tasks when the main task is canceled', async () => {
      const childTaskFunction = vi.fn();

      const childTask = taskFactory(function* () {
        yield timeout(1000);
        childTaskFunction();
        return 'child-task-return';
      });

      const task = taskFactory(function* () {
        const returnValue = yield race([childTask.perform()]);

        return returnValue;
      });

      const taskInstance = task.perform();

      task.cancelAll();

      taskInstance.catch(() => {
        expect(childTaskFunction).not.toHaveBeenCalled();
      });
    });

    test('should cancel enclosing yieldables when the main task is canceled', async () => {
      const yieldableDestroyFunction = vi.fn();

      const task = taskFactory(function* () {
        const returnValue = yield race([
          new CustomYieldable((yieldNext) => {
            yieldNext('yieldable-return');
          }, yieldableDestroyFunction),
        ]);

        return returnValue;
      });

      const taskInstance = task.perform();

      task.cancelAll();

      taskInstance.catch(() => {
        expect(yieldableDestroyFunction).toHaveBeenCalledOnce();
      });
    });
  });
});
