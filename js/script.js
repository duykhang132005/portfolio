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

  // IntersectionObserver reveal; respect prefers-reduced-motion; unobserve after reveal
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

  revealElements.forEach(function (el) {
    observer.observe(el);
  });
})();
