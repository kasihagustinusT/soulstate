/**
 * SoulState Scheduler
 * Deterministic microtask batching with stable ordering and zero-allocation re-entry.
 */

type Task = () => void;

let queue: Task[] = [];
let isPending = false;

const _queueMicrotask =
  typeof queueMicrotask === "function"
    ? queueMicrotask
    : (cb: () => void) => Promise.resolve().then(cb);

function flush(): void {
  isPending = false;

  const currentQueue = queue;
  queue = [];

  for (let i = 0; i < currentQueue.length; i++) {
    currentQueue[i]();
  }

  if (queue.length > 0 && !isPending) {
    isPending = true;
    _queueMicrotask(flush);
  }
}

export function scheduleTask(task: Task): void {
  if (queue.length === 1 && queue[0] === task) return;

  queue.push(task);

  if (!isPending) {
    isPending = true;
    _queueMicrotask(flush);
  }
}

/**
 * Invoke a callback synchronously. This does NOT drain the microtask
 * notification queue — it simply executes the callback immediately.
 * Use this when you need synchronous state updates (e.g. inside event
 * handlers) but be aware that subscriber notifications may still be
 * batched.
 */
export function flushSync<T>(callback: () => T): T {
  return callback();
}
