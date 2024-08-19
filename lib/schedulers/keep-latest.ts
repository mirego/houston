import { DefaultTaskArgsType } from '../task/task';
import { SchedulableTask } from '../task/task-instance';
import { Scheduler } from './scheduler';

export class KeepLatestScheduler extends Scheduler {
  enqueuedInstance: SchedulableTask | null = null;
  maxConcurrency: number;

  constructor(maxConcurrency: number) {
    super();
    this.maxConcurrency = maxConcurrency;
  }

  get type() {
    return 'keepLatest';
  }

  schedule(instance: SchedulableTask, args: DefaultTaskArgsType) {
    if (this.runningTasksCount >= this.maxConcurrency) {
      this.enqueuedInstance?.cancel();
      this.enqueuedInstance = instance;
    } else {
      this.runningInstances.add(instance);

      instance
        .perform(...args)
        .finally(() => this.onTaskComplete(instance, args));
    }
  }

  private onTaskComplete(instance: SchedulableTask, args: DefaultTaskArgsType) {
    this.runningInstances.delete(instance);

    if (this.runningInstances.size === 0 && this.enqueuedInstance) {
      this.schedule(this.enqueuedInstance, args);
      this.enqueuedInstance = null;
    }
  }

  cancelAll() {
    this.enqueuedInstance?.cancel();
    this.enqueuedInstance = null;

    super.cancelAll();
  }
}
