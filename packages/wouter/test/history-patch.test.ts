import { vi, it, expect, describe } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useLocation as reactHook } from "wouter";

describe("history patch", () => {
  it("exports should exists", () => {
    expect(reactHook).toBeDefined();
  });

  it("history should be patched once", () => {
    const fn = vi.fn();
    const { result, act, unmount } = renderHook(() => reactHook());

    addEventListener("pushState", (e) => {
      fn();
    });

    expect(result.current[0]).toBe("/");
    expect(fn).toBeCalledTimes(0);

    act(() => result.current[1]("/hello"));
    act(() => result.current[1]("/world"));

    expect(result.current[0]).toBe("/world");
    expect(fn).toBeCalledTimes(2);

    unmount();
  });
});
