import { useStore } from "./useStore";
import { shallow } from "../utils/shallow";
import { StoreApi, State, Selector } from "../core/types";

export function useShallow<T extends State, S>(
  api: StoreApi<T>,
  selector: Selector<T, S>,
): S {
  return useStore(api, selector, shallow);
}
