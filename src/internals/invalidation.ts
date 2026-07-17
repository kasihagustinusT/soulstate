import {
  DependencyKey,
  State,
  Selector,
  Computed,
  RuntimeInstrumentation,
} from "../core/types";
import {
  InvalidationGraph,
  ReactiveNode,
  ReactiveNodeImpl,
  Edge,
} from "./graph";
import { RuntimeMetrics } from "./metrics";
import { globalSubscriptionPool } from "../core/subscriptions";

export const FLAG_DIRTY = 1 << 0;
export const FLAG_REMOVED = 1 << 1;
export const FLAG_GLOBAL = 1 << 2;
export const FLAG_PENDING_TRACKING = 1 << 3;
export const FLAG_STATIC = 1 << 6;
export const FLAG_VERIFY = 1 << 7;

export const DEP_TYPE_NONE = 0;
export const DEP_TYPE_SINGLE = 1;
export const DEP_TYPE_ARRAY = 2;
export const DEP_TYPE_SET = 3;

export const DEP_TYPE_SHIFT = 8;
export const DEP_TYPE_MASK = 0xf;

export const LEVEL_SHIFT = 16;
export const LEVEL_MASK = 0xffff;

interface TrackingContext {
  accessedKeys: DependencyKey[];
  count: number;
  prev: TrackingContext | null;
}

let currentContext: TrackingContext | null = null;
export const sharedAccessedKeys = new Set<DependencyKey>();
export let lastAccessedKeys: Set<DependencyKey> | null = null;

export function didDependenciesChange(oldDeps: any, flags: number): boolean {
  const currentDeps = sharedAccessedKeys;
  const type = (flags >> DEP_TYPE_SHIFT) & DEP_TYPE_MASK;
  if (type === DEP_TYPE_NONE) return currentDeps.size !== 0;
  if (type === DEP_TYPE_SINGLE)
    return currentDeps.size !== 1 || !currentDeps.has(oldDeps as DependencyKey);
  if (type === DEP_TYPE_ARRAY) {
    const arr = oldDeps as DependencyKey[];
    if (currentDeps.size !== arr.length) return true;
    for (let i = 0; i < arr.length; i++)
      if (!currentDeps.has(arr[i])) return true;
    return false;
  }
  const set = oldDeps as Set<DependencyKey>;
  if (currentDeps.size !== set.size) return true;
  for (const key of currentDeps) {
    if (!set.has(key)) return true;
  }
  return false;
}

const trackingKeysBuffer = new Array(1024);

class ContextPool {
  private pool: TrackingContext[] = [];
  get(): TrackingContext {
    const ctx = this.pool.pop() || {
      accessedKeys: new Array(32),
      count: 0,
      prev: null,
    };
    ctx.count = 0;
    ctx.prev = null;
    return ctx;
  }
  release(ctx: TrackingContext): void {
    if (this.pool.length < 256) {
      ctx.accessedKeys =
        ctx.accessedKeys.length <= 1024 ? ctx.accessedKeys : new Array(32);
      this.pool.push(ctx);
    }
  }
}
const contextPool = new ContextPool();

export class SetPool {
  private pool: Set<DependencyKey>[] = [];
  get(): Set<DependencyKey> {
    const s = this.pool.pop() || new Set();
    s.clear();
    return s;
  }
  release(s: Set<DependencyKey>): void {
    if (this.pool.length < 1000) {
      s.clear();
      this.pool.push(s);
    }
  }
}
export const globalSetPool = new SetPool();

let recomputeDepth = 0;
const RECOMPUTE_THRESHOLD = 128;
let isIterativeActive = false;

let currentTarget: any = null;

const handler: ProxyHandler<any> = {
  get(_, prop) {
    if (currentContext !== null) {
      currentContext.accessedKeys[currentContext.count++] =
        prop as DependencyKey;
    }
    return currentTarget[prop];
  },
};
const trackingProxy = new Proxy({}, handler);

export function runWithTracking<T extends object, R>(
  target: T,
  fn: (proxy: T) => R,
): { result: R; keys: Set<DependencyKey> } {
  const prevTarget = currentTarget;
  const prevContext = currentContext;
  const isTopLevel = prevContext === null;

  const context: TrackingContext = isTopLevel
    ? { accessedKeys: trackingKeysBuffer, count: 0, prev: null }
    : contextPool.get();
  context.prev = prevContext;

  currentContext = context;
  currentTarget = target;
  try {
    const result = fn(trackingProxy as T);
    const keys = isTopLevel ? sharedAccessedKeys : new Set<DependencyKey>();
    keys.clear();
    for (let i = 0; i < context.count; i++) {
      keys.add(context.accessedKeys[i]);
    }
    return { result, keys };
  } finally {
    currentContext = prevContext;
    currentTarget = prevTarget;
    if (!isTopLevel) contextPool.release(context);
  }
}

