import { useSyncExternalStore } from "./react-deps.js";

const subscribeToLocationUpdates = (callback) => {
  const abortController = new AbortController()

  window.navigation.addEventListener("navigate", e => {
    if (e.canIntercept !== true) return

    e.intercept({ handler: callback })
  }, { signal: abortController.signal });

  return () => {
    abortController.abort()
  };
};

export const useLocationProperty = (fn, ssrFn) =>
  useSyncExternalStore(subscribeToLocationUpdates, fn, ssrFn);

const currentSearch = () => location.search;

export const useSearch = ({ ssrSearch = "" } = {}) =>
  useLocationProperty(currentSearch, () => ssrSearch);

const currentPathname = () => location.pathname;

export const usePathname = ({ ssrPath } = {}) =>
  useLocationProperty(
    currentPathname,
    ssrPath ? () => ssrPath : currentPathname
  );

const currentHistoryState = () => history.state;
export const useHistoryState = () =>
  useLocationProperty(currentHistoryState, () => null);

// do not change this to Navigation API's `navigate()`.
// Executing `navigate()` without user interaction is restricted,
// so it cannot be simply replaced.
export const navigate = (to, { replace = false, state = null } = {}) =>
  history[replace ? "replaceState" : "pushState"](state, "", to);

// the 2nd argument of the `useBrowserLocation` return value is a function
// that allows to perform a navigation.
export const useBrowserLocation = (opts = {}) => [usePathname(opts), navigate];
