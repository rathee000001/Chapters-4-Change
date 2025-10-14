/* =========================================================
   CHAPTERS 4 CHANGE — UNIVERSAL APP
   Drives progress bar, parallax, fade-ins, particles,
   navbar highlighting, typewriter, keyboard nav, page
   transitions, dynamic footer, and accessibility helpers.
   ========================================================= */

(() => {
  "use strict";

  /* -------------------------------------------------------
     0) UTILITIES
  ------------------------------------------------------- */
  const $  = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const raf = (fn) => requestAnimationFrame(fn);
  const prefersReduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const throttle = (fn, wait=100) => {
    let t=0;
    return (...args) => {
      const now = Date.now();
      if (now - t >= wait) { t = now; fn.apply(null, args); }
    };
  };

  const debounce = (fn, wait=120) => {
    let id;
    return (...args) => { clearTimeout(id); id = setTimeout(() => fn.apply(null,args), wait); };
  };

  /* -------------------------------------------------------
     1) DYNAMIC YEAR / FOOTER ENRICHMENT
  ------------------------------------------------------- */
  const initFooter = () => {
    const yearEl = $("#year");
    if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  };

  /* -------------------------------------------------------
     2) PROGRESS BAR
  ------------------------------------------------------- */
  const progressBar = $("#progressBar");
  const updateProgress = throttle(() => {
    if (!progressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = `${pct}%`;
  }, 50);

  /* -------------------------------------------------------
     3) NAVBAR SCROLLED STATE + ACTIVE LINK
  ------------------------------------------------------- */
  const nav = $(".navbar");
  const navLinks = $$(".nav-links a");

  const setScrolled = () => {
    if (!nav) return;
    const scrolled = (window.scrollY || 0) > 8;
    nav.classList.toggle("scrolled", scrolled);
  };

  const markActiveLink = () => {
    if (!navLinks.length) return;
    const path = (location.pathname.split("/").pop() || "title.html").toLowerCase();
    navLinks.forEach(a => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      a.classList.toggle("active", href === path);
      a.setAttribute("aria-current", href === path ? "page" : "false");
    });
  };

  /* -------------------------------------------------------
     4) FADE-INS (IntersectionObserver)
  ------------------------------------------------------- */
  const initFaders = () => {
    const faders = $$(".fade-in");
    if (!faders.length) return;

    if (!("IntersectionObserver" in window)) {
      faders.forEach(el => el.classList.add("visible"));
      return;
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25, rootMargin: "0px 0px -80px 0px" });

    faders.forEach(el => io.observe(el));
  };

  /* -------------------------------------------------------
     5) PARALLAX HERO
  ------------------------------------------------------- */
  const parallax = () => {
    const hero = $(".hero-section");
    if (!hero) return;
    const mult = parseFloat(hero.dataset.parallax || "0.25");
    const offset = (window.scrollY || 0) * mult;
    hero.style.backgroundPositionY = `${offset}px`;
  };
  const updateParallax = prefersReduced() ? () => {} : throttle(parallax, 16);

  /* -------------------------------------------------------
     6) TYPEWRITER for .typewriter[data-text]
  ------------------------------------------------------- */
  const initTypewriter = () => {
    if (prefersReduced()) return;
    const el = $(".typewriter");
    if (!el) return;
    const text = el.dataset.text || el.textContent.trim();
    if (!text) return;

    let i = 0;
    el.textContent = "";
    el.classList.add("typing");

    const step = () => {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        i++;
        setTimeout(step, 28);
      } else {
        el.classList.remove("typing");
      }
    };
    step();
  };

  /* -------------------------------------------------------
     7) PARTICLES (lightweight canvas dots)
  ------------------------------------------------------- */
  const initParticles = () => {
    const canvas = $("#bgParticles");
    if (!canvas || prefersReduced()) return;
    const ctx = canvas.getContext("2d");
    let dpr = window.devicePixelRatio || 1;
    let width, height, particles;

    const resize = () => {
      width = canvas.width = Math.floor(innerWidth * dpr);
      height = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = `${innerWidth}px`;
      canvas.style.height = `${innerHeight}px`;
      spawn();
    };

    const spawn = () => {
      const count = Math.floor((innerWidth * innerHeight) / 26000);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * (2.2 * dpr) + (0.6 * dpr),
        vx: (Math.random() - .5) * 0.15 * dpr,
        vy: (Math.random() - .5) * 0.15 * dpr,
        a: Math.random() * 0.35 + 0.1
      }));
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width)  p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*2);
        g.addColorStop(0, `rgba(126,87,194,${p.a})`);
        g.addColorStop(1, `rgba(79,195,247,0)`);

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
      raf(tick);
    };

    on(window, "resize", debounce(resize, 120));
    resize();
    tick();
  };

  /* -------------------------------------------------------
     8) STORY PAGE — TIMELINE SCROLL REVEAL (Final)
  ------------------------------------------------------- */
  const initStoryTimeline = () => {
    if (!window.location.href.toLowerCase().includes("story.html")) return;
    const elements = document.querySelectorAll(".story-timeline li");
    if (!elements.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: "0px 0px -80px 0px" });

    elements.forEach(el => observer.observe(el));
  };

  /* -------------------------------------------------------
     9) KEYBOARD NAV (← → to prev/next fab if exists)
  ------------------------------------------------------- */
  const initKeyboardNav = () => {
    on(document, "keydown", e => {
      const prev = $(".floating-prev");
      const next = $(".floating-next");
      if (e.key === "ArrowRight" && next) next.click();
      if (e.key === "ArrowLeft" && prev) prev.click();
    });
  };

  /* -------------------------------------------------------
     10) SOFT PAGE TRANSITION on link clicks
  ------------------------------------------------------- */
  const initPageTransitions = () => {
    const links = $$("a[href$='.html']");
    links.forEach(a => {
      on(a, "click", e => {
        const href = a.getAttribute("href");
        if (!href || href.startsWith("#") || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        document.body.classList.add("fade-out");
        setTimeout(() => { location.href = href; }, 200);
      });
    });
  };

  /* -------------------------------------------------------
     11) SCROLL TO HASH (if any)
  ------------------------------------------------------- */
  const scrollToHash = () => {
    if (!location.hash) return;
    const el = $(location.hash);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: prefersReduced() ? "auto" : "smooth" });
  };

  /* -------------------------------------------------------
     12) INIT ON DOM READY
  ------------------------------------------------------- */
  const init = () => {
    initFooter();
    markActiveLink();
    initFaders();
    initTypewriter();
    initParticles();
    initKeyboardNav();
    initPageTransitions();
    scrollToHash();
    initStoryTimeline();

    updateProgress();
    setScrolled();
    updateParallax();

    on(window, "scroll", () => {
      updateProgress();
      setScrolled();
      updateParallax();
    });
    on(window, "resize", debounce(() => {
      updateProgress();
      updateParallax();
    }, 100));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
/* -------------------------------------------------------
   POSITIONING PAGE — BUBBLE MAP POSITIONING LOGIC
------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  if (!window.location.href.includes("positioning.html")) return;

  const map = document.querySelector("#bubbleMap");
  if (!map) return;

  // Position bubbles proportionally within map
  const bubbles = map.querySelectorAll(".bubble");
  bubbles.forEach(bubble => {
    const x = parseFloat(bubble.dataset.x);
    const y = parseFloat(bubble.dataset.y);

    // Normalize positions (adjust for your map layout)
    const left = ((x - 80) / 12) * 100; // X range roughly 80–92
    const bottom = ((y + 1) / 8) * 100; // Y range roughly -1–8

    bubble.style.left = `${left}%`;
    bubble.style.bottom = `${bottom}%`;

    // Set bubble size relative to efficiency (visual scale)
    const size = (x / 90) * 70;
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
  });
});
// === FUNDRAISER PAGE — COUNTERS ===
if (window.location.href.toLowerCase().includes("fundraiser.html")) {
  const counters = document.querySelectorAll(".kpi-num");

  const animateCounter = (el) => {
    const target = +el.getAttribute("data-target");
    const speed = 40;
    let count = 0;
    const update = () => {
      count += Math.ceil(target / 80);
      if (count < target) {
        el.textContent = count.toLocaleString();
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString();
        el.classList.add("visible");
      }
    };
    update();
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  counters.forEach(c => observer.observe(c));
}

})();