export function createPolymorphicDependencies(
  currentDeps: Set<DependencyKey>,
): { deps: any; type: number } {
  const size = currentDeps.size;
  if (size === 0) return { deps: null, type: DEP_TYPE_NONE };
  if (size === 1)
    return { deps: currentDeps.values().next().value, type: DEP_TYPE_SINGLE };
  if (size <= 4) {
    const arr = new Array(size);
    let i = 0;
    for (const k of currentDeps) arr[i++] = k;
    return { deps: arr, type: DEP_TYPE_ARRAY };
  }
  const s = globalSetPool.get();
  for (const key of currentDeps) s.add(key);
  return { deps: s, type: DEP_TYPE_SET };
}

export class KeyRegistry {
  private keyToBitIndex: Map<DependencyKey, number> = new Map();
  private nextIndex = 0;

  getBitIndex(key: DependencyKey): number {
    let index = this.keyToBitIndex.get(key);
    if (index === undefined) {
      if (this.nextIndex >= 64) return -1;
      index = this.nextIndex++;
      this.keyToBitIndex.set(key, index);
    }
    return index;
  }

  get size(): number {
    return this.keyToBitIndex.size;
  }
}

export class SelectorRegistry<T extends State> {
  private computedNodes: Map<DependencyKey, ReactiveNode> = new Map();
  private instrumentation: RuntimeInstrumentation | null = null;
  private keyRegistry = new KeyRegistry();
  private _computedCount = 0;
  constructor(
    private graph: InvalidationGraph,
    private metrics: RuntimeMetrics,
    private getVersion: () => number,
  ) {}

  getBitIndex(key: DependencyKey): number {
    return this.keyRegistry.getBitIndex(key);
  }
  get keyCount(): number {
    return this.keyRegistry.size;
  }
  get computedCount(): number {
    return this._computedCount;
  }
  setInstrumentation(instr: RuntimeInstrumentation | null): void {
    this.instrumentation = instr;
  }
  isComputed(key: DependencyKey): boolean {
    return this.computedNodes.has(key);
  }
  getNode(id: any): ReactiveNode | undefined {
    return this.graph.getNode(id);
  }

  register<S>(
    name: DependencyKey,
    selector: Selector<T, S>,
    getState: () => T,
    onInvalidate: (key: DependencyKey) => void,
  ): Computed<S> {
    const node = globalSubscriptionPool.get(name as any, FLAG_DIRTY) as any;
    node.selector = selector;
    node.getState = getState;
    node.getVersion = this.getVersion;
    node.onInvalidate = onInvalidate;
    node.registry = this;
    node.metrics = this.metrics;
    node.instrumentation = this.instrumentation;

    node.invalidate = function () {
      if ((this._flags & FLAG_DIRTY) === 0) {
        this._flags |= FLAG_DIRTY;
        this.onInvalidate(this.id);
        return true;
      }
      return false;
    };

    this.computedNodes.set(name, node);
    this._computedCount++;
    this.graph.register(node);

    return {
      get value() {
        if (currentContext !== null) {
          currentContext.accessedKeys[currentContext.count++] = node.id;
        }
        if (
          (node._flags & (FLAG_DIRTY | FLAG_REMOVED)) !== 0 &&
          !isIterativeActive
        )
          recomputeComputed(node);
        return node._value;
      },
      get name() {
        return node.id as DependencyKey;
      },
      destroy() {
        node.registry.unregister(node.id);
      },
    };
  }

  updateDependencies(nodeName: DependencyKey, dependencies: any): void {
    if (this.computedNodes.has(nodeName))
      this.graph.updateDependencies(nodeName, dependencies);
  }
  unregister(nodeName: DependencyKey): void {
    const node = this.computedNodes.get(nodeName);
    if (node) {
      this.graph.unregister(nodeName);
      this.computedNodes.delete(nodeName);
      this._computedCount--;
      globalSubscriptionPool.release(node);
    }
  }
  clear(): void {
    this.computedNodes.forEach((node, name) => {
      this.graph.unregister(name);
      globalSubscriptionPool.release(node);
    });
    this.computedNodes.clear();
    this._computedCount = 0;
  }
}

export function recomputeComputed(node: any): void {
  recomputeDepth++;
  try {
    if (recomputeDepth > RECOMPUTE_THRESHOLD) {
      iterativeRecompute(node);
      return;
    }
    _recomputeComputedImpl(node);
  } finally {
    recomputeDepth--;
  }
}

