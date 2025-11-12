import { eventTarget } from "./eventTarget.js"
import { useSyncExternalStore } from "./react-deps.js";

// array of callback subscribed to hash updates
const listeners = {
  v: [],
};

const onHashChange = () => listeners.v.forEach((cb) => cb());

// we subscribe to `hashchange` only once when needed to guarantee that
// all listeners are called synchronously
const subscribeToHashUpdates = (callback) => {
  if (listeners.v.push(callback) === 1)
    eventTarget.addEventListener("hashchange", onHashChange);

  return () => {
    listeners.v = listeners.v.filter((i) => i !== callback);
    if (!listeners.v.length) eventTarget.removeEventListener("hashchange", onHashChange);
  };
};

// leading '#' is ignored, leading '/' is optional
const currentHashLocation = () => "/" + location.hash.replace(/^#?\/?/, "");

export const navigate = (to, { state = null, replace = false } = {}) => {
  const [hash, search] = to.replace(/^#?\/?/, "").split("?");

  const newRelativePath =
    location.pathname + (search ? `?${search}` : location.search) + `#/${hash}`;

  window.navigation.navigate(newRelativePath, { state, history: replace? "replace" : "push" })
};

export const useHashLocation = ({ ssrPath = "/" } = {}) => [
  useSyncExternalStore(
    subscribeToHashUpdates,
    currentHashLocation,
    () => ssrPath
  ),
  navigate,
];

useHashLocation.hrefs = (href) => "#" + href;
