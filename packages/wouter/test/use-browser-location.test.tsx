import { useEffect } from "react";
import { it, expect, describe, beforeEach, vi } from "vitest";
import { renderHook } from "vitest-browser-react"
import {
  useBrowserLocation,
  navigate,
  useSearch,
  useHistoryState,
} from "wouter/use-browser-location";

it("returns a pair [value, update]", () => {
  const { result, unmount } = renderHook(() => useBrowserLocation());
  const [value, update] = result.current;

  expect(typeof value).toBe("string");
  expect(typeof update).toBe("function");
  unmount();
});

describe("`value` first argument", () => {
  beforeEach(() => history.replaceState(null, "", "/"));

  it("reflects the current pathname", () => {
    const { result, unmount } = renderHook(() => useBrowserLocation());
    expect(result.current[0]).toBe("/");
    unmount();
  });

  it("reacts to `pushState` / `replaceState`", () => {
    const { result, act, unmount } = renderHook(() => useBrowserLocation());

    act(() => history.pushState(null, "", "/foo"));
    expect(result.current[0]).toBe("/foo");

    act(() => history.replaceState(null, "", "/bar"));
    expect(result.current[0]).toBe("/bar");
    unmount();
  });

  it("supports history.back() navigation", async () => {
    const { result, act, unmount } = renderHook(() => useBrowserLocation());

    act(() => history.pushState(null, "", "/foo"));
    await vi.waitFor(() => expect(result.current[0]).toBe("/foo"));

    act(() => {
      history.back();
    });

    // Workaround for happy-dom: manually dispatch popstate event
    // happy-dom doesn't fully implement history.back() popstate events
    act(() => {
      const popstateEvent = new PopStateEvent("popstate", {
        state: history.state,
      });
      window.dispatchEvent(popstateEvent);
    });

    await vi.waitFor(() => expect(result.current[0]).toBe("/"), { timeout: 1000 });
    unmount();
  });

  it("supports history state", () => {
    const { result, act, unmount } = renderHook(() => useBrowserLocation());
    const { result: state, unmount: unmountState } = renderHook(() =>
      useHistoryState()
    );

    const navigate = result.current[1];

    act(() => navigate("/path", { state: { hello: "world" } }));

    expect(state.current).toStrictEqual({ hello: "world" });

    unmount();
    unmountState();
  });

  it("uses fail-safe escaping", () => {
    const { result, act } = renderHook(() => useBrowserLocation());
    const navigate = result.current[1];

    act(() => navigate("/%not-valid"));
    expect(result.current[0]).toBe("/%not-valid");

    act(() => navigate("/99%"));
    expect(result.current[0]).toBe("/99%");
  });
});

describe("`useSearch` hook", () => {
  beforeEach(() => history.replaceState(null, "", "/"));

  it("allows to get current search string", () => {
    const { result: searchResult, act } = renderHook(() => useSearch());
    act(() => navigate("/foo?hello=world&whats=up"));

    expect(searchResult.current).toBe("?hello=world&whats=up");
  });

  it("returns empty string when there is no search string", () => {
    const { result: searchResult, act } = renderHook(() => useSearch());

    expect(searchResult.current).toBe("");

    act(() => navigate("/foo"));
    expect(searchResult.current).toBe("");

    act(() => navigate("/foo? "));
    expect(searchResult.current).toBe("");
  });

  it("does not re-render when only pathname is changed", async () => {
    // count how many times each hook is rendered
    const locationRenders = { current: 0 };
    const searchRenders = { current: 0 };

    // count number of rerenders for each hook
    renderHook(() => {
      useEffect(() => {
        locationRenders.current += 1;
      });
      return useBrowserLocation();
    });

    renderHook(() => {
      useEffect(() => {
        searchRenders.current += 1;
      });
      return useSearch();
    });

    await expect.poll(() => locationRenders.current).toBe(1);
    await expect.poll(() => searchRenders.current).toBe(1);

    navigate("/foo");

    await expect.poll(() => locationRenders.current).toBe(2);
    await expect.poll(() => searchRenders.current).toBe(1);

    navigate("/foo?bar");
    await expect.poll(() => locationRenders.current).toBe(2); // no re-render
    await expect.poll(() => searchRenders.current).toBe(2);

    navigate("/baz?bar");
    await expect.poll(() => locationRenders.current).toBe(3); // no re-render
    await expect.poll(() => searchRenders.current).toBe(2);
  });
});

describe("`update` second parameter", () => {
  it("rerenders the component", () => {
    const { result, act, unmount } = renderHook(() => useBrowserLocation());
    const update = result.current[1];

    act(() => update("/about"));
    expect(result.current[0]).toBe("/about");
    unmount();
  });

  it("changes the current location", () => {
    const { result, act, unmount } = renderHook(() => useBrowserLocation());
    const update = result.current[1];

    act(() => update("/about"));
    expect(location.pathname).toBe("/about");
    unmount();
  });

  it.skipIf(history.length === 50)("saves a new entry in the History object", () => {
    const { result, act, unmount } = renderHook(() => useBrowserLocation());
    const update = result.current[1];

    const histBefore = history.length;
    act(() => update("/about"));

    expect(history.length).toBe(histBefore + 1);
    unmount();
  });

  it("replaces last entry with a new entry in the History object", () => {
    const { result, act, unmount } = renderHook(() => useBrowserLocation());
    const update = result.current[1];

    const histBefore = history.length;
    act(() => update("/foo", { replace: true }));

    expect(history.length).toBe(histBefore);
    expect(location.pathname).toBe("/foo");
    unmount();
  });

  it("stays the same reference between re-renders (function ref)", () => {
    const { result, rerender, unmount } = renderHook(() =>
      useBrowserLocation()
    );

    const updateWas = result.current[1];
    rerender();
    const updateNow = result.current[1];

    expect(updateWas).toBe(updateNow);
    unmount();
  });
});
