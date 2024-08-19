import { DefaultTaskArgsType, TaskState } from '../task/task';
import { Stack } from '../utils/stack';
import { SchedulableTask } from '../task/task-instance';

export abstract class Scheduler {
  maxConcurrency = 1;
  runningInstances: Stack<SchedulableTask> = new Stack();

  abstract schedule(
    instance: SchedulableTask,
    args?: DefaultTaskArgsType
  ): void;

  abstract get type(): string;

  get runningTasksCount() {
    return this.runningInstances.size;
  }

  get state() {
    return this.runningTasksCount > 0 ? TaskState.RUNNING : TaskState.IDLE;
  }

  get isRunning() {
    return this.state === TaskState.RUNNING;
  }

  get isIdle() {
    return this.state === TaskState.IDLE;
  }

  cancelAll() {
    this.runningInstances.forEach((instance) => {
      instance.cancel();
    });

    this.runningInstances.clear();
  }
}