function iterativeRecompute(rootNode: any): void {
  if (isIterativeActive) {
    _recomputeComputedImpl(rootNode);
    return;
  }
  isIterativeActive = true;
  const registry = rootNode.registry;
  try {
    const nodesToCompute: any[] = [];
    const nodeDepth: number[] = [];
    const visited = new Set<any>();
    const queue: any[] = [rootNode];
    visited.add(rootNode.id);
    nodeDepth[rootNode.id] = 0;

    while (queue.length > 0) {
      const node = queue.pop()!;
      const { keys } = runWithTracking(node.getState(), node.selector);
      const d = nodeDepth[node.id] || 0;
      for (const key of keys) {
        const depNode = registry.getNode(key);
        if (
          depNode &&
          (depNode._flags & FLAG_DIRTY) !== 0 &&
          !visited.has(depNode.id)
        ) {
          visited.add(depNode.id);
          queue.push(depNode);
          nodeDepth[depNode.id] = d + 1;
        }
      }
      nodesToCompute[nodesToCompute.length] = node;
    }

    nodesToCompute.sort(
      (a, b) => (nodeDepth[b.id] || 0) - (nodeDepth[a.id] || 0),
    );

    for (let i = 0; i < nodesToCompute.length; i++) {
      if ((nodesToCompute[i]._flags & FLAG_DIRTY) !== 0) {
        _recomputeComputedImpl(nodesToCompute[i]);
      }
    }
  } finally {
    isIterativeActive = false;
  }
}

function _recomputeComputedImpl(node: any): void {
  const instr = node.instrumentation;
  const hasInstr = instr !== null && instr.onSelectorRun !== undefined;
  const startTime = hasInstr ? performance.now() : 0;
  if (hasInstr) node.metrics.recordSelectorRun();
  try {
    const flags = node._flags;
    if (
      (flags & FLAG_STATIC) !== 0 &&
      ((flags >> DEP_TYPE_SHIFT) & DEP_TYPE_MASK) === DEP_TYPE_SINGLE
    ) {
      node._value = node.selector(node.getState());
    } else {
      const { result, keys: currentDeps } = runWithTracking(
        node.getState(),
        node.selector,
      );
      node._value = result;
      if (didComputedDepsChange(node, currentDeps)) {
        const oldDeps = node.dependencies;
        const oldFlags = node._flags;
        const { deps: nextDeps } = createPolymorphicDependencies(currentDeps);

        node._maskLow = 0;
        node._maskHigh = 0;
        if (nextDeps instanceof Set) {
          for (const key of nextDeps) {
            const idx = node.registry.getBitIndex(key);
            if (idx >= 0 && idx < 32) node._maskLow |= 1 << idx;
            else if (idx >= 32 && idx < 64) node._maskHigh |= 1 << (idx - 32);
          }
        } else if (Array.isArray(nextDeps)) {
          for (let i = 0; i < nextDeps.length; i++) {
            const idx = node.registry.getBitIndex(nextDeps[i]);
            if (idx >= 0 && idx < 32) node._maskLow |= 1 << idx;
            else if (idx >= 32 && idx < 64) node._maskHigh |= 1 << (idx - 32);
          }
        } else if (nextDeps !== null) {
          const idx = node.registry.getBitIndex(nextDeps);
          if (idx >= 0 && idx < 32) node._maskLow |= 1 << idx;
          else if (idx >= 32 && idx < 64) node._maskHigh |= 1 << (idx - 32);
        }

        node.registry.updateDependencies(node.id, nextDeps);
        if (
          ((oldFlags >> DEP_TYPE_SHIFT) & DEP_TYPE_MASK) === DEP_TYPE_SET &&
          oldDeps
        )
          globalSetPool.release(oldDeps);
        node._flags &= ~((0xf << 12) | FLAG_STATIC);
      } else {
        const stability = (flags >> 12) & 0xf;
        if (stability < 15) {
          node._flags = (flags & ~(0xf << 12)) | ((stability + 1) << 12);
          if (stability === 10) node._flags |= FLAG_STATIC;
        }
      }
    }
    node._flags &= ~FLAG_DIRTY;
    if (hasInstr) instr.onSelectorRun!(node.id, performance.now() - startTime);
  } catch (e) {
    node._flags |= FLAG_DIRTY;
    throw e;
  }
}

function didComputedDepsChange(
  node: any,
  currentDeps: Set<DependencyKey>,
): boolean {
  const type = (node._flags >> DEP_TYPE_SHIFT) & DEP_TYPE_MASK;
  if (type === DEP_TYPE_NONE) return currentDeps.size !== 0;
  if (type === DEP_TYPE_SINGLE)
    return (
      currentDeps.size !== 1 ||
      !currentDeps.has(node.dependencies as DependencyKey)
    );
  if (type === DEP_TYPE_ARRAY) {
    const arr = node.dependencies as DependencyKey[];
    if (currentDeps.size !== arr.length) return true;
    for (let i = 0; i < arr.length; i++)
      if (!currentDeps.has(arr[i])) return true;
    return false;
  }
  const set = node.dependencies as Set<DependencyKey>;
  if (currentDeps.size !== set.size) return true;
  for (const key of currentDeps) {
    if (!set.has(key)) return true;
  }
  return false;
}
