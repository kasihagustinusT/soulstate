/**
 * SoulState Transaction Engine
 * Buffers updates during transactions for atomic commits.
 */

import { State, DependencyKey } from "./types";

export class TransactionEngine<T extends State> {
  private buffer: T | null = null;
  private changedKeys: Set<DependencyKey> = new Set();
  private depth = 0;

  constructor(
    private getState: () => T,
    private onCommit: (nextState: T, keys: DependencyKey[]) => void,
  ) {}

  isActive(): boolean {
    return this.depth > 0;
  }

  getBuffer(): T | null {
    return this.buffer;
  }

  begin(): void {
    if (this.depth === 0) {
      this.buffer = Object.assign({}, this.getState());
      this.changedKeys.clear();
    }
    this.depth++;
  }

  track(nextState: T, keys?: DependencyKey[]): void {
    this.buffer = nextState;
    if (keys) {
      for (let i = 0; i < keys.length; i++) {
        this.changedKeys.add(keys[i]);
      }
    }
  }

  commit(): void {
    if (this.depth === 0) return;

    this.depth--;
    if (this.depth === 0 && this.buffer) {
      const finalState = this.buffer;
      const finalKeys = Array.from(this.changedKeys);
      this.buffer = null;
      this.changedKeys.clear();
      this.onCommit(finalState, finalKeys);
    }
  }

  rollback(): void {
    if (this.depth === 0) return;
    this.depth = 0;
    this.buffer = null;
    this.changedKeys.clear();
  }
}
