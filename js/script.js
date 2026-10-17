(function () {
  "use strict";

  // Old single-page links (index.html#about and so on) now lead to the right page
  var legacyAnchors = {
    "#about": "about.html", "#education": "about.html", "#skills": "about.html",
    "#employment": "experience.html", "#experience": "experience.html",
    "#featured-projects": "projects.html", "#contact": "contact.html"
  };
  var currentPage = window.location.pathname.split("/").pop();
  if ((currentPage === "" || currentPage === "index" || currentPage === "index.html") && legacyAnchors[window.location.hash]) {
    window.location.replace(legacyAnchors[window.location.hash] + window.location.hash);
    return;
  }

  // Home links use "./" so clean-URL servers and GitHub Pages never redirect through index.html.
  // On file:// a folder link would show a directory listing, so point it at index.html there.
  if (window.location.protocol === "file:") {
    Array.prototype.forEach.call(document.querySelectorAll('a[href="./"]'), function (a) {
      a.setAttribute("href", "index.html");
    });
  }

  // Year setter (null-safe)
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  // Mobile nav toggle + close on link click
  var nav = document.querySelector(".nav");
  var toggle = document.querySelector(".nav-toggle");

  if (nav && toggle) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Page transitions (see "Page transitions" in css/styles.css). The new page
  // slides in from the right when it sits further right in the nav than the
  // page we came from, otherwise from the left. Each page notes its place in
  // sessionStorage as it is left, and the next page compares.
  var root = document.documentElement;
  var pageOrder = ["", "about", "experience", "projects", "publication", "hobbies", "contact"];
  var pageIndexOf = function (path) {
    var name = path.split("/").pop().replace(/\.html$/, "");
    if (name === "index") name = "";
    return pageOrder.indexOf(name);
  };
  var thisPage = pageIndexOf(window.location.pathname);
  var rememberPage = function () {
    try {
      sessionStorage.setItem("pf-last-page", JSON.stringify({ i: thisPage, t: Date.now() }));
    } catch (err) { /* storage blocked: transitions just slide forward */ }
  };
  // null unless we arrived from another portfolio page a moment ago
  var cameFrom = (function () {
    try {
      var last = JSON.parse(sessionStorage.getItem("pf-last-page"));
      if (last && Date.now() - last.t < 10000) return last.i;
    } catch (err) { /* ignore */ }
    return null;
  })();
  var isBack = function (from) {
    return from !== null && from >= 0 && thisPage >= 0 && thisPage < from;
  };
  window.addEventListener("pageswap", rememberPage);
  window.addEventListener("pagehide", rememberPage);

  if ("onpagereveal" in window) {
    // Cross-document view transitions run from the CSS; only the direction
    // needs setting here
    window.addEventListener("pagereveal", function (e) {
      if (!e.viewTransition || !isBack(cameFrom)) return;
      root.classList.add("page-back");
      e.viewTransition.finished.then(function () {
        root.classList.remove("page-back");
      });
    });
  } else if (!reduceMotion) {
    // Fallback (e.g. Firefox): play the same slide on arrival, and a short
    // fade before leaving through an internal link
    var mainEl = document.getElementById("main");
    var clearEnter = function () {
      root.classList.remove("page-in", "page-back");
    };
    if (cameFrom !== null && mainEl) {
      root.classList.add("page-in");
      if (isBack(cameFrom)) root.classList.add("page-back");
      mainEl.addEventListener("animationend", clearEnter, { once: true });
      setTimeout(clearEnter, 400);
    }
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var link = e.target.closest ? e.target.closest("a[href]") : null;
      if (!link || link.hasAttribute("download")) return;
      if (link.target && link.target !== "_self") return;
      var url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || !/^(https?|file):$/.test(url.protocol)) return;
      // Same page (hash links, the Hobbies tabs) navigates as usual
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      e.preventDefault();
      rememberPage();
      root.classList.add("page-out");
      setTimeout(function () { window.location.href = url.href; }, 120);
    });
    // Coming back through the back/forward cache restores the faded page
    window.addEventListener("pageshow", function (e) {
      if (e.persisted) root.classList.remove("page-out", "page-in", "page-back");
    });
  }

  // Featured projects carousel: infinite loop, one card per step.
  // Real cards sit between two full sets of clones; after sliding onto a
  // clone, the rail jumps (without animation) to the matching real card.
  var track = document.getElementById("projects-track");
  var rail = track ? track.querySelector(".projects-rail") : null;
  var prevBtn = document.querySelector(".carousel-prev");
  var nextBtn = document.querySelector(".carousel-next");
  var statusEl = document.getElementById("projects-status");

  if (track && rail && prevBtn && nextBtn) {
    var cards = Array.prototype.slice.call(rail.querySelectorAll(".project-card"));
    var total = cards.length;
    var index = 0;
    var busy = false;
    var busyTimer = null;

    var makeClone = function (card) {
      var clone = card.cloneNode(true);
      clone.classList.add("is-clone");
      // Clones fill the slots after the last real card, so they must stay
      // clickable and hoverable (no inert). They are hidden from screen
      // readers and skipped by Tab instead.
      clone.setAttribute("aria-hidden", "true");
      clone.removeAttribute("id");
      clone.querySelectorAll("a, button").forEach(function (el) {
        el.setAttribute("tabindex", "-1");
      });
      return clone;
    };

    cards.forEach(function (card, i) {
      card.setAttribute("role", "group");
      card.setAttribute("aria-roledescription", "slide");
      card.setAttribute("aria-label", (i + 1) + " of " + total);
      rail.appendChild(makeClone(card));
    });
    cards.slice().reverse().forEach(function (card) {
      rail.insertBefore(makeClone(card), rail.firstChild);
    });
    track.classList.add("is-infinite");

    var perView = function () {
      return parseInt(window.getComputedStyle(track).getPropertyValue("--per"), 10) || 1;
    };
    var step = function () {
      var gap = parseFloat(window.getComputedStyle(rail).columnGap) || 0;
      return cards[0].getBoundingClientRect().width + gap;
    };
    var place = function (animate) {
      rail.classList.toggle("no-anim", !animate);
      rail.style.transform = "translateX(" + (-(total + index) * step()) + "px)";
      if (!animate) {
        void rail.offsetWidth; // flush so the next move animates again
        rail.classList.remove("no-anim");
      }
    };
    var announce = function () {
      if (!statusEl) return;
      var per = Math.min(perView(), total);
      var start = ((index % total) + total) % total;
      var shown = [];
      for (var k = 0; k < per; k++) shown.push(((start + k) % total) + 1);
      var list;
      if (per === 1) list = "project " + shown[0];
      else if (shown[per - 1] === shown[0] + per - 1) list = "projects " + shown[0] + " to " + shown[per - 1];
      else list = "projects " + shown.slice(0, -1).join(", ") + " and " + shown[per - 1];
      statusEl.textContent = "Showing " + list + " of " + total;
    };
    var settle = function () {
      clearTimeout(busyTimer);
      if (index >= total || index < 0) {
        index = ((index % total) + total) % total;
        place(false);
      }
      busy = false;
    };
    var go = function (dir) {
      if (busy || total <= perView()) return;
      index += dir;
      announce();
      if (reduceMotion) {
        place(false);
        settle();
        return;
      }
      busy = true;
      place(true);
      busyTimer = setTimeout(settle, 700); // fallback if transitionend never fires
    };

    rail.addEventListener("transitionend", function (e) {
      if (e.target === rail && e.propertyName === "transform") settle();
    });
    prevBtn.addEventListener("click", function () { go(-1); });
    nextBtn.addEventListener("click", function () { go(1); });
    track.addEventListener("keydown", function (e) {
      if (e.target !== track) return;
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    });

    // Swipe on touch and pen (vertical page scrolling stays native via touch-action: pan-y)
    var startX = null;
    var startY = 0;
    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse") return;
      startX = e.clientX;
      startY = e.clientY;
    });
    track.addEventListener("pointerup", function (e) {
      if (startX === null) return;
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      startX = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    });
    track.addEventListener("pointercancel", function () { startX = null; });

    // Keep a Tab-focused card in view, and undo any native scroll on focus
    rail.addEventListener("focusin", function (e) {
      var card = e.target.closest(".project-card");
      var i = cards.indexOf(card);
      track.scrollLeft = 0;
      if (i < 0) return;
      var per = perView();
      var offset = (i - index + total) % total;
      if (offset >= per) {
        index = i;
        place(false);
        announce();
      }
    });
    track.addEventListener("scroll", function () { track.scrollLeft = 0; });

    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        settle();
        place(false);
      }, 100);
    });
    place(false);
  }

  // Hobbies subtabs (WAI-ARIA tabs pattern). Runs only on the hobbies page.
  // Each tab writes its panel id to the URL hash, and hobbies.html#hva (or a
  // link to anything inside a panel) opens the matching tab.
  var tablist = document.querySelector('.hobby-tabs[role="tablist"]');
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute("aria-controls"));
    });
    // The Din & Tonics section was #din-and-tonics before the tabs existed
    var hashAliases = { "#din-and-tonics": "dins" };
    var header = document.querySelector(".site-header");

    panels.forEach(function (panel, i) {
      if (!panel) return;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabs[i].id);
      panel.setAttribute("tabindex", "0");
    });

    var selectTab = function (i, opts) {
      opts = opts || {};
      tabs.forEach(function (tab, k) {
        var on = k === i;
        tab.setAttribute("aria-selected", on ? "true" : "false");
        tab.setAttribute("tabindex", on ? "0" : "-1");
        if (panels[k]) {
          panels[k].classList.toggle("is-active", on);
          panels[k].hidden = !on;
        }
      });
      // Each panel is one tall .fade-up block. The scroll observer waits for
      // 20% of an element to be on screen, which a long panel (Din & Tonics)
      // only reaches after a lot of scrolling, so reveal the opened panel
      // here. The reflow first lets the fade play after the panel unhides.
      var panel = panels[i];
      if (panel) {
        void panel.offsetWidth;
        if (panel.matches(".fade-up, .scale-in")) panel.classList.add("visible");
        panel.querySelectorAll(".fade-up, .scale-in").forEach(function (el) {
          el.classList.add("visible");
        });
      }
      if (opts.focus) tabs[i].focus();
      if (opts.updateHash && window.history && window.history.replaceState) {
        window.history.replaceState(null, "", "#" + tabs[i].getAttribute("aria-controls"));
      }
    };

    var hashTarget = function () {
      var hash = window.location.hash;
      if (!hash || hash.length < 2) return null;
      var id = hashAliases[hash];
      if (!id) {
        try { id = decodeURIComponent(hash.slice(1)); } catch (err) { return null; }
      }
      return document.getElementById(id);
    };

    var panelIndexOf = function (el) {
      for (var k = 0; k < panels.length; k++) {
        if (el && panels[k] && (panels[k] === el || panels[k].contains(el))) return k;
      }
      return -1;
    };

    // A jump to a panel (hobbies.html#hva, or a link to #hva) should land with
    // the tab bar still visible under the sticky header, so each panel's
    // scroll margin covers the header plus the tab bar
    var setScrollMargin = function () {
      var offset = (header ? header.offsetHeight : 0) + tablist.offsetHeight + 40;
      panels.forEach(function (panel) {
        if (panel) panel.style.scrollMarginTop = offset + "px";
      });
    };
    setScrollMargin();
    window.addEventListener("resize", setScrollMargin);

    var openFromHash = function (scroll) {
      var target = hashTarget();
      var i = panelIndexOf(target);
      if (i < 0) return;
      selectTab(i);
      if (scroll) target.scrollIntoView();
    };

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        selectTab(i, { updateHash: true });
      });
    });

    tablist.addEventListener("keydown", function (e) {
      var i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      var next = null;
      if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      selectTab(next, { focus: true, updateHash: true });
    });

    // Open the tab named in the hash before the browser jumps to the fragment;
    // later hash changes (in-page links) switch tabs and scroll to the target
    openFromHash(false);
    window.addEventListener("hashchange", function () { openFromHash(true); });
  }

  // IntersectionObserver reveal; respect prefers-reduced-motion; unobserve after reveal
  var revealElements = document.querySelectorAll(".fade-up, .scale-in");

  if (reduceMotion) {
    revealElements.forEach(function (el) {
      el.classList.add("visible");
    });
    return;
  }

  if (!("IntersectionObserver" in window)) {
    revealElements.forEach(function (el) {
      el.classList.add("visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  // Cards inside the horizontal track may never intersect on their own,
  // so reveal them all together once the track scrolls into view.
  revealElements.forEach(function (el) {
    if (track && track.contains(el)) return;
    observer.observe(el);
  });

  if (track) {
    var trackObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        track.querySelectorAll(".fade-up, .scale-in").forEach(function (el) {
          el.classList.add("visible");
        });
        trackObserver.disconnect();
      }
    }, { threshold: 0.1 });
    trackObserver.observe(track);
  }
})();
