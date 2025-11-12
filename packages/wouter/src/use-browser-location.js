import { eventTarget } from "./eventTarget.js"
import { useSyncExternalStore } from "./react-deps.js";

const subscribeToLocationUpdates = (callback) => {
  const abortController = new AbortController()

  eventTarget.addEventListener("navigate", callback, { signal: abortController.signal })

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

let lastEntry = undefined
let historyStateCache = undefined
const currentHistoryState = () => {
  const currentEntry = window.navigation.currentEntry

  if (currentEntry != lastEntry) {
    lastEntry = currentEntry
    historyStateCache = currentEntry.getState()
  }

  return historyStateCache
}
export const useHistoryState = () =>
  useLocationProperty(currentHistoryState, () => null);

export const navigate = (to, { replace = false, state = null } = {}) =>
  window.navigation.navigate(to, { history: replace ? 'replace' : 'push', state })

// the 2nd argument of the `useBrowserLocation` return value is a function
// that allows to perform a navigation.
export const useBrowserLocation = (opts = {}) => [usePathname(opts), navigate];

let isEventListenerAttached = false

if (window !== undefined && !isEventListenerAttached) {
  isEventListenerAttached = true

  window.navigation.addEventListener("navigate", e => {
    if (e.canIntercept !== true) return

    e.intercept({
      handler() {
        if (e.hashChange) {
          eventTarget.dispatchEvent(new CustomEvent("hashchange"))
        }
        eventTarget.dispatchEvent(new CustomEvent("navigate"))
      }
    })
  })
}