import { Selector, Listener, EqualityFn, State, DependencyKey } from "./types";
import {
  FLAG_GLOBAL,
  FLAG_REMOVED,
  DEP_TYPE_SINGLE,
  DEP_TYPE_ARRAY,
  DEP_TYPE_SET,
  DEP_TYPE_SHIFT,
  DEP_TYPE_MASK,
} from "../internals/invalidation";
import {
  ReactiveNode,
  ReactiveNodeImpl,
  InvalidationGraph,
} from "../internals/graph";

export const FLAG_ULTRA_LITE = 1 << 4;
export const FLAG_BYPASS_CHECK = 1 << 5;

export interface SubscriptionNode<T extends State, S> extends ReactiveNode {
  selector: Selector<T, S>;
  listener: Listener<S>;
  equalityFn: EqualityFn<S>;
  lastSelectedState: S;
  next: SubscriptionNode<T, any> | null;
  prev: SubscriptionNode<T, any> | null;
  fastKey: DependencyKey | null;
}

class GlobalSubscriptionPool {
  private head: ReactiveNodeImpl | null = null;
  private _size = 0;

  constructor() {
    for (let i = 0; i < 1000; i++) {
      this.release(new ReactiveNodeImpl());
    }
  }

  get<T extends State, S>(id: number, flags: number): SubscriptionNode<T, S> {
    if (this.head) {
      const node = this.head;
      this.head = node.nextInPool as any;
      this._size--;

      node.id = id;
      node._flags = flags;
      node._maskLow = 0;
      node._maskHigh = 0;
      node._lastNotifiedId = 0;
      node._lastInvalidatedId = 0;
      node.dependencies = null;
      node.edgesHead = null;
      node.edgesTail = null;
      node.nextInBucket = null;
      node.prevInBucket = null;
      node.nextInPool = null;
      node.selector = null;
      node.listener = null;
      node.equalityFn = null;
      node.lastSelectedState = null;
      node._value = undefined;
      node.next = null;
      node.prev = null;
      node.fastKey = null;
      return node as unknown as SubscriptionNode<T, S>;
    }

    const node = new ReactiveNodeImpl() as unknown as SubscriptionNode<T, S>;
    node.id = id;
    node._flags = flags;
    return node;
  }

  release(node: ReactiveNode): void {
    if (this._size < 50000) {
      node.selector = null;
      node.listener = null;
      node.equalityFn = null;
      node.lastSelectedState = null;
      node.dependencies = null;
      node.edgesHead = null;
      node.edgesTail = null;
      node.nextInBucket = null;
      node.prevInBucket = null;
      (node as any).fastKey = null;
      (node as any).next = null;
      (node as any).prev = null;
      (node as any).getState = null;
      (node as any).getVersion = null;
      (node as any).onInvalidate = null;
      (node as any).registry = null;
      (node as any).metrics = null;
      (node as any).instrumentation = null;

      node.nextInPool = this.head;
      this.head = node as ReactiveNodeImpl;
      this._size++;
    }
  }
}
export const globalSubscriptionPool = new GlobalSubscriptionPool();

class GlobalUnsubscribePool {
  private pool: (() => void)[] = [];
  constructor() {
    for (let i = 0; i < 1000; i++) {
      const fn = function self(this: any) {
        const s = self as any;
        const n = s.node;
        const m = s.manager;
        if (!n || !m) return;
        if ((n._flags & FLAG_REMOVED) === 0) m.remove(n);
        s.node = null;
        s.manager = null;
        globalUnsubscribePool.release(s);
      } as any as () => void;
      (fn as any).node = null;
      (fn as any).manager = null;
      this.pool.push(fn);
    }
  }
  get(node: ReactiveNode, manager: SubscriptionManager<any>): () => void {
    const fn =
      this.pool.pop() ||
      (function self(this: any) {
        const s = self as any;
        const n = s.node;
        const m = s.manager;
        if (!n || !m) return;
        if ((n._flags & FLAG_REMOVED) === 0) m.remove(n);
        s.node = null;
        s.manager = null;
        globalUnsubscribePool.release(s);
      } as any as () => void);
    (fn as any).node = node;
    (fn as any).manager = manager;
    return fn;
  }
  release(fn: () => void): void {
    if (this.pool.length < 50000) this.pool.push(fn);
  }
}
export const globalUnsubscribePool = new GlobalUnsubscribePool();

export class SubscriptionManager<T extends State> {
  private globalHead: SubscriptionNode<T, any> | null = null;
  private globalTail: SubscriptionNode<T, any> | null = null;

  private keyLists: Map<DependencyKey, ReactiveNode | null> | null = null;
  private keyListsTail: Map<DependencyKey, ReactiveNode | null> | null = null;

  private bitLists: (ReactiveNode | null)[] | null = null;
  private bitListsTail: (ReactiveNode | null)[] | null = null;

  private notifyDepth = 0;
  private releaseHead: ReactiveNode | null = null;

