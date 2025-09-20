import type { PropsWithChildren } from "react"
import { it, expect, describe } from "vitest";
import { render, renderHook } from "vitest-browser-react"
import { Route, Router, Switch, useRouter } from "wouter";
import { memoryLocation } from "wouter/memory-location";

describe("when `nest` prop is given", () => {
  it("renders by default", async () => {
    const { container } = render(<Route nest>matched!</Route>);
    await expect.element(container).toHaveTextContent("matched!");
  });

  it("matches the pattern loosely", async () => {
    const { hook, navigate } = memoryLocation();

    const { container } = render(
      <Router hook={hook}>
        <Route path="/posts/:slug" nest>
          matched!
        </Route>
      </Router>
    );

    expect(container.innerHTML).toBe("");

    navigate("/posts/all"); // full match
    await expect.element(container).toHaveTextContent("matched!");

    navigate("/users");
    await expect.element(container).toHaveTextContent("");

    navigate("/posts/10-react-tricks/table-of-contents");
    await expect.element(container).toHaveTextContent("matched!");
  });

  it("can be used inside a Switch", async () => {
    const { container } = render(
      <Router
        hook={
          memoryLocation({ path: "/posts/13/2012/sort", static: true }).hook
        }
      >
        <Switch>
          <Route path="/about">about</Route>
          <Route path="/posts/:slug" nest>
            nested
          </Route>
          <Route>default</Route>
        </Switch>
      </Router>
    );

    await expect.element(container).toHaveTextContent("nested");
  });

  it("sets the base to the matched segment", () => {
    const { result } = renderHook(() => useRouter().base, {
      wrapper: (props: PropsWithChildren) => (
        <Router
          hook={memoryLocation({ path: "/2012/04/posts", static: true }).hook}
        >
          <Route path="/:year/:month" nest>
            <Route path="/posts">{props.children}</Route>
          </Route>
        </Router>
      ),
    });

    expect(result.current).toBe("/2012/04");
  });

  it("can be nested in another nested `Route` or `Router`", async () => {
    const { container } = render(
      <Router
        base="/app"
        hook={
          memoryLocation({
            path: "/app/users/alexey/settings/all",
            static: true,
          }).hook
        }
      >
        <Route path="/users/:name" nest>
          <Route path="/settings">should not be rendered</Route>

          <Route path="/settings" nest>
            <Route path="/all">All settings</Route>
          </Route>
        </Route>
      </Router>
    );

    await expect.element(container).toHaveTextContent("All settings");
  });

  it("reacts to `nest` updates", async () => {
    const { hook } = memoryLocation({
      path: "/app/apple/products",
      static: true,
    });

    const App = ({ nested }: { nested: boolean }) => {
      return (
        <Router hook={hook}>
          <Route path="/app/:company" nest={nested}>
            matched!
          </Route>
        </Router>
      );
    };

    const { container, rerender } = render(<App nested={true} />);
    await expect.element(container).toHaveTextContent("matched!");

    rerender(<App nested={false} />);
    await expect.element(container).toHaveTextContent("");
  });

  it("works with one optional segment", async () => {
    const { hook, navigate } = memoryLocation({
      path: "/",
    });

    const App = () => {
      return (
        <Router hook={hook}>
          <Route path="/{:version}?" nest>
            {({ version }) => version ?? "default"}
          </Route>
        </Router>
      );
    };

    const { container } = render(<App />);
    await expect.element(container).toHaveTextContent("default");

    navigate("/v1");
    await expect.element(container).toHaveTextContent("v1");

    navigate("/v2/dashboard");
    await expect.element(container).toHaveTextContent("v2");
  });
});
