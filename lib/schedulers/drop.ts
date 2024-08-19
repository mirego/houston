import { DefaultTaskArgsType } from '../task/task';
import { SchedulableTask } from '../task/task-instance';
import { Scheduler } from './scheduler';

export class DropScheduler extends Scheduler {
  maxConcurrency: number;

  constructor(maxConcurrency: number) {
    super();
    this.maxConcurrency = maxConcurrency;
  }

  get type() {
    return 'drop';
  }

  schedule(instance: SchedulableTask, args: DefaultTaskArgsType) {
    if (this.runningTasksCount >= this.maxConcurrency) {
      instance.cancel();
    } else {
      this.runningInstances.add(instance);

      instance.perform(...args).finally(() => this.onTaskComplete(instance));
    }
  }

  private onTaskComplete(instance: SchedulableTask) {
    this.runningInstances.delete(instance);
  }
}
