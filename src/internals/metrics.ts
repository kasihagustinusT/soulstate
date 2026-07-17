/**
 * SoulState Runtime Metrics
 * Provides diagnostics for the propagation lifecycle and selector execution.
 */

export interface MetricsSnapshot {
  flushCount: number;
  selectorRunCount: number;
  invalidationCount: number;
  averageFlushDuration: number;
  totalFlushDuration: number;
  lastFlushDuration: number;
}

export class RuntimeMetrics {
  private flushCount = 0;
  private selectorRunCount = 0;
  private invalidationCount = 0;
  private totalFlushDuration = 0;
  private lastFlushDuration = 0;

  recordFlush(duration: number): void {
    this.flushCount++;
    this.totalFlushDuration += duration;
    this.lastFlushDuration = duration;
  }

  recordSelectorRun(): void {
    this.selectorRunCount++;
  }

  recordInvalidation(): void {
    this.invalidationCount++;
  }

  getSnapshot(): MetricsSnapshot {
    return {
      flushCount: this.flushCount,
      selectorRunCount: this.selectorRunCount,
      invalidationCount: this.invalidationCount,
      totalFlushDuration: this.totalFlushDuration,
      averageFlushDuration:
        this.flushCount > 0 ? this.totalFlushDuration / this.flushCount : 0,
      lastFlushDuration: this.lastFlushDuration,
    };
  }

  reset(): void {
    this.flushCount = 0;
    this.selectorRunCount = 0;
    this.invalidationCount = 0;
    this.totalFlushDuration = 0;
    this.lastFlushDuration = 0;
  }
}
