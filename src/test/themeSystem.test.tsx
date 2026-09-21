import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";

function ThemeTestConsumer() {
  const { theme, toggle, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-val">{theme}</span>
      <button data-testid="toggle-btn" onClick={toggle}>
        Toggle
      </button>
      <button data-testid="set-dark-btn" onClick={() => setTheme("dark")}>
        Set Dark
      </button>
      <button data-testid="set-light-btn" onClick={() => setTheme("light")}>
        Set Light
      </button>
    </div>
  );
}

describe("Theme System (Normal & Dark Mode)", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.style.colorScheme = "";
  });

  it("initializes with default light theme when no storage exists and matchMedia is false", () => {
    render(
      <ThemeProvider>
        <ThemeTestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-val").textContent).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
  });

  it("initializes with dark theme if stored in localStorage", () => {
    localStorage.setItem("subbly-theme", "dark");

    render(
      <ThemeProvider>
        <ThemeTestConsumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId("theme-val").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("dark");
  });

  it("toggles seamlessly between dark and light modes updating DOM and localStorage", () => {
    render(
      <ThemeProvider>
        <ThemeTestConsumer />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId("toggle-btn");

    // Click toggle -> should switch to dark
    act(() => {
      toggleBtn.click();
    });

    expect(screen.getByTestId("theme-val").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("subbly-theme")).toBe("dark");

    // Click toggle again -> should switch back to light
    act(() => {
      toggleBtn.click();
    });

    expect(screen.getByTestId("theme-val").textContent).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("light");
    expect(localStorage.getItem("subbly-theme")).toBe("light");
  });

  it("handles setTheme directly", () => {
    render(
      <ThemeProvider>
        <ThemeTestConsumer />
      </ThemeProvider>
    );

    act(() => {
      screen.getByTestId("set-dark-btn").click();
    });
    expect(screen.getByTestId("theme-val").textContent).toBe("dark");
    expect(localStorage.getItem("subbly-theme")).toBe("dark");

    act(() => {
      screen.getByTestId("set-light-btn").click();
    });
    expect(screen.getByTestId("theme-val").textContent).toBe("light");
    expect(localStorage.getItem("subbly-theme")).toBe("light");
  });

  it("provides resilient fallback without crashing when rendered outside ThemeProvider", () => {
    function StandaloneConsumer() {
      const { theme } = useTheme();
      return <span data-testid="fallback-theme">{theme}</span>;
    }

    render(<StandaloneConsumer />);
    expect(screen.getByTestId("fallback-theme").textContent).toBe("light");
  });
});
