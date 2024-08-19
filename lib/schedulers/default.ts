import { DefaultTaskArgsType } from '../task/task';
import { SchedulableTask } from '../task/task-instance';
import { Scheduler } from './scheduler';

export class DefaultScheduler extends Scheduler {
  get type() {
    return 'default';
  }

  schedule(instance: SchedulableTask, args: DefaultTaskArgsType) {
    this.runningInstances.add(instance);

    instance.perform(...args).finally(() => this.onTaskComplete(instance));
  }

  private onTaskComplete(instance: SchedulableTask) {
    this.runningInstances.delete(instance);
  }
}
