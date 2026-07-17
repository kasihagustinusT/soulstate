import { DependencyKey } from "../core/types";
import {
  FLAG_REMOVED,
  DEP_TYPE_NONE,
  DEP_TYPE_SINGLE,
  DEP_TYPE_ARRAY,
  DEP_TYPE_SET,
  DEP_TYPE_SHIFT,
  DEP_TYPE_MASK,
  LEVEL_SHIFT,
  LEVEL_MASK,
} from "./invalidation";

export interface ReactiveNode {
  id: any;
  _flags: number;
  _maskLow: number;
  _maskHigh: number;
  _lastNotifiedId: number;
  _lastInvalidatedId: number;
  dependencies: any;
  edgesHead: Edge | null;
  edgesTail: Edge | null;

  nextInBucket: ReactiveNode | null;
  prevInBucket: ReactiveNode | null;
  nextInPool: ReactiveNode | null;

  selector: any;
  listener: any;
  equalityFn: any;
  lastSelectedState: any;
  _value: any;

  invalidate(): boolean;
}

export class ReactiveNodeImpl implements ReactiveNode {
  public id: any = 0;
  public _flags: number = 0;
  public _maskLow: number = 0;
  public _maskHigh: number = 0;
  public _lastNotifiedId: number = 0;
  public _lastInvalidatedId: number = 0;

  public dependencies: any = null;
  public edgesHead: Edge | null = null;
  public edgesTail: Edge | null = null;

  public nextInBucket: ReactiveNode | null = null;
  public prevInBucket: ReactiveNode | null = null;
  public nextInPool: ReactiveNode | null = null;

  public selector: any = null;
  public listener: any = null;
  public equalityFn: any = null;
  public lastSelectedState: any = null;
  public _value: any = undefined;

  public next: ReactiveNode | null = null;
  public prev: ReactiveNode | null = null;
  public fastKey: any = null;

  public getState: any = null;
  public getVersion: any = null;
  public onInvalidate: any = null;
  public registry: any = null;
  public metrics: any = null;
  public instrumentation: any = null;

  constructor() {}

  invalidate(): boolean {
    return false;
  }
}

export interface Edge {
  target: ReactiveNode;
  next: Edge | null;
  prev: Edge | null;
}

class GlobalEdgePool {
  private pool: Edge[] = [];
  constructor() {
    for (let i = 0; i < 500; i++) {
      this.pool.push({ target: null as any, next: null, prev: null });
    }
  }
  get(target: ReactiveNode): Edge {
    const e = this.pool.pop() || { target, next: null, prev: null };
    e.target = target;
    e.next = null;
    e.prev = null;
    return e;
  }
  release(e: Edge): void {
    e.target = null as any;
    e.next = null;
    e.prev = null;
    if (this.pool.length < 20000) this.pool.push(e);
  }
}
const edgePool = new GlobalEdgePool();

export class InvalidationGraph {
  private nodes: Map<any, ReactiveNode> = new Map();

  private stateHeadArray: (Edge | null)[] | null = null;
  private stateTailArray: (Edge | null)[] | null = null;

  private stateHead: Map<DependencyKey, Edge | null> | null = null;
  private stateTail: Map<DependencyKey, Edge | null> | null = null;

  private affected: (ReactiveNode[] | undefined)[] = [];
  private affectedLen = 0;
  private hasAffected = false;
  private affectedPool: (ReactiveNode[] | undefined)[][] = [];

  private queue: ReactiveNode[] = new Array(1024);
  private queueHead = 0;
  private queueTail = 0;

  private keyRegistry?: any;

  constructor() {}

  setKeyRegistry(registry: any): void {
    this.keyRegistry = registry;
  }

  getBitIndex(key: DependencyKey): number {
    return this.keyRegistry ? this.keyRegistry.getBitIndex(key) : -1;
  }

  register(node: ReactiveNode): void {
    this.nodes.set(node.id, node);
    node.edgesHead = null;
    node.edgesTail = null;
    if (node.dependencies) {
      const deps = node.dependencies;
      node.dependencies = null;
      this.updateDependencies(node.id, deps);
    }
  }

  unregister(id: any): void {
    const node = this.nodes.get(id);
    if (!node) return;
    node._flags |= FLAG_REMOVED;
    this.updateDependencies(id, null);
    this.nodes.delete(id);
  }

