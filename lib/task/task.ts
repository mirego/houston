import { DefaultScheduler } from '../schedulers/default';
import { DropScheduler } from '../schedulers/drop';
import { KeepLatestScheduler } from '../schedulers/keep-latest';
import { QueueScheduler } from '../schedulers/queue';
import { RestartableScheduler } from '../schedulers/restartable';
import { Scheduler } from '../schedulers/scheduler';
import { TaskInstance } from './task-instance';

export enum TaskState {
  IDLE = 'idle',
  RUNNING = 'running',
}

interface DefaultTaskOptions {
  default: true;
  maxConcurrency?: 1;
}

interface RestartableTaskOptions {
  restartable: true;
  maxConcurrency?: number;
}

interface EnqueueTaskOptions {
  enqueue: true;
  maxConcurrency?: number;
}

interface DropTaskOptions {
  drop: true;
  maxConcurrency?: number;
}

interface KeepLatestTaskOptions {
  keepLatest: true;
  maxConcurrency?: number;
}

export type TaskModifierOptions =
  | DefaultTaskOptions
  | RestartableTaskOptions
  | EnqueueTaskOptions
  | DropTaskOptions
  | KeepLatestTaskOptions;

export type DefaultTaskReturnType = void;
export type DefaultTaskArgsType = any[];

export type TaskFunction<
  Return = DefaultTaskReturnType,
  Args extends DefaultTaskArgsType = [],
> = (
  ...args: [...Args, { signal: AbortSignal }]
) => Generator<any, Return | Promise<Return> | undefined, any>;

export class Task<
  Args extends DefaultTaskArgsType = [],
  Return = DefaultTaskReturnType,
> {
  private taskFn: TaskFunction<Return, Args>;
  private scheduler: Scheduler;

  constructor(
    taskFn: TaskFunction<Return, Args>,
    options: TaskModifierOptions
  ) {
    this.taskFn = taskFn;
    this.scheduler = this.schedulerFromOptions(options);
  }

  get state() {
    return this.scheduler.state;
  }

  get isRunning() {
    return this.scheduler.isRunning;
  }

  get isIdle() {
    return this.scheduler.isIdle;
  }

  get runningTasksCount() {
    return this.scheduler.runningTasksCount;
  }

  get maxConcurrency() {
    return this.scheduler.maxConcurrency;
  }

  get schedulerType() {
    return this.scheduler.type;
  }

  perform(...args: Args) {
    const instance = new TaskInstance<Return, Args>(this.taskFn);

    this.scheduler.schedule(instance, args);

    return instance;
  }

  cancelAll() {
    this.scheduler.cancelAll();
  }

  private schedulerFromOptions(options: TaskModifierOptions) {
    if ('restartable' in options && options.restartable === true) {
      return new RestartableScheduler(options.maxConcurrency ?? 1);
    }

    if ('enqueue' in options && options.enqueue === true) {
      return new QueueScheduler(options.maxConcurrency ?? 1);
    }

    if ('drop' in options && options.drop === true) {
      return new DropScheduler(options.maxConcurrency ?? 1);
    }

    if ('keepLatest' in options && options.keepLatest === true) {
      return new KeepLatestScheduler(options.maxConcurrency ?? 1);
    }

    return new DefaultScheduler();
  }
}
