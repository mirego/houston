import { DefaultTaskArgsType } from '../task/task';
import { SchedulableTask } from '../task/task-instance';
import { Scheduler } from './scheduler';

export class RestartableScheduler extends Scheduler {
  maxConcurrency: number;

  constructor(maxConcurrency: number) {
    super();
    this.maxConcurrency = maxConcurrency;
  }

  get type() {
    return 'restartable';
  }

  schedule(instance: SchedulableTask, args: DefaultTaskArgsType) {
    if (this.runningTasksCount >= this.maxConcurrency) {
      const firstTask = this.runningInstances.shift();
      firstTask?.cancel();
    }

    this.runningInstances.add(instance);

    instance.perform(...args).finally(() => this.onTaskComplete(instance));
  }

  private onTaskComplete(instance: SchedulableTask) {
    this.runningInstances.delete(instance);
  }
}
