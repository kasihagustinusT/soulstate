import { objectIs } from '../utils/equality';

// A node in the doubly linked list of subscribers
interface SubscriptionNode<T, S> {
  // The actual subscription logic
  selector: (state: T) => S;
  listener: (selectedState: S, prevSelectedState: S) => void;
  equalityFn: (a: S, b: S) => boolean;
  lastState: S;
  // Linked list pointers
  prev: SubscriptionNode<T, any> | null;
  next: SubscriptionNode<T, any> | null;
}

export interface SubscriptionManager<T> {
  subscribe: <S>(
    selector: (state: T) => S,
    listener: (selectedState: S, prevSelectedState: S) => void,
    equalityFn: ((a: S, b: S) => boolean) | undefined,
    initialState: T
  ) => () => void;
  notify: (newState: T, prevState: T) => void;
}

export function createSubscriptionManager<T>(): SubscriptionManager<T> {
  // Head and tail pointers for the doubly linked list
  let head: SubscriptionNode<T, any> | null = null;
  let tail: SubscriptionNode<T, any> | null = null;

  const subscribe = <S>(
    selector: (state: T) => S,
    listener: (selectedState: S, prevSelectedState: S) => void,
    equalityFn: (a: S, b: S) => boolean = objectIs,
    initialState: T
  ) => {
    const newNode: SubscriptionNode<T, S> = {
      selector,
      listener,
      equalityFn,
      lastState: selector(initialState),
      prev: tail,
      next: null,
    };

    if (tail) {
      tail.next = newNode;
    } else {
      head = newNode;
    }
    tail = newNode;

    // Return an unsubscribe function that performs O(1) removal
    return () => {
      const { prev, next } = newNode;
      if (prev) {
        prev.next = next;
      } else {
        head = next;
      }
      if (next) {
        next.prev = prev;
      } else {
        tail = prev;
      }
    };
  };

  const notify = (newState: T, prevState: T) => {
    if (Object.is(newState, prevState)) return;

    // Iterate through the linked list - no new iterator created
    let current = head;
    while (current) {
      const sub = current;
      const newSelectedState = sub.selector(newState);
      const lastState = sub.lastState;
      
      if (!sub.equalityFn(newSelectedState, lastState)) {
        sub.lastState = newSelectedState;
        sub.listener(newSelectedState, lastState);
      }
      
      current = current.next;
    }
  };

  return {
    subscribe,
    notify,
  };
}