  private _size = 0;
  private _globalSize = 0;
  private _fastPathCount = 0;
  private nextId = 0;
  constructor(private graph: InvalidationGraph | null = null) {}

  add<S>(
    selector: Selector<T, S>,
    listener: Listener<S>,
    equalityFn: EqualityFn<S>,
    initialState: S,
    isGlobal = true,
  ): SubscriptionNode<T, S> {
    const node = globalSubscriptionPool.get<T, S>(
      ++this.nextId,
      isGlobal ? FLAG_GLOBAL : 0,
    );
    node.selector = selector;
    node.listener = listener;
    node.equalityFn = equalityFn;
    node.lastSelectedState = initialState;

    if (isGlobal) {
      this.attachToGlobalList(node);
      this._globalSize++;
    }
    this._size++;
    return node;
  }

  getUnsubscribe(node: SubscriptionNode<T, any>): () => void {
    return globalUnsubscribePool.get(node, this);
  }

  remove(node: SubscriptionNode<T, any>): void {
    if ((node._flags & FLAG_REMOVED) !== 0) return;
    node._flags |= FLAG_REMOVED;
    if (this.graph && (node._flags & (FLAG_GLOBAL | FLAG_ULTRA_LITE)) === 0)
      this.graph.unregister(node.id);
    if ((node._flags & FLAG_GLOBAL) !== 0) {
      this.detachFromGlobalList(node);
      this._globalSize--;
    }

    if (node._maskLow !== 0 || node._maskHigh !== 0) {
      if (node._maskLow !== 0) {
        const i = 31 - Math.clz32(node._maskLow & -node._maskLow);
        this.unregisterFromBitBucket(i, node);
      } else {
        const i = 31 - Math.clz32(node._maskHigh & -node._maskHigh);
        this.unregisterFromBitBucket(i + 32, node);
      }
    } else if (node.fastKey !== null) {
      this.unregisterFromBucket(node.fastKey, node);
    } else if (node.dependencies !== null) {
      this.unregisterFromAllLists(node);
    }

    this.safeRelease(node);
    this._size--;
  }

  private safeRelease(node: ReactiveNode): void {
    if (this.notifyDepth > 0) {
      node.nextInPool = this.releaseHead;
      this.releaseHead = node;
    } else {
      globalSubscriptionPool.release(node);
    }
  }

  private flushDeferredRelease(): void {
    let curr = this.releaseHead;
    this.releaseHead = null;
    while (curr) {
      const next = curr.nextInPool;
      globalSubscriptionPool.release(curr);
      curr = next;
    }
  }

  registerForKey(
    key: DependencyKey,
    node: SubscriptionNode<T, any>,
    bitIndex: number = -1,
  ): void {
    this._fastPathCount++;
    if (bitIndex >= 0 && bitIndex < 64) {
      if (!this.bitLists) {
        this.bitLists = new Array(64).fill(null);
        this.bitListsTail = new Array(64).fill(null);
      }
      const tail = this.bitListsTail![bitIndex];
      if (tail) {
        tail.nextInBucket = node;
        node.prevInBucket = tail;
      } else {
        this.bitLists![bitIndex] = node;
      }
      this.bitListsTail![bitIndex] = node;
      if (bitIndex < 32) node._maskLow |= 1 << bitIndex;
      else node._maskHigh |= 1 << (bitIndex - 32);
      return;
    }

    node.fastKey = key;
    if (!this.keyLists) {
      this.keyLists = new Map();
      this.keyListsTail = new Map();
    }
    const tail = this.keyListsTail!.get(key);
    if (tail) {
      tail.nextInBucket = node;
      node.prevInBucket = tail;
    } else {
      this.keyLists!.set(key, node);
    }
    this.keyListsTail!.set(key, node);
  }

  private unregisterFromBucket(key: DependencyKey, node: ReactiveNode): void {
    if (!this.keyLists || !this.keyListsTail) return;
    this._fastPathCount--;
    const prev = node.prevInBucket;
    const next = node.nextInBucket;
    if (prev) prev.nextInBucket = next;
    else if (this.keyLists.get(key) === node) this.keyLists.set(key, next);

    if (next) next.prevInBucket = prev;
    else if (this.keyListsTail.get(key) === node)
      this.keyListsTail.set(key, prev);
  }

  private unregisterFromBitBucket(index: number, node: ReactiveNode): void {
    if (!this.bitLists || !this.bitListsTail) return;
    this._fastPathCount--;
    const prev = node.prevInBucket;
    const next = node.nextInBucket;
    if (prev) prev.nextInBucket = next;
    else if (this.bitLists[index] === node) this.bitLists[index] = next;

    if (next) next.prevInBucket = prev;
    else if (this.bitListsTail[index] === node) this.bitListsTail[index] = prev;
  }

