import { test, expect, vi } from "vitest";
import { scheduleTask, flushSync } from "../src/core/scheduler";

test("Scheduler: should batch multiple tasks into a single microtask", async () => {
  const task1 = vi.fn();
  const task2 = vi.fn();

  scheduleTask(task1);
  scheduleTask(task2);

  expect(task1).not.toHaveBeenCalled();
  expect(task2).not.toHaveBeenCalled();

  await Promise.resolve();

  expect(task1).toHaveBeenCalledTimes(1);
  expect(task2).toHaveBeenCalledTimes(1);
});

test("Scheduler: should deduplicate identical tasks", async () => {
  const task = vi.fn();

  scheduleTask(task);
  scheduleTask(task);

  await Promise.resolve();

  expect(task).toHaveBeenCalledTimes(1);
});

test("Scheduler: should maintain stable ordering (FIFO)", async () => {
  const results: number[] = [];
  const task1 = () => results.push(1);
  const task2 = () => results.push(2);
  const task3 = () => results.push(3);

  scheduleTask(task1);
  scheduleTask(task2);
  scheduleTask(task3);

  await Promise.resolve();

  expect(results).toEqual([1, 2, 3]);
});

test("Scheduler: should handle tasks scheduled during flush", async () => {
  const results: string[] = [];

  const taskB = vi.fn(() => results.push("B"));
  const taskA = vi.fn(() => {
    results.push("A");
    scheduleTask(taskB);
  });

  scheduleTask(taskA);

  await Promise.resolve(); // First microtask for taskA
  expect(results).toEqual(["A"]);

  await Promise.resolve(); // Second microtask for taskB
  expect(results).toEqual(["A", "B"]);
});

test("Scheduler: flushSync should execute immediately", () => {
  const task = vi.fn();
  flushSync(task);
  expect(task).toHaveBeenCalledTimes(1);
});
