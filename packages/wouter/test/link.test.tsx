import type { MouseEventHandler } from "react";
import { it, expect, vi, describe } from "vitest";
import { render } from "vitest-browser-react"
import { Router, Link } from "wouter";
import { memoryLocation } from "wouter/memory-location";

describe("<Link />", () => {
  it("renders a link with proper attributes", async () => {
    const { getByText } = render(
      <Link href="/about" className="link--active">
        Click Me
      </Link>
    );

    const element = getByText("Click Me");

    await expect.element(element).toBeInTheDocument();
    await expect.element(element).toHaveAttribute("href", "/about");
    await expect.element(element).toHaveClass("link--active");
  });

  it("passes ref to <a />", async () => {
    const refCallback = vi.fn();
    const { getByText } = render(
      <Link href="/" ref={refCallback}>
        Testing
      </Link>
    );

    const element = getByText("Testing");

    await expect.element(element).toBeInTheDocument();
    await expect.element(element).toHaveAttribute("href", "/");

    expect(refCallback).toBeCalledTimes(1);
    expect(refCallback).toBeCalledWith(element.element());
  });

  it("still creates a plain link when nothing is passed", async () => {
    const { getByTestId } = render(<Link href="/about" data-testid="link" />);

    const element = getByTestId("link");

    await expect.element(element).toBeInTheDocument();
    await expect.element(element).toHaveAttribute("href", "/about");
    await expect.element(element).toBeEmptyDOMElement();
  });

  it("supports `to` prop as an alias to `href`", async () => {
    const { getByText } = render(<Link to="/about">Hello</Link>);
    const element = getByText("Hello");

    await expect.element(element).toBeInTheDocument();
    await expect.element(element).toHaveAttribute("href", "/about");
  });

  it("performs a navigation when the link is clicked", async () => {
    const { getByTestId } = render(
      <Link href="/goo-baz" data-testid="link">
        link
      </Link>
    );

    await getByTestId("link").click()

    expect(location.pathname).toBe("/goo-baz");
  });

  it("supports replace navigation", async () => {
    const { getByTestId } = render(
      <Link href="/goo-baz" replace data-testid="link">
        link
      </Link>
    );

    const histBefore = history.length;

    await getByTestId("link").click()

    expect(location.pathname).toBe("/goo-baz");
    expect(history.length).toBe(histBefore);
  });

  it("ignores the navigation when clicked with modifiers", () => {
    const { getByTestId } = render(
      <Link href="/users" data-testid="link">
        click
      </Link>
    );
    const clickEvt = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
      ctrlKey: true,
    });

    clickEvt.preventDefault();

    getByTestId("link").element().dispatchEvent(clickEvt)
    expect(location.pathname).not.toBe("/users");
  });

  it("ignores the navigation when event is cancelled", async () => {
    const clickHandler: MouseEventHandler = (e) => {
      e.preventDefault();
    };

    const { getByTestId } = render(
      <Link href="/users" data-testid="link" onClick={clickHandler}>
        click
      </Link>
    );

    await getByTestId("link").click()
    expect(location.pathname).not.toBe("/users");
  });

  it("accepts an `onClick` prop, fired before the navigation", async () => {
    const clickHandler = vi.fn();

    const { getByTestId } = render(
      <Link href="/" onClick={clickHandler} data-testid="link">click</Link>
    );

    await getByTestId("link").click()
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });

  it("renders `href` with basepath", async () => {
    const { getByTestId } = render(
      <Router base="/app">
        <Link href="/dashboard" data-testid="link" />
      </Router>
    );

    const link = getByTestId("link");
    await expect.element(link).toHaveAttribute("href", "/app/dashboard");
  });

  it("renders `href` with absolute links", async () => {
    const { getByTestId } = render(
      <Router base="/app">
        <Link href="~/home" data-testid="link" />
      </Router>
    );

    const element = getByTestId("link");
    await expect.element(element).toHaveAttribute("href", "/home");
  });

  it("supports history state", async () => {
    const testState = { hello: "world" };
    const { getByTestId } = render(
      <Link href="/goo-baz" state={testState} data-testid="link">
        link
      </Link>
    );

    await getByTestId("link").click()
    expect(location.pathname).toBe("/goo-baz");
    expect(window.navigation.currentEntry?.getState()).toStrictEqual(testState);
  });

  it("can be configured to use custom href formatting", async () => {
    const formatter = (href: string) => `#${href}`;

    const { getByTestId } = render(
      <>
        <Router hrefs={formatter}>
          <Link href="/" data-testid="root" />
          <Link href="/home" data-testid="home" />
        </Router>

        <Router base="/app" hrefs={formatter}>
          <Link href="~/home" data-testid="absolute" />
        </Router>
      </>
    );

    await expect.element(getByTestId("root")).toHaveAttribute("href", "#/");
    await expect.element(getByTestId("home")).toHaveAttribute("href", "#/home");
    await expect.element(getByTestId("absolute")).toHaveAttribute("href", "#/home");
  });
});

