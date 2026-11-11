import { describe, it, expect, beforeEach } from "vitest";
import { loadPage } from "./helpers/load-page.js";

const EXPECTED_TITLES = [
  "ChordStrikers",
  "Lazy Lagoon",
  "Grove",
  "Guitar Hero: Emulating Electrical Hardware",
  "3D Webpage for Incoming Students",
];

const EXPECTED_HREFS = [
  "https://github.com/duykhang132005/Personal_Projects-ChordStrikers",
  "https://duykhang132005.pythonanywhere.com/",
  "https://github.com/duykhang132005/Personal_Projects-lazy-lagoon",
  "https://duykhang132005.github.io/Personal_Projects-lazy-lagoon/",
  "https://github.com/duykhang132005/Personal_Projects_grove",
  "https://duykhang132005.github.io/Personal_Projects_grove/",
  "https://seas.harvard.edu/news/engineers-play",
  "https://www.youtube.com/watch?v=z1SzrQ1OyZE",
];

function setup() {
  const loaded = loadPage("projects.html");
  const { document } = loaded;
  return {
    ...loaded,
    track: document.getElementById("projects-track"),
    rail: document.querySelector(".projects-rail"),
    prevBtn: document.querySelector(".carousel-prev"),
    nextBtn: document.querySelector(".carousel-next"),
    status: document.getElementById("projects-status"),
  };
}

function realCards(rail) {
  return Array.from(rail.querySelectorAll(".project-card:not(.is-clone)"));
}

function cloneCards(rail) {
  return Array.from(rail.querySelectorAll(".project-card.is-clone"));
}

function titleOf(card) {
  const heading = card.querySelector("h2, h3");
  return heading ? heading.textContent.trim() : "";
}

describe("featured projects carousel", () => {
  let document, rail, prevBtn, nextBtn, status, window;

  beforeEach(() => {
    ({ document, rail, prevBtn, nextBtn, status, window } = setup());
  });

  it("builds an infinite rail from the real project cards", () => {
    const real = realCards(rail);
    const clones = cloneCards(rail);
    expect(real.map(titleOf)).toEqual(EXPECTED_TITLES);
    expect(clones).toHaveLength(EXPECTED_TITLES.length * 2);
    expect(rail.querySelectorAll(".project-card")).toHaveLength(EXPECTED_TITLES.length * 3);
    // announce() runs on next/prev, not on the initial place()
    expect(status.textContent).toBe("");
  });

  it("next and prev move to the adjacent project", () => {
    expect(realCards(rail).map(titleOf)[0]).toBe("ChordStrikers");
    nextBtn.click();
    expect(status.textContent).toBe("Showing project 2 of 5");
    expect(rail.style.transform).toBe("translateX(-1800px)");

    nextBtn.click();
    expect(status.textContent).toBe("Showing project 3 of 5");

    prevBtn.click();
    expect(status.textContent).toBe("Showing project 2 of 5");
  });

  it("next wraps from the last project to the first", () => {
    for (let i = 0; i < EXPECTED_TITLES.length - 1; i++) nextBtn.click();
    expect(status.textContent).toBe("Showing project 5 of 5");

    nextBtn.click();
    expect(status.textContent).toBe("Showing project 1 of 5");
    // After wrapping, settle jumps back to the real first-card slot
    expect(rail.style.transform).toBe("translateX(-1500px)");
  });

  it("prev wraps from the first project to the last", () => {
    prevBtn.click();
    expect(status.textContent).toBe("Showing project 5 of 5");
    expect(rail.style.transform).toBe("translateX(-2700px)");
  });

  it("real cards keep their links and clones stay clickable", () => {
    const realHrefs = realCards(rail).flatMap((card) =>
      Array.from(card.querySelectorAll("a[href]"), (a) => a.getAttribute("href"))
    );
    expect(realHrefs).toEqual(EXPECTED_HREFS);
    realCards(rail).forEach((card) => {
      card.querySelectorAll("a").forEach((a) => {
        expect(a.getAttribute("tabindex")).not.toBe("-1");
      });
    });

    const clones = cloneCards(rail);
    expect(clones.length).toBeGreaterThan(0);
    clones.forEach((clone) => {
      expect(clone.getAttribute("aria-hidden")).toBe("true");
      expect(clone.hasAttribute("inert")).toBe(false);
      const links = Array.from(clone.querySelectorAll("a[href]"));
      expect(links.length).toBeGreaterThan(0);
      links.forEach((a) => {
        expect(a.getAttribute("tabindex")).toBe("-1");
        expect(a.getAttribute("href")).toBeTruthy();
      });
    });

    const cloneLink = clones[0].querySelector("a[href]");
    expect(() => cloneLink.click()).not.toThrow();
  });
});
