interface Deferred {
  promise: Promise<unknown>;
  resolve: (value?: unknown) => void;
  reject: (value?: unknown) => void;
}

export class YieldableState {
  deferred: Deferred;

  constructor(deferred: Deferred) {
    this.deferred = deferred;
  }

  next(value?: any) {
    this.deferred.resolve(value);
  }

  cancel() {
    this.deferred.reject();
  }

  return(value?: any) {
    this.deferred.resolve(value);
  }

  throw(error: any) {
    this.deferred.reject(error);
  }
}

export class Yieldable {
  private promise: Promise<any> | null = null;
  onYield(_state: YieldableState): void {}
  onDestroy() {}

  private deferred(): Deferred {
    let resolve, reject;

    const promise = new Promise((resolveFn, rejectFn) => {
      resolve = resolveFn;
      reject = rejectFn;
    });

    // @ts-ignore
    return { promise, resolve, reject };
  }

  private toPromise() {
    if (this.promise) return this.promise;

    const deferred = this.deferred();

    const state = new YieldableState(deferred);

    this.onYield(state);

    this.promise = deferred.promise;

    return this.promise;
  }

  then(...args: Parameters<Promise<any>['then']>) {
    return this.toPromise().then(...args);
  }

  catch(...args: Parameters<Promise<any>['catch']>) {
    return this.toPromise().catch(...args);
  }

  finally(...args: Parameters<Promise<any>['finally']>) {
    return this.toPromise().finally(...args);
  }
}
