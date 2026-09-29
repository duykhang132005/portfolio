(function () {
  "use strict";

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
