/**
 * Executes a callback and returns a promise that resolve when `hashchange` event is fired.
 * Rejects after `throwAfter` milliseconds.
 */
export const waitForHashChangeEvent = async (
  cb: () => void,
  throwAfter = 1000
) =>
  new Promise<void>((resolve, reject) => {
    const abortController = new AbortController()
    let timeout: ReturnType<typeof setTimeout>;

    const onChange = () => {
      resolve();
      clearTimeout(timeout);
      abortController.abort()
    };

    window.navigation.addEventListener("navigate", e => {
      if (e.hashChange) onChange()
    }, { signal: abortController.signal });
    cb();

    timeout = setTimeout(() => {
      reject(new Error("Timed out: `hashchange` event did not fire!"));
      abortController.abort()
    }, throwAfter);
  });
