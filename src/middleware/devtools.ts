import { Middleware, State } from "../core/types";

export interface DevToolsOptions {
  name?: string;
  enabled?: boolean;
}

export const devtools =
  <T extends State>(options: DevToolsOptions = {}): Middleware<T> =>
  (creator) =>
  (set, get, api) => {
    if (options.enabled === false) {
      return creator(set, get, api);
    }

    if (
      typeof window === "undefined" ||
      !(window as any).__REDUX_DEVTOOLS_EXTENSION__
    ) {
      return creator(set, get, api);
    }

    const extension = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
    const devTools = extension.connect({ name: options.name || "SoulState" });

    let isApplyingDevToolsState = false;

    const initialState = creator(
      (updater, replace) => {
        const prevState = get();
        set(updater, replace);
        if (!isApplyingDevToolsState) {
          devTools.send("setState", get(), prevState);
        }
      },
      get,
      api,
    );

    devTools.init(initialState);

    devTools.subscribe((message: any) => {
      if (message.type === "DISPATCH" && message.payload) {
        if (
          message.payload.type === "JUMP_TO_STATE" ||
          message.payload.type === "JUMP_TO_ACTION"
        ) {
          isApplyingDevToolsState = true;
          try {
            set(JSON.parse(message.state), true);
          } catch {
            // Ignore malformed payloads from DevTools extension
          } finally {
            isApplyingDevToolsState = false;
          }
        }
      }
    });

    return initialState;
  };
