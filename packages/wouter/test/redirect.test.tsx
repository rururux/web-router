import { useState } from "react";
import { it, expect } from "vitest";
import { render } from "vitest-browser-react";
import { Redirect, Router } from "wouter";

export const customHookWithReturn =
  (initialPath = "/") =>
  () => {
    const [path, updatePath] = useState(initialPath);
    const navigate = (path: string) => {
      updatePath(path);
      return "foo";
    };

    return [path, navigate];
  };

it("renders nothing", () => {
  const { container } = render(<Redirect to="/users" />)

  expect(container.childNodes.length).toBe(0);
});

it("results in change of current location", () => {
  render(<Redirect to="/users" />);

  expect(location.pathname).toBe("/users");
});

it("supports `base` routers with relative path", () => {
  render(
    <Router base="/app">
      <Redirect to="/nested" />
    </Router>
  );

  expect(location.pathname).toBe("/app/nested");
});

it("supports `base` routers with absolute path", () => {
  render(
    <Router base="/app">
      <Redirect to="~/absolute" />
    </Router>
  );

  expect(location.pathname).toBe("/absolute");
});

it("supports replace navigation", () => {
  const histBefore = window.navigation.entries().length;

  render(<Redirect to="/users" replace />);

  expect(location.pathname).toBe("/users");
  expect(window.navigation.entries().length).toBe(histBefore);
});

it("supports history state", () => {
  const testState = { hello: "world" };
  render(<Redirect to="/users" state={testState} />);

  expect(location.pathname).toBe("/users");
  expect(window.navigation.currentEntry?.getState()).toStrictEqual(testState);
});

it("useLayoutEffect should return nothing", () => {
  render(
    // @ts-expect-error
    <Router hook={customHookWithReturn()}>
      <Redirect to="/users" replace />
    </Router>
  );

  expect(location.pathname).toBe("/users");
});