describe("active links", () => {
  it("proxies `className` when it is a string", async () => {
    const { getByText } = render(
      <Link href="/" className="link--active warning">
        Click Me
      </Link>
    );

    const element = getByText("Click Me");
    await expect.element(element).toHaveAttribute("class", "link--active warning");
  });

  it("calls the `className` function with active link flag", async () => {
    const { navigate, hook } = memoryLocation({ path: "/" });

    const { getByText } = render(
      <Router hook={hook}>
        <Link
          href="/"
          className={(isActive) => {
            return [isActive ? "active" : "", "link"].join(" ");
          }}
        >
          Click Me
        </Link>
      </Router>
    );

    const element = getByText("Click Me");
    await expect.element(element).toBeInTheDocument();
    await expect.element(element).toHaveClass("active");
    await expect.element(element).toHaveClass("link");

    navigate("/about")

    await expect.element(element).not.toHaveClass("active");
    await expect.element(element).toHaveClass("link");
  });

  it("correctly highlights active links when using custom href formatting", async () => {
    const formatter = (href: string) => `#${href}`;
    const { navigate, hook } = memoryLocation({ path: "/" });

    const { getByText } = render(
      <Router hook={hook} hrefs={formatter}>
        <Link
          href="/"
          className={(isActive) => {
            return [isActive ? "active" : "", "link"].join(" ");
          }}
        >
          Click Me
        </Link>
      </Router>
    );

    const element = getByText("Click Me");
    await expect.element(element).toBeInTheDocument();
    await expect.element(element).toHaveClass("active");
    await expect.element(element).toHaveClass("link");

    navigate("/about")

    await expect.element(element).not.toHaveClass("active");
    await expect.element(element).toHaveClass("link");
  });
});

describe("<Link /> with `asChild` prop", () => {
  it("when `asChild` is not specified, wraps the children in an <a />", async () => {
    const { getByText } = render(
      <Link href="/about">
        <div className="link--wannabe">Click Me</div>
      </Link>
    );

    const link = getByText("Click Me");
    const linkElement = link.element()

    expect(linkElement.tagName).toBe("DIV");
    await expect.element(link).not.toHaveAttribute("href");
    await expect.element(link).toHaveClass("link--wannabe");
    await expect.element(link).toHaveTextContent("Click Me");

    expect(linkElement.parentElement?.tagName).toBe("A");
    expect(linkElement.parentElement).toHaveAttribute("href", "/about");
  });

  it("when invalid element is provided, wraps the children in an <a />", async () => {
    const { getByText } = render(
      /* @ts-expect-error */
      <Link href="/about" asChild>
        Click Me
      </Link>
    );

    const link = getByText("Click Me");

    await expect.element(link).toBeInTheDocument()

    expect(link.element().tagName).toBe("A");
    await expect.element(link).toHaveAttribute("href", "/about");
    await expect.element(link).toHaveTextContent("Click Me");
  });

  it("when more than one element is provided, wraps the children in an <a />", async () => {
    const { getByText } = render(
      /* @ts-expect-error */
      <Link href="/about" asChild>
        <span>1</span>
        <span>2</span>
        <span>3</span>
      </Link>
    );

    const spanElement = getByText("1").element()

    expect(spanElement.parentElement?.tagName).toBe("A");

    expect(spanElement.parentElement).toHaveAttribute("href", "/about");
    expect(spanElement.parentElement).toHaveTextContent("123");
  });

  it("injects href prop when rendered with `asChild`", async () => {
    const { getByText } = render(
      <Link href="/about" asChild>
        <div className="link--wannabe">Click Me</div>
      </Link>
    );

    const link = getByText("Click Me");

    expect(link.element().tagName).toBe("DIV");
    await expect.element(link).toHaveClass("link--wannabe");
    await expect.element(link).toHaveAttribute("href", "/about");
    await expect.element(link).toHaveTextContent("Click Me");
  });

  it("missing href or to won't crash", async () => {
    const { getByText } = render(
      /* @ts-expect-error */
      <Link>Click Me</Link>
    );

    const link = getByText("Click Me");

    expect(link.element().tagName).toBe("A");
    await expect.element(link).toHaveAttribute("href", undefined);
    await expect.element(link).toHaveTextContent("Click Me");
  });
});
