import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function mediaQueryList(query, matches) {
  return {
    matches,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent() {
      return false;
    },
  };
}

/**
 * Load a real portfolio HTML page and js/script.js into jsdom.
 * viewport.mobile controls the nav-toggle computed display (flex vs none),
 * matching the 900px CSS breakpoint. prefers-reduced-motion is on so the
 * page-transition fallback does not intercept clicks, and the carousel
 * settles immediately.
 */
export function loadPage(pageFile, options = {}) {
  const viewport = { mobile: options.mobile !== false };
  const html = readFileSync(path.join(root, pageFile), "utf8");
  const script = readFileSync(path.join(root, "js", "script.js"), "utf8");
  const pageName = path.basename(pageFile);
  const urlPath = pageName === "index.html" ? "/portfolio/" : "/portfolio/" + pageName;
  const hash = options.hash || "";

  const dom = new JSDOM(html, {
    url: "https://duykhang132005.github.io" + urlPath + hash,
    pretendToBeVisual: true,
    runScripts: "outside-only",
  });

  const { window } = dom;
  const { document } = window;

  document.documentElement.classList.add("js");

  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    enumerable: true,
    get() {
      return viewport.mobile ? 390 : 1200;
    },
  });

  window.matchMedia = function (query) {
    const q = String(query);
    if (q.includes("prefers-reduced-motion")) {
      return mediaQueryList(q, true);
    }
    const max = q.match(/max-width:\s*(\d+)px/);
    if (max) {
      return mediaQueryList(q, window.innerWidth <= Number(max[1]));
    }
    const min = q.match(/min-width:\s*(\d+)px/);
    if (min) {
      return mediaQueryList(q, window.innerWidth >= Number(min[1]));
    }
    return mediaQueryList(q, false);
  };

  const realComputed = window.getComputedStyle.bind(window);
  window.getComputedStyle = function (el, pseudo) {
    const style = realComputed(el, pseudo);
    return new Proxy(style, {
      get(target, prop, receiver) {
        if (prop === "display") {
          if (el && el.classList && el.classList.contains("nav-toggle")) {
            return viewport.mobile ? "flex" : "none";
          }
          return target.display;
        }
        if (prop === "getPropertyValue") {
          return function (name) {
            if (name === "--per") return "1";
            if (name === "column-gap" || name === "columnGap") return "0px";
            return target.getPropertyValue(name);
          };
        }
        if (prop === "columnGap") return "0px";
        const value = Reflect.get(target, prop, receiver);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  };

  window.HTMLElement.prototype.getBoundingClientRect = function () {
    if (this.classList && this.classList.contains("project-card")) {
      return {
        width: 300,
        height: 280,
        top: 0,
        left: 0,
        right: 300,
        bottom: 280,
        x: 0,
        y: 0,
        toJSON() {},
      };
    }
    return {
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      x: 0,
      y: 0,
      toJSON() {},
    };
  };

  if (typeof window.IntersectionObserver !== "function") {
    window.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    };
  }

  window.eval(script);

  function setMobile(mobile) {
    viewport.mobile = !!mobile;
    window.dispatchEvent(new window.Event("resize"));
  }

  function press(key, opts = {}) {
    const target = opts.target || document;
    const event = new window.KeyboardEvent("keydown", {
      key,
      shiftKey: !!opts.shift,
      bubbles: true,
      cancelable: true,
    });
    target.dispatchEvent(event);
    return event;
  }

  return { window, document, dom, viewport, setMobile, press };
}