  updateDependencies(id: any, nextDeps: any): void {
    const node = this.nodes.get(id);
    if (!node) return;

    const oldDeps = node.dependencies;
    const oldFlags = node._flags;

    let type = DEP_TYPE_NONE;
    if (nextDeps instanceof Set) type = DEP_TYPE_SET;
    else if (Array.isArray(nextDeps)) type = DEP_TYPE_ARRAY;
    else if (nextDeps !== null) type = DEP_TYPE_SINGLE;

    const nextFlags =
      (oldFlags & ~(DEP_TYPE_MASK << DEP_TYPE_SHIFT)) |
      (type << DEP_TYPE_SHIFT);

    this.forEachDep(oldDeps, oldFlags, (dep) => {
      if (!this.hasDep(nextDeps, type, dep)) this.removeEdge(dep, node);
    });
    this.forEachDep(nextDeps, nextFlags, (dep) => {
      if (
        !this.hasDep(oldDeps, (oldFlags >> DEP_TYPE_SHIFT) & DEP_TYPE_MASK, dep)
      )
        this.addEdge(dep, node);
    });

    node.dependencies = nextDeps;
    node._flags = nextFlags;

    const level = this.calcLevel(nextDeps, nextFlags);
    if (((node._flags >> LEVEL_SHIFT) & LEVEL_MASK) !== level) {
      node._flags =
        (node._flags & ~(LEVEL_MASK << LEVEL_SHIFT)) | (level << LEVEL_SHIFT);
      this.propagateLevel(node);
    }
  }

  private addEdge(source: DependencyKey, target: ReactiveNode): void {
    const sourceNode = this.nodes.get(source);
    const edge = edgePool.get(target);
    if (sourceNode) {
      const tail = sourceNode.edgesTail;
      if (!tail) sourceNode.edgesHead = edge;
      else {
        tail.next = edge;
        edge.prev = tail;
      }
      sourceNode.edgesTail = edge;
    } else {
      const bitIndex = this.keyRegistry
        ? this.keyRegistry.getBitIndex(source)
        : -1;
      if (bitIndex >= 0 && bitIndex < 64) {
        if (!this.stateHeadArray) {
          this.stateHeadArray = new Array(64).fill(null);
          this.stateTailArray = new Array(64).fill(null);
        }
        const tail = this.stateTailArray![bitIndex];
        if (!tail) {
          this.stateHeadArray![bitIndex] = edge;
          this.stateTailArray![bitIndex] = edge;
        } else {
          tail.next = edge;
          edge.prev = tail;
          this.stateTailArray![bitIndex] = edge;
        }
      } else {
        if (!this.stateHead) {
          this.stateHead = new Map();
          this.stateTail = new Map();
        }
        const tail = this.stateTail!.get(source);
        if (!tail) {
          this.stateHead!.set(source, edge);
          this.stateTail!.set(source, edge);
        } else {
          tail.next = edge;
          edge.prev = tail;
          this.stateTail!.set(source, edge);
        }
      }
    }
  }

  private removeEdge(source: DependencyKey, target: ReactiveNode): void {
    const sourceNode = this.nodes.get(source);
    const bitIndex =
      !sourceNode && this.keyRegistry
        ? this.keyRegistry.getBitIndex(source)
        : -1;

    let edge: Edge | null = null;
    if (sourceNode) edge = sourceNode.edgesHead;
    else if (bitIndex >= 0 && bitIndex < 64)
      edge = this.stateHeadArray ? this.stateHeadArray[bitIndex] : null;
    else edge = this.stateHead ? this.stateHead.get(source) || null : null;

    while (edge) {
      if (edge.target === target) {
        const p = edge.prev;
        const n = edge.next;
        if (p) p.next = n;
        else {
          if (sourceNode) sourceNode.edgesHead = n;
          else if (bitIndex >= 0 && bitIndex < 64)
            this.stateHeadArray![bitIndex] = n;
          else if (n) this.stateHead!.set(source, n);
          else this.stateHead!.delete(source);
        }
        if (n) n.prev = p;
        else {
          if (sourceNode) sourceNode.edgesTail = p;
          else if (bitIndex >= 0 && bitIndex < 64)
            this.stateTailArray![bitIndex] = p;
          else if (p) this.stateTail!.set(source, p);
          else this.stateTail!.delete(source);
        }
        edgePool.release(edge);
        return;
      }
      edge = edge.next;
    }
  }

  private forEachDep(deps: any, flags: number, cb: (k: DependencyKey) => void) {
    if (!deps) return;
    const type = (flags >> DEP_TYPE_SHIFT) & DEP_TYPE_MASK;
    if (type === DEP_TYPE_SINGLE) cb(deps as DependencyKey);
    else if (type === DEP_TYPE_ARRAY) {
      const arr = deps as any[];
      for (let i = 0; i < arr.length; i++) cb(arr[i]);
    } else if (type === DEP_TYPE_SET) {
      for (const key of deps as Set<any>) cb(key);
    }
  }

