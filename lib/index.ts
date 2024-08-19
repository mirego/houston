import { all, allSettled, race } from './promise';
import {
  DefaultTaskArgsType,
  DefaultTaskReturnType,
  Task,
  TaskFunction,
  TaskModifierOptions,
} from './task/task';
import {
  isTaskCanceledError,
  TaskCancelationError,
} from './task/task-instance';
import { animationFrame } from './yieldables/animation-frame';
import { idleCallback } from './yieldables/idle-callback';
import { timeout } from './yieldables/timeout';
import { Yieldable, YieldableState } from './yieldables/yieldable';

export function task<
  Args extends DefaultTaskArgsType = [],
  Return = DefaultTaskReturnType,
>(
  optionsOrTaskFn: TaskModifierOptions | TaskFunction<Return, Args>,
  taskFn?: TaskFunction<Return, Args>
) {
  let task = null;
  let options: TaskModifierOptions = { default: true };

  if (typeof taskFn === 'function') {
    options = optionsOrTaskFn as TaskModifierOptions;
    task = taskFn as TaskFunction<Return, Args>;
  }

  if (typeof optionsOrTaskFn === 'function') {
    task = optionsOrTaskFn as TaskFunction<Return, Args>;
  }

  if (task === null) {
    throw new Error('Task function must be defined');
  }

  return new Task(task, options);
}

export {
  all,
  allSettled,
  race,
  timeout,
  animationFrame,
  idleCallback,
  isTaskCanceledError,
  Yieldable,
  YieldableState,
  TaskCancelationError,
};
