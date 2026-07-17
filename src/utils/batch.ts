import { scheduleTask } from "../core/scheduler";

/**
 * Batches multiple state updates into a single notification cycle.
 * In SoulState, this is handled automatically via microtasks,
 * but this utility provides an explicit way to group operations.
 */
export function batch(callback: () => void): void {
  // In our microtask-based runtime, this is essentially a no-op
  // as updates are already batched.
  callback();
}
