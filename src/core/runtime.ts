import {
  State,
  DependencyKey,
  RuntimeInstrumentation,
  Selector,
  Computed,
} from "./types";
import { SubscriptionManager, FLAG_BYPASS_CHECK } from "./subscriptions";
import { scheduleTask } from "./scheduler";
import { TransactionEngine } from "./transactions";
import { InvalidationGraph, ReactiveNode } from "../internals/graph";
import { RuntimeMetrics } from "../internals/metrics";
import {
  SelectorRegistry,
  runWithTracking,
  didDependenciesChange,
  createPolymorphicDependencies,
  FLAG_DIRTY,
  FLAG_REMOVED,
  FLAG_PENDING_TRACKING,
  FLAG_STATIC,
  DEP_TYPE_SHIFT,
  DEP_TYPE_MASK,
  DEP_TYPE_SET,
  globalSetPool,
  recomputeComputed,
} from "../internals/invalidation";

export class Runtime<T extends State> {
  private state: T;
  private prevState: T;
  private changedKeys: Set<DependencyKey> = new Set();
  private changedMaskLow = 0;
  private changedMaskHigh = 0;
  private isBatching = false;
  private isProcessing = false;
  private version = 0;
  private transactions: TransactionEngine<T>;
  private currentFlushDepth = 0;
  private flushId = 0;
  private instrumentation: RuntimeInstrumentation | null = null;
  private hasInstrumentation = false;
  private keysBuffer: DependencyKey[] = [];

  constructor(
    initialState: T,
    private subscriptions: SubscriptionManager<T>,
    private graph: InvalidationGraph,
    private selectors: SelectorRegistry<T>,
    private metrics: RuntimeMetrics | null,
  ) {
    this.state = initialState;
    this.prevState = initialState;
    this.transactions = new TransactionEngine(
      () => this.state,
      (nextState, keys) => this.setState(nextState, keys),
    );
  }

  getState(): T {
    const buffer = this.transactions.getBuffer();
    return buffer !== null ? buffer : this.state;
  }

  getVersion(): number {
    return this.version;
  }

  setState(nextState: T, keys?: DependencyKey[], sync?: boolean): void {
    if (this.transactions.isActive()) {
      this.transactions.track(nextState, keys);
      return;
    }
    if (nextState === this.state) return;
    this.state = nextState;
    this.version++;

    if (keys) {
      const flushId = ++this.flushId;
      const len = keys.length;
      const selectors = this.selectors;
      for (let i = 0; i < len; i++) {
        const key = keys[i];
        this.changedKeys.add(key);
        const index = selectors.getBitIndex(key);
        if (index >= 0 && index < 32) this.changedMaskLow |= 1 << index;
        else if (index >= 32 && index < 64)
          this.changedMaskHigh |= 1 << (index - 32);
      }
      this.graph.invalidate(keys, flushId);
    }

    if (sync) this.processUpdate();
    else this.requestUpdate();
  }

  beginTransaction(): void {
    this.transactions.begin();
  }
  commitTransaction(): void {
    this.transactions.commit();
  }
  rollbackTransaction(): void {
    this.transactions.rollback();
  }

  computed(...args: any[]): Computed<any> {
    if (
      args.length === 1 ||
      (args.length === 2 && typeof args[1] === "string")
    ) {
      const selector = args[0] as Selector<T, any>;
      const id = args[1] || Symbol("computed");
      return this.selectors.register(
        id,
        selector,
        () => this.getState(),
        (key) => {
          if (this.hasInstrumentation) {
            this.metrics?.recordInvalidation();
            this.instrumentation?.onInvalidate?.(key);
          }
        },
      );
    }
    const combiner = args.pop() as (...vals: any[]) => any;
    const deps = args as (Selector<T, any> | Computed<any>)[];
    const id = Symbol("computed_derived");
    const derivedSelector: Selector<T, any> = (state) => {
      const vals = deps.map((dep) =>
        dep && typeof dep === "object" && "value" in dep
          ? (dep as Computed<any>).value
          : (dep as Selector<T, any>)(state),
      );
      return combiner(...vals);
    };
    return this.selectors.register(
      id,
      derivedSelector,
      () => this.getState(),
      (key) => {
        if (this.hasInstrumentation) {
          this.metrics?.recordInvalidation();
          this.instrumentation?.onInvalidate?.(key);
        }
      },
    );
  }

