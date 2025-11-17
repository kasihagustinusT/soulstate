export interface DevToolsConfig {
  name?: string;
  trace?: boolean;
  features?: any;
}

export function devtools(
  store: any,
  config: DevToolsConfig = {}
) {
  if (typeof window === 'undefined') return store;
  
  const extension = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
  if (!extension) return store;
  
  const { name = 'SoulState', trace = false, features } = config;
  const devTools = extension.connect({ name, trace, features });
  
  devTools.init(store.getState());
  
  const originalSetState = store.setState;
  
  store.setState = (partial: any) => {
    const prevState = store.getState();
    originalSetState(partial);
    const nextState = store.getState();
    
    devTools.send('setState', nextState, prevState, name);
  };
  
  // Subscribe to DevTools changes
  devTools.subscribe((message: any) => {
    if (message.type === 'DISPATCH') {
      switch (message.payload.type) {
        case 'JUMP_TO_STATE':
        case 'JUMP_TO_ACTION':
          store.setState(message.payload.state);
          break;
        case 'COMMIT':
          devTools.init(store.getState());
          break;
        case 'RESET':
          store.setState(store.initialState);
          devTools.init(store.getState());
          break;
      }
    }
  });
  
  return store;
}
