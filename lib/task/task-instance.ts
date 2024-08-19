import { Yieldable } from '../yieldables/yieldable';
import { uid } from '../utils/uid';
import { TaskFunction } from './task';

export enum CompletionState {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  CANCEL = 'CANCEL',
}

export class TaskCancelationError extends Error {
  message = 'Task canceled';
}

export function isTaskCanceledError(error: any): error is TaskCancelationError {
  return error instanceof TaskCancelationError;
}

// This type serves as simple interface with the scheduler, it does not need to
// know the complete type of the task.
export interface SchedulableTask {
  perform: (...args: any[]) => {
    then: typeof TaskInstance.prototype.then;
    catch: typeof TaskInstance.prototype.catch;
    finally: typeof TaskInstance.prototype.finally;
  };
  cancel: () => void;
}

export class TaskInstance<Return = void, Args extends any[] = []>
  implements SchedulableTask
{
  id = `TaskInstance[${uid()}]`;
  private task: TaskFunction<Return, Args>;
  private completionState = CompletionState.PENDING;
  private destroyers: (() => void)[] = [];
  private abortController = new AbortController();
  error: Error | null = null;
  value: any = null;
  isRunning = false;

  private resolveCallbacks: Set<
    Parameters<typeof Promise.prototype.then<Return>>[0]
  > = new Set();
  private rejectCallbacks: Set<Parameters<typeof Promise.prototype.catch>[0]> =
    new Set();
  private finallyCallbacks: Set<
    Parameters<typeof Promise.prototype.finally>[0]
  > = new Set();

  get isSuccessful() {
    return this.completionState === CompletionState.SUCCESS;
  }

  get isError() {
    return this.completionState === CompletionState.ERROR;
  }

  get isPending() {
    return this.completionState === CompletionState.PENDING;
  }

  get isCanceled() {
    return this.completionState === CompletionState.CANCEL;
  }

  constructor(task: TaskFunction<Return, Args>) {
    this.task = task;
    this.abortController.signal.addEventListener('abort', this.onAbort);
  }

  private resolve(value: Return) {
    this.abortController.signal.removeEventListener('abort', this.onAbort);

    this.isRunning = false;
    this.completionState = CompletionState.SUCCESS;
    this.value = value;
    this.resolveCallbacks.forEach((callback) => callback?.(value));
    this.finallyCallbacks.forEach((callback) => callback?.());
    this.destroyers = [];
  }

  private reject(reason?: any) {
    this.abortController.signal.removeEventListener('abort', this.onAbort);

    this.isRunning = false;
    this.completionState =
      reason instanceof TaskCancelationError
        ? CompletionState.CANCEL
        : CompletionState.ERROR;
    this.error = reason;

    if (!this.isCanceled) {
      this.rejectCallbacks.forEach((callback) => callback?.(reason));
    }

    this.finallyCallbacks.forEach((callback) => callback?.());
    this.destroyers.forEach((destroyer) => destroyer());
    this.destroyers = [];
  }

  setAbortController(abortController: AbortController) {
    this.abortController = abortController;
    return this;
  }

  perform(...args: Args) {
    if (this.abortController.signal.aborted) {
      return this;
    }

    try {
      this.isRunning = true;

      const generator = this.task(...args, {
        signal: this.abortController.signal,
      });

      const next = (data?: any) => {
        if (this.abortController.signal.aborted) {
          return;
        }

        const { value, done } = generator.next(data);

        const continuationCallback = done ? this.resolve.bind(this) : next;

        if (value instanceof TaskInstance) {
          value
            .setAbortController(this.abortController)
            .then(continuationCallback)
            .catch((error) => {
              this.reject(error);
              generator.return(undefined);
            });
          return;
        }

        if (value instanceof Yieldable) {
          this.destroyers.push(value.onDestroy.bind(value));

          value.then(continuationCallback).catch((error) => {
            this.reject(error);
            generator.return(undefined);
          });
          return;
        }

        if (value instanceof Promise) {
          value.then(continuationCallback).catch((error) => {
            this.reject(error);
            generator.return(undefined);
          });
          return;
        }

        try {
          continuationCallback(value);
        } catch (error) {
          this.reject(error);
          generator.return(undefined);
        }
      };

      next();
    } catch (error) {
      this.reject(error);
    } finally {
      return this;
    }
  }

  private onAbort = () => {
    this.reject(new TaskCancelationError());
  };

  cancel() {
    this.abortController.abort(new TaskCancelationError());
  }

  then = (
    resolveCallback: Parameters<typeof Promise.prototype.then<Return>>[0],
    rejectCallback?: Parameters<typeof Promise.prototype.then<Return>>[1]
  ) => {
    if (this.completionState === CompletionState.SUCCESS) {
      resolveCallback?.(this.value);
      return this;
    }

    if (
      rejectCallback &&
      (this.completionState === CompletionState.ERROR ||
        this.completionState === CompletionState.CANCEL)
    ) {
      rejectCallback(this.error);
      return this;
    }

    this.resolveCallbacks.add(resolveCallback);

    if (rejectCallback) {
      this.rejectCallbacks.add(rejectCallback);
    }

    return this;
  };

  catch = (callback: Parameters<typeof Promise.prototype.catch>[0]) => {
    if (
      this.completionState === CompletionState.ERROR ||
      this.completionState === CompletionState.CANCEL
    ) {
      callback?.(this.error);
    } else {
      this.rejectCallbacks.add(callback);
    }

    return this;
  };

  finally = (callback: Parameters<typeof Promise.prototype.finally>[0]) => {
    if (this.completionState === CompletionState.PENDING) {
      this.finallyCallbacks.add(callback);
    } else {
      callback?.();
    }

    return this;
  };
}