  enableInstrumentation(options?: RuntimeInstrumentation): void {
    this.instrumentation = options || null;
    this.hasInstrumentation = !!options;
    this.selectors.setInstrumentation(this.instrumentation);
  }

  getMetrics() {
    return this.metrics?.getSnapshot() || null;
  }

  get hasGranularListeners(): boolean {
    return (
      this.graph.size > 0 ||
      this.subscriptions.hasFastPath ||
      this.hasInstrumentation
    );
  }

  private requestUpdate(): void {
    if (this.isBatching) return;
    this.isBatching = true;
    scheduleTask(() => this.processUpdate());
  }

  private processUpdate(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.currentFlushDepth = 0;

    const hasInstr = this.hasInstrumentation;
    const hasGraph = this.graph.size > 0;
    const hasSubsFastPath = this.subscriptions.hasFastPath;
    let needsFlush = true;

    try {
      while (needsFlush) {
        if (++this.currentFlushDepth > 100) {
          throw new Error(
            `[SoulState] Potential infinite propagation cycle detected.`,
          );
        }

        this.isBatching = false;
        const startTime = hasInstr ? performance.now() : 0;
        const currentState = this.state;
        this.prevState = currentState;
        const currentFlushId = this.flushId;
        const keysSnapshot = hasInstr ? new Set(this.changedKeys) : null;

        this.subscriptions.startBatch();
        try {
          const hasMask =
            this.changedMaskLow !== 0 || this.changedMaskHigh !== 0;
          const hasKeys = this.changedKeys.size > 0;

          if (hasMask || hasKeys) {
            const keyCount = this.selectors.keyCount;
            if (keyCount > 0 && keyCount <= 64) {
              const low = this.changedMaskLow;
              const high = this.changedMaskHigh;
              this.changedMaskLow = 0;
              this.changedMaskHigh = 0;
              this.changedKeys.clear();
              this.subscriptions.notifyBitmask(
                currentState,
                low,
                high,
                currentFlushId,
              );
            } else {
              this.changedMaskLow = 0;
              this.changedMaskHigh = 0;
              const buf = this.keysBuffer;
              buf.length = 0;
              for (const k of this.changedKeys) buf[buf.length++] = k;
              this.changedKeys.clear();
              this.subscriptions.notifyKeys(currentState, buf, currentFlushId);
            }
          }

          const needsGraph =
            hasGraph || (hasSubsFastPath && (hasMask || hasKeys)) || hasInstr;
          if (needsGraph) {
            const affectedByLevel = this.graph.consumeAffectedNodes();
            if (affectedByLevel) {
              this.notifyGranular(
                currentState,
                affectedByLevel,
                currentFlushId,
              );
              this.graph.recycleAffected(affectedByLevel);
            }
          }

          this.subscriptions.notify(
            currentState,
            this.prevState,
            currentFlushId,
            (node) => {
              if ((node._flags & FLAG_PENDING_TRACKING) !== 0) {
                const { result: selected, keys: currentDeps } = runWithTracking(
                  currentState,
                  node.selector,
                );

                if (currentDeps.size === 1) {
                  let key: DependencyKey | undefined;
                  for (const k of currentDeps) {
                    key = k;
                    break;
                  }
                  if (
                    key !== undefined &&
                    selected === (currentState as any)[key]
                  ) {
                    node.fastKey = key;
                    node._flags &= ~FLAG_PENDING_TRACKING;
                    node._flags |= FLAG_STATIC;
                    this.subscriptions.promote(node);
                    this.subscriptions.registerForKey(
                      key,
                      node,
                      this.selectors.getBitIndex(key),
                    );

                    if (!node.equalityFn(selected, node.lastSelectedState)) {
                      const prev = node.lastSelectedState;
                      node.lastSelectedState = selected;
                      node.listener(selected, prev);
                    }
                    node._lastNotifiedId = currentFlushId;
                    return;
                  }
                }

                const { deps, type } =
                  createPolymorphicDependencies(currentDeps);
                node.dependencies = deps;
                node._flags =
                  (node._flags &
                    ~(
                      (DEP_TYPE_MASK << DEP_TYPE_SHIFT) |
                      FLAG_PENDING_TRACKING
                    )) |
                  (type << DEP_TYPE_SHIFT);
                this.subscriptions.promote(node);
                this.graph.register(node as any);

                if (!node.equalityFn(selected, node.lastSelectedState)) {
                  const prev = node.lastSelectedState;
                  node.lastSelectedState = selected;
                  node.listener(selected, prev);
                }
                node._lastNotifiedId = currentFlushId;
              } else {
                this.subscriptions.executeNode(
                  node,
                  currentState,
                  currentFlushId,
                );
              }
            },
          );
        } finally {
          this.subscriptions.endBatch();
        }

        if (hasInstr) {
          const duration = performance.now() - startTime;
          this.metrics?.recordFlush(duration);
          this.instrumentation?.onFlush?.(duration, keysSnapshot || new Set());
        }

        needsFlush =
          this.isBatching ||
          this.changedKeys.size > 0 ||
          (hasGraph && this.graph.hasPendingAffected());
      }
    } finally {
      this.isProcessing = false;
      this.currentFlushDepth = 0;
    }
  }