  private hasDep(deps: any, type: number, key: DependencyKey): boolean {
    if (!deps) return false;
    if (type === DEP_TYPE_SINGLE) return deps === key;
    if (type === DEP_TYPE_ARRAY) return (deps as any[]).includes(key);
    if (type === DEP_TYPE_SET) return (deps as Set<any>).has(key);
    return false;
  }

  private calcLevel(deps: any, flags: number): number {
    let max = -1;
    this.forEachDep(deps, flags, (d) => {
      const node = this.nodes.get(d);
      if (node) {
        const l = (node._flags >> LEVEL_SHIFT) & LEVEL_MASK;
        if (l > max) max = l;
      }
    });
    return max + 1;
  }

  private propagateLevel(node: ReactiveNode): void {
    let head = 0;
    let tail = 1;
    this.queue[0] = node;

    while (head < tail) {
      const n = this.queue[head++];
      let edge = n.edgesHead;
      while (edge) {
        const target = edge.target;
        const nextL = this.calcLevel(target.dependencies, target._flags);
        if (((target._flags >> LEVEL_SHIFT) & LEVEL_MASK) !== nextL) {
          target._flags =
            (target._flags & ~(LEVEL_MASK << LEVEL_SHIFT)) |
            (nextL << LEVEL_SHIFT);
          if (tail < this.queue.length) this.queue[tail++] = target;
        }
        edge = edge.next;
      }
    }
  }

  invalidate(keys: DependencyKey[], flushId: number): void {
    const len = keys.length;
    if (len === 0) return;
    this.queueHead = 0;
    this.queueTail = 0;

    const registry = this.keyRegistry;
    const heads = this.stateHeadArray;
    const headsFallback = this.stateHead;

    for (let i = 0; i < len; i++) {
      const k = keys[i];
      const bitIndex = registry ? registry.getBitIndex(k) : -1;

      let edge: Edge | null = null;
      if (bitIndex >= 0 && bitIndex < 64) edge = heads ? heads[bitIndex] : null;
      else edge = headsFallback ? headsFallback.get(k) || null : null;

      while (edge) {
        const target = edge.target;
        if (target._lastInvalidatedId !== flushId) {
          target._lastInvalidatedId = flushId;
          target.invalidate();
          this.addToAffected(target);
          if (this.queueTail < this.queue.length)
            this.queue[this.queueTail++] = target;
        }
        edge = edge.next;
      }
    }

    while (this.queueHead < this.queueTail) {
      const source = this.queue[this.queueHead++];
      let edge = source.edgesHead;
      while (edge) {
        const target = edge.target;
        if (target._lastInvalidatedId !== flushId) {
          target._lastInvalidatedId = flushId;
          target.invalidate();
          this.addToAffected(target);
          if (this.queueTail < this.queue.length)
            this.queue[this.queueTail++] = target;
        }
        edge = edge.next;
      }
    }
  }

  private addToAffected(node: ReactiveNode): void {
    const l = (node._flags >> LEVEL_SHIFT) & LEVEL_MASK;
    if (l >= this.affected.length) {
      this.affected.length = l + 1;
    }
    let list = this.affected[l];
    if (!list) {
      list = [];
      this.affected[l] = list;
    }
    list[list.length] = node;
    this.hasAffected = true;
    if (l >= this.affectedLen) this.affectedLen = l + 1;
  }

  consumeAffectedNodes(): (ReactiveNode[] | undefined)[] | null {
    if (!this.hasAffected) return null;
    const res = this.affected;
    const pool = this.affectedPool;
    const len = this.affectedLen;
    this.affected = pool.length > 0 ? pool.pop()! : new Array(len);
    this.affected.length = len;
    this.affectedLen = 0;
    this.hasAffected = false;
    return res;
  }

  clearAffected(): void {
    for (let i = 0; i < this.affectedLen; i++) {
      if (this.affected[i]) this.affected[i]!.length = 0;
    }
    this.affectedLen = 0;
    this.hasAffected = false;
  }

  hasPendingAffected(): boolean {
    return this.hasAffected;
  }
  getNode(id: any): ReactiveNode | undefined {
    return this.nodes.get(id);
  }
  recycleAffected(arr: (ReactiveNode[] | undefined)[]): void {
    if (arr && this.affectedPool.length < 8) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i]) arr[i]!.length = 0;
      }
      this.affectedPool.push(arr);
    }
  }
  get size(): number {
    return this.nodes.size;
  }
  clear(): void {
    this.nodes.clear();
    if (this.stateHead) this.stateHead.clear();
    if (this.stateTail) this.stateTail.clear();
    if (this.stateHeadArray) this.stateHeadArray.fill(null);
    if (this.stateTailArray) this.stateTailArray.fill(null);
    this.clearAffected();
  }
}
