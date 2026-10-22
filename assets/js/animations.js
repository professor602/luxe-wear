/* =====================================================================
   LuxeWear – animations.js
   JavaScript-powered motion. Loaded LAST on every page.
   Uses helpers from common.js (onReady, prefersReducedMotion).
   ===================================================================== */

/* ---------- Smooth scrolling ---------- */
function scrollToPosition(top) {
  window.scrollTo({ top: top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

// Same-page links like <a href="#featured"> scroll smoothly and stop below the sticky header.
function initSmoothAnchors() {
  document.addEventListener("click", function (event) {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const hash = link.getAttribute("href");
    if (hash.length < 2) return;

    const target = document.getElementById(hash.slice(1));
    if (!target) return;

    event.preventDefault();
    const header = document.querySelector(".site-header");
    const offset = (header ? header.offsetHeight : 0) + 10;
    scrollToPosition(target.getBoundingClientRect().top + window.pageYOffset - offset);
  });
}

/* ---------- Header shadow + back-to-top button ---------- */
function createBackToTopButton() {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "back-to-top";
  button.setAttribute("aria-label", "Back to top");
  button.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
  button.addEventListener("click", function () { scrollToPosition(0); });
  document.body.appendChild(button);
  return button;
}

function initScrollEffects() {
  const header = document.querySelector(".site-header");
  const backToTop = createBackToTopButton();
  let waiting = false;

  function update() {
    const y = window.pageYOffset || document.documentElement.scrollTop;
    if (header) header.classList.toggle("scrolled", y > 10);
    backToTop.classList.toggle("show", y > 500);
    waiting = false;
  }

  // requestAnimationFrame keeps scrolling smooth (runs at most once per frame)
  window.addEventListener("scroll", function () {
    if (!waiting) {
      waiting = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });

  update();
}

/* ---------- Scroll-triggered reveal (IntersectionObserver) ----------
   Add class "reveal", "reveal-left" or "reveal-right" to any element.
   Add data-stagger to a parent to delay its children one after another.
   Call initReveal(container) again after rendering new content with JS. */
let revealObserver = null;

function isRevealElement(element) {
  return element.classList.contains("reveal") ||
         element.classList.contains("reveal-left") ||
         element.classList.contains("reveal-right");
}

function showRevealed(element) {
  element.classList.add("visible");
  // After the transition, remove the helper classes so normal hover effects work again.
  setTimeout(function () {
    element.classList.remove("reveal", "reveal-left", "reveal-right", "visible");
    element.style.transitionDelay = "";
  }, 1400);
}

function initReveal(root) {
  root = root || document;

  // Stagger children of [data-stagger] parents
  root.querySelectorAll("[data-stagger]").forEach(function (group) {
    Array.prototype.filter.call(group.children, isRevealElement).forEach(function (child, index) {
      child.style.transitionDelay = Math.min(index, 5) * 80 + "ms";
    });
  });

  const items = root.querySelectorAll(".reveal, .reveal-left, .reveal-right");

  // No observer support, or reduced motion: just show everything.
  if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
    items.forEach(showRevealed);
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          showRevealed(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  }

  items.forEach(function (item) { revealObserver.observe(item); });
}

/* ---------- Hero slider (home page) ----------
   Needs: <section class="hero"> with 2+ <div class="hero-slide"> children.
   The first slide should have class "active". Dots are created automatically. */
function initHeroSlider() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const slides = hero.querySelectorAll(".hero-slide");
  if (slides.length < 2) return;

  let dotsBox = hero.querySelector(".hero-dots");
  if (!dotsBox) {
    dotsBox = document.createElement("div");
    dotsBox.className = "hero-dots";
    hero.appendChild(dotsBox);
  }
  dotsBox.innerHTML = "";

  const dots = [];
  let current = 0;
  let timer = null;

  function showSlide(index) {
    slides[current].classList.remove("active");
    dots[current].classList.remove("active");
    current = (index + slides.length) % slides.length;
    slides[current].classList.add("active");
    dots[current].classList.add("active");
  }

  function start() {
    if (prefersReducedMotion() || timer) return;
    timer = setInterval(function () { showSlide(current + 1); }, 6500);
  }

  function stop() {
    clearInterval(timer);
    timer = null;
  }

  slides.forEach(function (slide, index) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", "Go to slide " + (index + 1));
    dot.addEventListener("click", function () {
      showSlide(index);
      stop();
      start();
    });
    dotsBox.appendChild(dot);
    dots.push(dot);
    slide.classList.remove("active");
  });

  // Initial state: first slide active
  slides[0].classList.add("active");
  dots[0].classList.add("active");

  hero.addEventListener("mouseenter", stop);
  hero.addEventListener("mouseleave", start);
  hero.addEventListener("focusin", stop);
  hero.addEventListener("focusout", start);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { stop(); } else { start(); }
  });

  start();
}

/* ---------- Number count-up (about page stats) ----------
   Usage: <span class="stat-number" data-count-to="50000" data-suffix="+">50,000+</span>
   Keep the final number as the text so it still shows if JavaScript is off. */
function initCountUp() {
  const items = document.querySelectorAll("[data-count-to]");
  if (items.length === 0) return;

  function run(element) {
    const target = Number(element.dataset.countTo) || 0;
    const suffix = element.dataset.suffix || "";

    if (prefersReducedMotion()) {
      element.textContent = target.toLocaleString() + suffix;
      return;
    }

    const duration = 1600;
    const startTime = performance.now();

    function step(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // fast start, slow finish
      element.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (!("IntersectionObserver" in window)) {
    items.forEach(run);
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        run(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  items.forEach(function (item) { observer.observe(item); });
}

/* ---------- Start ---------- */
onReady(function () {
  initSmoothAnchors();
  initScrollEffects();
  initReveal(document);
  initHeroSlider();
  initCountUp();
});