  private notifyGranular(
    currentState: T,
    affectedByLevel: (ReactiveNode[] | undefined)[],
    flushId: number,
  ): void {
    const hasInstr = this.hasInstrumentation;
    const len = affectedByLevel.length;
    for (let level = 0; level < len; level++) {
      const levelNodes = affectedByLevel[level];
      if (levelNodes === undefined) continue;

      for (let i = 0; i < levelNodes.length; i++) {
        const node = levelNodes[i];
        const flags = node._flags;
        if ((flags & FLAG_REMOVED) !== 0 || node._lastNotifiedId === flushId)
          continue;

        if (node.listener !== null) {
          node._lastNotifiedId = flushId;

          if ((flags & FLAG_BYPASS_CHECK) !== 0) {
            node.listener(null, null);
            continue;
          }

          let startTime = 0;
          if (hasInstr) startTime = performance.now();

          let selected: any;
          if ((flags & FLAG_STATIC) !== 0 && flushId % 100 !== 0) {
            selected = node.selector(currentState);
          } else {
            const { result, keys: currentDeps } = runWithTracking(
              currentState,
              node.selector,
            );
            selected = result;
            if (!didDependenciesChange(node.dependencies, flags)) {
              const stability = (flags >> 12) & 0xf;
              if (stability < 15) {
                node._flags = (flags & ~(0xf << 12)) | ((stability + 1) << 12);
                if (stability === 10) node._flags |= FLAG_STATIC;
              }
            } else {
              node._flags &= ~((0xf << 12) | FLAG_STATIC);
              const { deps: nextDeps } =
                createPolymorphicDependencies(currentDeps);
              this.graph.updateDependencies(node.id, nextDeps);
              if (
                ((flags >> DEP_TYPE_SHIFT) & DEP_TYPE_MASK) === DEP_TYPE_SET &&
                node.dependencies
              ) {
                globalSetPool.release(node.dependencies);
              }
            }
          }

          if (hasInstr) {
            this.metrics?.recordSelectorRun();
            this.instrumentation!.onSelectorRun!(
              node.selector.name || "sub",
              performance.now() - startTime,
            );
          }

          if (!node.equalityFn(selected, node.lastSelectedState)) {
            const prev = node.lastSelectedState;
            node.lastSelectedState = selected;
            node.listener(selected, prev);
          }
        } else {
          recomputeComputed(node);
        }
      }
    }
  }
}
