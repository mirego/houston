export class Stack<T> {
  private stack: T[] = [];

  get size() {
    return this.stack.length;
  }

  get first(): T | undefined {
    return this.stack[0];
  }

  get last(): T | undefined {
    return this.stack[this.stack.length - 1];
  }

  shift() {
    return this.stack.shift();
  }

  pop() {
    return this.stack.pop();
  }

  add(object: T) {
    this.stack.push(object);

    return this;
  }

  delete(object: T) {
    const index = this.stack.indexOf(object);

    if (index < 0) return false;

    this.stack.splice(index, 1);

    return true;
  }

  clear() {
    this.stack = [];
  }

  forEach(callback: (object: T) => void) {
    // We make a copy of the original array because in some
    // places the array is modified in place and this causes
    // the callback to not be called for all elements
    return [...this.stack].forEach(callback);
  }
}
