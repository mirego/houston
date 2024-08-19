import { Stack } from '../utils/stack';
import { DefaultTaskArgsType } from '../task/task';
import { SchedulableTask } from '../task/task-instance';
import { Scheduler } from './scheduler';

export class QueueScheduler extends Scheduler {
  enqueuedInstances: Stack<SchedulableTask> = new Stack();
  maxConcurrency: number;

  constructor(maxConcurrency: number) {
    super();
    this.maxConcurrency = maxConcurrency;
  }

  get type() {
    return 'enqueue';
  }

  schedule(instance: SchedulableTask, args: DefaultTaskArgsType) {
    if (this.runningTasksCount >= this.maxConcurrency) {
      this.enqueuedInstances.add(instance);
    } else {
      this.runningInstances.add(instance);

      instance
        .perform(...args)
        .finally(() => this.onTaskComplete(instance, args));
    }
  }

  private onTaskComplete(instance: SchedulableTask, args: DefaultTaskArgsType) {
    this.runningInstances.delete(instance);

    const nextTask = this.enqueuedInstances.shift();

    if (nextTask) {
      this.schedule(nextTask, args);
    }
  }

  cancelAll() {
    this.enqueuedInstances.forEach((instance) => instance.cancel());
    this.enqueuedInstances.clear();

    super.cancelAll();
  }
}
