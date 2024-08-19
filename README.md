<div align="center">
  <img src="https://github.com/user-attachments/assets/66653547-c9fd-4dec-82c1-ea0b58d8c96c" width="359">

  <p>
    <strong>Houston</strong> is a library built by <a href="https://www.mirego.com">Mirego</a> that gives you a Task primitive<br>to better handle async actions cancelation and concurrency.
  </p>

<a href="https://github.com/mirego/houston/actions/workflows/ci.yaml"><img src="https://github.com/mirego/houston/actions/workflows/ci.yaml/badge.svg?branch=main" /></a>
<a href="https://github.com/mirego/houston/tags"><img src="https://img.shields.io/npm/v/houston.svg"></a><br /><br />

</div>

> — Houston we have a problem!<br>
> — Don’t panic, we’ll take care of every step of the procedure for you.

## Concept

Houston gives you three things to handle complex async flows: Task, TaskInstance and Yieldable.

### Task

Tasks are defined as generators with a little twist: yielding a Promise, a TaskInstance or a Yieldable will pause the execution until the operation is completed. You can see it as having an async function replacing `await` with `yield`. “Why generators instead of async/await?” you ask, well generators give us the ability to halt execution in the middle of an operation more easily when comes time to cancel a Task.

### TaskInstance

TaskInstances are basically Promises on steroids: they can be canceled, they can cancel other tasks and yieldables and they can be scheduled to run at the moment you want. They are also promise-like which means they can be awaited just like any other promise.

### Yieldable

Yieldables are helper classes that help you wait on specific events: time passing, animationFrame, idleCallback, etc. You can even define your own yieldables if you ever need to wait on something we haven’t thought of!

### Cancelation

As we’ve established before, TaskInstances a promise-like and they can be canceled. But what happens when you cancel a TaskInstances?

**Canceling a TaskInstance will skip `then` and `catch` callbacks but will run `finally` callbacks so that your cleanup logic is run**

## Installation

With npm:

```sh
npm install @mirego/houston
```

With Yarn:

```sh
yarn add @mirego/houston
```

## Usage

### Defining a task

```ts
import { task } from '@mirego/houston';

const helloTask = task<[firstName: string, lastName: string], string>(
  function* (firstName, lastName) {
    return `Hello ${firstName} ${lastName}`;
  }
);

(async () => {
  const returnValue = await helloTask.perform('John', 'Doe');

  console.log(returnValue); // Outputs "Hello John Doe"
})();
```

### Canceling a task

```ts
import { task } from '@mirego/houston';

const helloTask = task<[firstName: string, lastName: string], string>(
  function* (firstName, lastName) {
    return `Hello ${firstName} ${lastName}`;
  }
);

(async () => {
  try {
    const helloTaskInstance = helloTask.perform('John', 'Doe');

    // The task could cancel all instances at once
    // helloTask.cancelAll();

    // Or you can cancel the individual instances
    helloTaskInstance.cancel();

    await taskInstance;
  } catch (_error) {
    // Do nothing
  } finally {
    // We’ll fall here since the task was canceled
  }

  console.log(returnValue); // Outputs "Hello John Doe"
})();
```

### Scheduling tasks using task modifiers

#### The `drop` modifier

The drop modifier drops tasks that are `.perform()`ed while another is already running. Dropped tasks' functions are never even called.

Example use case: submitting a form and dropping other submissions if there’s already one running.

```ts
import { task } from '@mirego/houston';

const submitFormTask = task<[data: string]>({ drop: true }, function* (data) {
  yield fetch(someURL, { method: 'post', body: data });
});

someForm.addEventListener('submit', async (event: SubmitEvent) => {
  const serializedData = getDataFromForm(event.currentTarget);

  // Even if the user submits the form multiple times, subsequent calls will simply be canceled.
  await submitFormTask.perform(serializedData);
});
```

#### The `restartable` modifier

The _restartable_ modifier ensures that only one instance of a task is running by canceling any currently-running tasks and starting a new task instance immediately. There is no task overlap, currently running tasks get canceled if a new task starts before a prior one completes.

Example use case: debouncing an action. Paired with the `timeout` yieldable, a restartable task acts as a debounced function with async capabilities!

```ts
import { task, timeout } from '@mirego/houston';

const debounceAutocompleteTask = task<[query: string]>(
  { restartable: true },
  function* (query) {
    yield timeout(200);

    const response = yield fetch(`${someURL}?q=${query}`);
    const json = yield response.json();

    updateUI(json);
  }
);

someInput.addEventListener('input', (event) => {
  debounceAutocompleteTask.perform(event.currentTarget.value);
});
```

#### The `enqueue` modifier

The _enqueue_ modifier ensures that only one instance of a task is running by maintaining a queue of pending tasks and running them sequentially. There is no task overlap, but no tasks are canceled either.

Example use case: sending analytics

```ts
import { task, timeout } from '@mirego/houston';

const sendAnalyticsTask = task<[event: AnalyticsEvent]>(
  { enqueue: true },
  function* (event) {
    const response = yield fetch(someURL, { method: 'post', body: event });
  }
);

// Somewhere else in the code
someButton.addEventListener('click', () => {
  sendAnalyticsTask.perform({ type: 'some-button-click' });
});
```

#### The `keepLatest` modifier

The _keepLatest_ will drop all but the most recent intermediate `.perform()`, which is enqueued to run later.

Example use case: you poll the server in a loop, but during the server request, you get some other indication (say, via websockets) that the data is stale and you need to query the server again when the initial request completed.

```ts
import { task, timeout } from '@mirego/houston';

const pollServerTask = task({ keepLatest: true }, function* () {
  const response = yield fetch(someURL);
  const json = yield response.json();

  update(json);
});

setInterval(() => {
  pollServerTask.perform();
}, 10_000);

// Somewhere else in the code
pollServerTask.perform();
```

## Inspiration

Houston was heavily inspired by [ember-concurrency](https://ember-concurrency.com/). Since working on non-Ember projects, the one thing we missed was ember-concurrency. Thank you to all the contributors who made this project possible!

## License

Houston is © 2024 [Mirego](https://www.mirego.com) and may be freely distributed under the [New BSD license](http://opensource.org/licenses/BSD-3-Clause). See the [`LICENSE.md`](./LICENSE.md) file.

The planet logo is based on [this lovely icon by Vector Place](https://thenounproject.com/browse/icons/term/planet/), from the Noun Project. Used under a [Creative Commons BY 3.0](http://creativecommons.org/licenses/by/3.0/) license.

## About Mirego

[Mirego](https://www.mirego.com) is a team of passionate people who believe that work is a place where you can innovate and have fun. We’re a team of [talented people](https://life.mirego.com) who imagine and build beautiful Web and mobile applications. We come together to share ideas and [change the world](http://www.mirego.org).

We also [love open-source software](https://open.mirego.com) and we try to give back to the community as much as we can.