  private unregisterFromAllLists(node: SubscriptionNode<T, any>): void {
    const deps = node.dependencies;
    const flags = node._flags;
    const type = (flags >> DEP_TYPE_SHIFT) & DEP_TYPE_MASK;
    if (type === DEP_TYPE_SINGLE)
      this.unregisterFromBucket(deps as DependencyKey, node);
    else if (type === DEP_TYPE_ARRAY) {
      const arr = deps as DependencyKey[];
      for (let i = 0; i < arr.length; i++)
        this.unregisterFromBucket(arr[i], node);
    } else if (type === DEP_TYPE_SET) {
      const s = deps as Set<DependencyKey>;
      const iter = s.values();
      let step = iter.next();
      while (!step.done) {
        this.unregisterFromBucket(step.value, node);
        step = iter.next();
      }
    }
  }

  promote(node: SubscriptionNode<T, any>): void {
    if ((node._flags & FLAG_GLOBAL) === 0) return;
    this.detachFromGlobalList(node);
    this._globalSize--;
    node._flags &= ~FLAG_GLOBAL;
  }

  private attachToGlobalList(node: SubscriptionNode<T, any>): void {
    if (this.globalTail) {
      this.globalTail.next = node;
      node.prev = this.globalTail;
    } else this.globalHead = node;
    this.globalTail = node;
  }

  private detachFromGlobalList(node: SubscriptionNode<T, any>): void {
    const prev = node.prev;
    const next = node.next;
    if (prev) prev.next = next;
    else this.globalHead = next;
    if (next) next.prev = prev;
    else this.globalTail = prev;
  }

  clear(): void {
    let current = this.globalHead;
    while (current) {
      const next = current.next;
      current._flags |= FLAG_REMOVED;
      globalSubscriptionPool.release(current);
      current = next;
    }
    this.globalHead = null;
    this.globalTail = null;
    if (this.keyLists) this.keyLists.clear();
    if (this.keyListsTail) this.keyListsTail.clear();
    if (this.bitLists) this.bitLists.fill(null);
    if (this.bitListsTail) this.bitListsTail.fill(null);
    this._size = 0;
    this._globalSize = 0;
    this._fastPathCount = 0;
  }

  startBatch(): void {
    this.notifyDepth++;
  }

  endBatch(): void {
    if (--this.notifyDepth === 0) {
      this.flushDeferredRelease();
    }
  }

  notifyBitmask(
    state: T,
    maskLow: number,
    maskHigh: number,
    flushId: number,
  ): void {
    const lists = this.bitLists;
    if (!lists) return;

    if (maskLow !== 0) {
      let m = maskLow;
      while (m !== 0) {
        const lowestBit = m & -m;
        const i = 31 - Math.clz32(lowestBit);
        let node = lists[i];
        while (node) {
          const next = node.nextInBucket;
          if ((node._flags & FLAG_REMOVED) === 0)
            this.executeNode(node as any, state, flushId);
          node = next;
        }
        m ^= lowestBit;
      }
    }

    if (maskHigh !== 0) {
      let m = maskHigh;
      while (m !== 0) {
        const lowestBit = m & -m;
        const i = 31 - Math.clz32(lowestBit);
        let node = lists[i + 32];
        while (node) {
          const next = node.nextInBucket;
          if ((node._flags & FLAG_REMOVED) === 0)
            this.executeNode(node as any, state, flushId);
          node = next;
        }
        m ^= lowestBit;
      }
    }
  }

  notifyKeys(state: T, changedKeys: DependencyKey[], flushId: number): void {
    const len = changedKeys.length;
    if (len === 0) return;
    for (let i = 0; i < len; i++) {
      const k = changedKeys[i];
      this.notifySingleKey(state, k, flushId);
    }
  }

  private notifySingleKey(state: T, k: DependencyKey, flushId: number): void {
    let node = (this.keyLists && this.keyLists.get(k)) || null;
    while (node) {
      const next = node.nextInBucket;
      if ((node._flags & FLAG_REMOVED) === 0)
        this.executeNode(node as any, state, flushId);
      node = next;
    }
  }

  public executeNode(
    node: SubscriptionNode<T, any>,
    state: T,
    flushId: number,
  ): void {
    if (node._lastNotifiedId !== flushId) {
      node._lastNotifiedId = flushId;
      const fk = node.fastKey;
      const selected = fk !== null ? (state as any)[fk] : node.selector(state);
      if (!node.equalityFn(selected, node.lastSelectedState)) {
        const prev = node.lastSelectedState;
        node.lastSelectedState = selected;
        node.listener(selected, prev);
      }
    }
  }

  notify(
    state: T,
    prevState: T,
    flushId: number,
    execute?: (node: SubscriptionNode<T, any>) => void,
  ): void {
    let node = this.globalHead;
    while (node) {
      const next = node.next;
      if ((node._flags & FLAG_REMOVED) === 0) {
        if (execute) execute(node);
        else this.executeNode(node, state, flushId);
      }
      node = next;
    }
  }

  get size(): number {
    return this._size;
  }
  get globalSize(): number {
    return this._globalSize;
  }
  get hasFastPath(): boolean {
    return this._fastPathCount > 0;
  }
}
