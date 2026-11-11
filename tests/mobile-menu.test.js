import { describe, it, expect, beforeEach } from "vitest";
import { loadPage } from "./helpers/load-page.js";

describe("mobile menu", () => {
  let document, window, setMobile, press, toggle, nav, links;

  beforeEach(() => {
    ({ document, window, setMobile, press } = loadPage("index.html", { mobile: true }));
    toggle = document.querySelector(".nav-toggle");
    nav = document.querySelector(".nav");
    links = Array.from(nav.querySelectorAll("a"));
  });

  it("toggle sets aria-expanded and .open", () => {
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(nav.classList.contains("open")).toBe(false);

    toggle.click();
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(nav.classList.contains("open")).toBe(true);

    toggle.click();
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(nav.classList.contains("open")).toBe(false);
  });

  it("Escape closes the menu and returns focus to the toggle", () => {
    toggle.click();
    expect(nav.classList.contains("open")).toBe(true);
    links[0].focus();
    expect(document.activeElement).toBe(links[0]);

    press("Escape");
    expect(nav.classList.contains("open")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(toggle);
  });

  it("Tab from the last item wraps to the toggle", () => {
    toggle.click();
    const last = links[links.length - 1];
    last.focus();
    expect(document.activeElement).toBe(last);

    press("Tab");
    expect(document.activeElement).toBe(toggle);
    expect(nav.classList.contains("open")).toBe(true);
  });

  it("Shift+Tab from the toggle wraps to the last nav link", () => {
    toggle.click();
    toggle.focus();
    expect(document.activeElement).toBe(toggle);

    press("Tab", { shift: true });
    expect(document.activeElement).toBe(links[links.length - 1]);
    expect(nav.classList.contains("open")).toBe(true);
  });

  it("resizing past the 900px breakpoint closes an open menu", () => {
    toggle.click();
    expect(nav.classList.contains("open")).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");

    setMobile(false);
    expect(window.innerWidth).toBe(1200);
    expect(nav.classList.contains("open")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
  });
});
