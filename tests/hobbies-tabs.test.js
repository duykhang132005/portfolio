import { describe, it, expect, beforeEach } from "vitest";
import { loadPage } from "./helpers/load-page.js";

function tabState(document) {
  const tabs = Array.from(document.querySelectorAll('.hobby-tabs [role="tab"]'));
  const panels = tabs.map((tab) => document.getElementById(tab.getAttribute("aria-controls")));
  return { tabs, panels };
}

function selectedIndex(tabs) {
  return tabs.findIndex((tab) => tab.getAttribute("aria-selected") === "true");
}

function visibleCount(panels) {
  return panels.filter((panel) => panel && !panel.hidden && panel.classList.contains("is-active")).length;
}

describe("hobbies subtabs", () => {
  it("starts with the Glee Club tab selected and its panel active", () => {
    const { document } = loadPage("hobbies.html");
    const { tabs, panels } = tabState(document);
    expect(tabs).toHaveLength(3);
    expect(tabs[0].id).toBe("tab-glee-club");
    expect(selectedIndex(tabs)).toBe(0);
    expect(panels[0].classList.contains("is-active")).toBe(true);
    expect(panels[1].classList.contains("is-active")).toBe(false);
    expect(panels[2].classList.contains("is-active")).toBe(false);
  });

  it("clicking a tab selects that panel and hides the others", () => {
    const { document } = loadPage("hobbies.html");
    const { tabs, panels } = tabState(document);

    tabs[1].click();
    expect(selectedIndex(tabs)).toBe(1);
    expect(tabs[1].getAttribute("aria-selected")).toBe("true");
    expect(tabs[0].getAttribute("aria-selected")).toBe("false");
    expect(tabs[2].getAttribute("aria-selected")).toBe("false");
    expect(panels[1].hidden).toBe(false);
    expect(panels[1].classList.contains("is-active")).toBe(true);
    expect(panels[0].hidden).toBe(true);
    expect(panels[2].hidden).toBe(true);
    expect(visibleCount(panels)).toBe(1);

    tabs[2].click();
    expect(selectedIndex(tabs)).toBe(2);
    expect(panels[2].hidden).toBe(false);
    expect(panels[2].classList.contains("is-active")).toBe(true);
    expect(panels[0].hidden).toBe(true);
    expect(panels[1].hidden).toBe(true);
    expect(visibleCount(panels)).toBe(1);
  });

  it("ArrowRight and ArrowLeft move between tabs", () => {
    const { document, press } = loadPage("hobbies.html");
    const { tabs, panels } = tabState(document);
    const tablist = document.querySelector('.hobby-tabs[role="tablist"]');

    tabs[0].focus();
    press("ArrowRight", { target: tablist });
    expect(selectedIndex(tabs)).toBe(1);
    expect(document.activeElement).toBe(tabs[1]);
    expect(panels[1].classList.contains("is-active")).toBe(true);
    expect(visibleCount(panels)).toBe(1);

    press("ArrowLeft", { target: tablist });
    expect(selectedIndex(tabs)).toBe(0);
    expect(document.activeElement).toBe(tabs[0]);
    expect(panels[0].classList.contains("is-active")).toBe(true);
  });

  it("Home and End select the first and last tabs", () => {
    const { document, press } = loadPage("hobbies.html");
    const { tabs, panels } = tabState(document);
    const tablist = document.querySelector('.hobby-tabs[role="tablist"]');

    tabs[0].focus();
    press("End", { target: tablist });
    expect(selectedIndex(tabs)).toBe(2);
    expect(tabs[2].id).toBe("tab-hva");
    expect(document.activeElement).toBe(tabs[2]);
    expect(panels[2].classList.contains("is-active")).toBe(true);
    expect(visibleCount(panels)).toBe(1);

    press("Home", { target: tablist });
    expect(selectedIndex(tabs)).toBe(0);
    expect(document.activeElement).toBe(tabs[0]);
    expect(panels[0].classList.contains("is-active")).toBe(true);
    expect(visibleCount(panels)).toBe(1);
  });

  it("only one panel is shown after a selection", () => {
    const { document } = loadPage("hobbies.html");
    const { tabs, panels } = tabState(document);
    tabs[1].click();
    const shown = panels.filter((panel) => !panel.hidden);
    const active = panels.filter((panel) => panel.classList.contains("is-active"));
    expect(shown).toHaveLength(1);
    expect(active).toHaveLength(1);
    expect(shown[0].id).toBe("dins");
    expect(active[0]).toBe(shown[0]);
  });
});
