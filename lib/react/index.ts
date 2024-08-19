import { useRef, useEffect } from 'react';
import { Task, TaskFunction, TaskModifierOptions } from '../task/task';
import { task as taskFactory } from '../index';

export const useTask = <Args extends any[] = [], Return = void>(
  optionsOrTaskFn: TaskModifierOptions | TaskFunction<Return, Args>,
  taskFn?: TaskFunction<Return, Args>
) => {
  const task = useRef<Task<Args, Return>>(taskFactory(optionsOrTaskFn, taskFn));

  useEffect(() => {
    return () => {
      task.current.cancelAll();
    };
  }, []);

  return task;
};
