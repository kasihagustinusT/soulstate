### 1. Next.js App Router (Server & Client)
`createStore` is called in a separate file (`store.ts`) to create a singleton store for the client. Server components can pass initial data to client components that hydrate the store.

```typescript
// lib/store.ts
import { createStore } from 'soulstate';
export const useAppStore = createStore(initialState);

// app/page.tsx (Server Component)
import { MyClientComponent } from './my-client-component';
async function getData() { /* fetch data */ return { user: 'Admin' }; }

export default async function Page() {
  const data = await getData();
  return <MyClientComponent initialData={data} />;
}

// app/my-client-component.tsx (Client Component)
'use client';
import { useStore } from 'soulstate';
import { useAppStore } from '../lib/store';
import { useEffect } from 'react';

export function MyClientComponent({ initialData }) {
  const { user, setUser } = useStore(useAppStore, state => ({ user: state.user, setUser: state.setUser }));
  
  useEffect(() => {
    // Hydrate the store on mount
    setUser(initialData.user);
  }, [initialData, setUser]);

  return <div>Hello, {user}</div>;
}
```

### 2. Vanilla TypeScript
No React needed. Just subscribe to changes.
```typescript
import { createStore } from 'soulstate';
const store = createStore({ count: 0 });
const unsub = store.subscribe(state => state.count, (count) => {
  console.log('Count is now:', count);
});
store.set({ count: 1 }); // Logs: Count is now: 1
unsub();
```

### 3. React Native
Identical to React web. `useStore` works out of the box.
```tsx
import { Text, View, Button } from 'react-native';
import { useStore } from 'soulstate';
import { useCounterStore } from './store';

export function Counter() {
  const count = useStore(useCounterStore, s => s.count);
  const increment = useStore(useCounterStore, s => s.increment);
  return (
    <View>
      <Text>Count: {count}</Text>
      <Button title="+1" onPress={increment} />
    </View>
  );
}
```

### 4. Tauri / Electron (Main & Renderer Process)
Use a middleware to sync state between the main process (Node.js) and renderer process (browser).
```typescript
// main.ts (Electron Main Process)
import { ipcMain } from 'electron';
import { createStore } from 'soulstate';
const store = createStore({ value: 0 });
// Listen for updates from renderer
ipcMain.on('soulstate-update', (_, newState) => store.set(newState));
// Send updates to renderer
store.subscribe(s => s, (state) => {
  mainWindow.webContents.send('soulstate-sync', state);
});

// preload.ts (Bridge)
contextBridge.exposeInMainWorld('electron', {
  onStateSync: (cb) => ipcRenderer.on('soulstate-sync', (_, state) => cb(state)),
  updateState: (state) => ipcRenderer.send('soulstate-update', state),
});
```

### 5. Node.js Backend (In-Memory Cache)
A fast, observable in-memory cache for a Node.js server.
```typescript
import { createStore } from 'soulstate';
const userCache = createStore<{ [id: string]: User }>({});
// On user login, cache the user data
userCache.set(state => ({ ...state, [userId]: userData }));
// Subscribe to changes to log them
userCache.subscribe(s => s, (users) => console.log('User cache updated'));
```

### 6. Game Loop Engine
Store the game state (player position, score) in SoulState and use the non-reactive `store.get()` inside the high-frequency game loop for max performance.
```typescript
const store = createStore({ player: { x: 0, y: 0 }, score: 0 });

function gameLoop() {
  const state = store.get(); // Non-reactive, ultra-fast read
  state.player.x += 1;
  // Only call `set` when needed, not every frame
  if (hasScored) {
    store.set(s => ({ score: s.score + 10 }));
  }
  requestAnimationFrame(gameLoop);
}
```

### 7. Web Worker Shared State
Use a `BroadcastChannel` to sync state between the main thread and a web worker.
```typescript
// main.ts
const channel = new BroadcastChannel('soulstate');
const store = createStore({ value: 0 });
channel.onmessage = (ev) => store.set(ev.data);
store.subscribe(s => s, (state) => channel.postMessage(state));

// worker.ts
const channel = new BroadcastChannel('soulstate');
const store = createStore({ value: 0 });
channel.onmessage = (ev) => store.set(ev.data);
// Do heavy computation and update state
const result = heavyWork();
store.set({ value: result }); // Notifies main thread
```

### 8. Async Slice Data Fetching (Middleware)
```typescript
const asyncMiddleware = (store) => (set, get) => (updater) => {
  if (updater.isAsync) {
    set({ loading: true });
    updater.payload().then(data => {
      set({ data, loading: false, error: null });
    }).catch(error => {
      set({ error, loading: false });
    });
  } else {
    set(updater);
  }
};
// ... then in createStore, apply middleware
```

### 9. Undo/Redo Time-travel
Create a middleware that stores past states in an array.
```typescript
const timeTravelMiddleware = (store) => {
  const history = [];
  let pointer = -1;
  return (set, get) => (updater) => {
    const prevState = get();
    set(updater);
    const nextState = get();
    if (prevState !== nextState) {
      history.push(nextState);
      pointer++;
    }
  };
  // Expose undo/redo methods on the store
};
```

### 10. Form State Management
Manage complex form state without causing re-renders on every keystroke.
```tsx
const useFormStore = createStore({ values: { name: '', email: '' }, errors: {} });

function Form() {
  // Subscribe to the whole form state, but use `set` which doesn't cause re-renders on this component
  const set = useStore(useFormStore, s => s.set);
  
  return (
    <>
      <Input name="name" />
      <Input name="email" />
    </>
  );
}

function Input({ name }) {
  // This component subscribes to its own slice of state and re-renders independently
  const value = useStore(useFormStore, s => s.values[name]);
  const set = useStore(useFormStore, s => s.set);

  return <input value={value} onChange={e => set(s => ({ values: { ...s.values, [name]: e.target.value } }))} />;
}
```
