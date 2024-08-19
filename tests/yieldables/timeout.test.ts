import { expect, test, describe } from 'vitest';
import { task as taskFactory, timeout } from '../../lib';

describe('Timeout yieldable', () => {
  test('should make the task wait for a number of milliseconds', async () => {
    const task = taskFactory(function* () {
      const time = Date.now();
      yield timeout(500);
      return Date.now() - time;
    });

    const timeSpent = await task.perform();

    expect(timeSpent).toBeGreaterThanOrEqual(500);
  });
});
