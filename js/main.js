document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const CASES_READY = false; // troque para true quando as páginas /cases/<slug>.html existirem

  const plugins = [window.DrawSVGPlugin, window.ScrollTrigger, window.ScrollToPlugin, window.SplitText].filter(Boolean);
  if (hasGSAP && plugins.length) window.gsap.registerPlugin(...plugins);

  initScrollbar();
  initNavbar();
  initMobileMenu();
  initServices();
  initTeam();
  initBrandJourney();
  initMagnetic();
  initCaseTag();
  initParticles();
  initContactForm();
  initLegalAndCookieModals();
  initFloatingWhatsApp();
  document.querySelector("#year").textContent = new Date().getFullYear();
  window.addEventListener("load", () => window.ScrollTrigger?.refresh());

  const heroTimeline = initHero();
  let heroStarted = false;
  const startHero = () => {
    if (heroStarted) return;
    heroStarted = true;
    heroTimeline?.play(0);
    window.BOWHero?.start?.();
  };
  await initPreloader(startHero);
  startHero();
  initReveals();
  window.ScrollTrigger?.refresh();
  let initialTarget = null;
  try {
    initialTarget = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  } catch (error) { /* Ignore malformed URL fragments instead of stopping the page. */ }
  if (initialTarget) {
    initialTarget.scrollIntoView({ block: "start" });
  }

  function initPreloader(onReveal = () => {}) {
    const preloader = document.querySelector(".preloader");
    if (!preloader) { document.documentElement.classList.remove("is-loading"); return Promise.resolve(); }
    const counter = preloader.querySelector("[data-preloader-count]");
    const wordmark = preloader.querySelector(".preloader-wordmark");
    const rails = [...preloader.querySelectorAll(".preloader-wordmark-rail")];
    const rightSide = preloader.querySelector(".preloader-wordmark-right");
    const symbolFill = preloader.querySelector(".preloader-symbol-fill");
    if (!counter || !wordmark || rails.length !== 2 || !rightSide || !symbolFill) {
      document.documentElement.classList.remove("is-loading");
      preloader.remove();
      onReveal();
      return Promise.resolve();
    }

    const sourceWidth = 771.32;
    const sourceHeight = 179.44;
    const progressDuration = reduceMotion ? 0 : 1750;
    const exitAt = reduceMotion ? 0 : 1850;
    const totalDuration = reduceMotion ? 80 : 2000;
    let maxExtension = 0;
    let currentProgress = 0;
    let animationFrame = 0;
    let revealed = false;

    const updateLayout = () => {
      const bounds = wordmark.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const viewBoxWidth = bounds.width * sourceHeight / bounds.height;
      maxExtension = Math.max(0, viewBoxWidth - sourceWidth);
      wordmark.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${sourceHeight}`);
    };

    const render = (progress) => {
      currentProgress = Math.min(1, Math.max(0, progress));
      const percentage = Math.round(currentProgress * 100);
      const extension = maxExtension * Math.pow(currentProgress, 1.3);
      counter.textContent = String(percentage);
      rails.forEach((rail) => rail.setAttribute("width", String(extension + 3)));
      rightSide.setAttribute("transform", `translate(${extension} 0)`);
      symbolFill.style.clipPath = `inset(${100 - percentage}% 0 0)`;
    };

    const revealPage = () => {
      if (revealed) return;
      revealed = true;
      render(1);
      onReveal();
      preloader.classList.add("is-leaving");
    };

    updateLayout();
    render(reduceMotion ? 1 : 0);
    const handleResize = () => { updateLayout(); render(currentProgress); };
    window.addEventListener("resize", handleResize);

    return new Promise((resolve) => {
      const startedAt = performance.now();
      const complete = () => {
        window.cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", handleResize);
        document.documentElement.classList.remove("is-loading");
        preloader.remove();
        resolve();
      };

      const tick = (now) => {
        const elapsed = now - startedAt;
        render(progressDuration ? Math.min(1, elapsed / progressDuration) : 1);
        if (elapsed >= exitAt) revealPage();
        if (elapsed >= totalDuration) { complete(); return; }
        animationFrame = window.requestAnimationFrame(tick);
      };

      animationFrame = window.requestAnimationFrame(tick);
    });
  }

  function initScrollbar() {
    const bar = document.querySelector(".site-scrollbar");
    const thumb = bar?.querySelector(".site-scrollbar-thumb");
    if (!bar || !thumb) return;

    let frame = 0;
    let geometryDirty = true;
    let metrics = { maxScroll: 0, maxTop: 0, thumbHeight: 0 };
    let drag = null;

    const getNativeScrollTop = () => window.scrollY || document.documentElement.scrollTop || 0;
    const getScrollTop = () => drag?.scrollTop ?? getNativeScrollTop();

    const positionThumb = (scrollTop) => {
      const clampedScroll = Math.min(metrics.maxScroll, Math.max(0, scrollTop));
      const thumbTop = metrics.maxScroll ? (clampedScroll / metrics.maxScroll) * metrics.maxTop : 0;
      thumb.style.transform = `translate3d(0,${thumbTop}px,0)`;
      bar.setAttribute("aria-valuenow", String(Math.round(clampedScroll)));
    };

    const setScrollTop = (value) => {
      const target = Math.min(metrics.maxScroll, Math.max(0, value));
      if (drag) drag.scrollTop = target;
      window.scrollTo(0, target);
      positionThumb(target);
      window.ScrollTrigger?.update();
    };

    const update = () => {
      frame = 0;
      if (!geometryDirty) { positionThumb(getScrollTop()); return; }
      geometryDirty = false;
      const root = document.documentElement;
      const viewport = window.innerHeight;
      const scrollHeight = Math.max(root.scrollHeight, document.body.scrollHeight);
      const maxScroll = Math.max(0, scrollHeight - viewport);
      const thumbHeight = maxScroll ? Math.min(viewport, Math.max(58, viewport * viewport / scrollHeight)) : viewport;
      const maxTop = Math.max(0, viewport - thumbHeight);
      const scrollTop = Math.min(maxScroll, Math.max(0, getScrollTop()));

      metrics = { maxScroll, maxTop, thumbHeight };
      thumb.style.height = `${thumbHeight}px`;
      positionThumb(scrollTop);
      bar.classList.toggle("is-hidden", maxScroll <= 0);
      bar.tabIndex = maxScroll > 0 ? 0 : -1;
      bar.setAttribute("aria-valuemax", String(Math.round(maxScroll)));
    };

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const requestMeasure = () => { geometryDirty = true; requestUpdate(); };

    const scrollFromPointer = (clientY) => {
      if (!drag || !metrics.maxTop) return;
      const bounds = bar.getBoundingClientRect();
      const thumbTop = Math.min(metrics.maxTop, Math.max(0, clientY - bounds.top - drag.offsetY));
      setScrollTop((thumbTop / metrics.maxTop) * metrics.maxScroll);
    };

    bar.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || !metrics.maxScroll) return;
      const thumbBounds = thumb.getBoundingClientRect();
      const startedOnThumb = event.clientY >= thumbBounds.top && event.clientY <= thumbBounds.bottom;
      const currentScrollTop = getNativeScrollTop();
      drag = {
        pointerId: event.pointerId,
        offsetY: startedOnThumb ? event.clientY - thumbBounds.top : metrics.thumbHeight / 2,
        scrollTop: currentScrollTop
      };
      document.documentElement.classList.add("is-scrollbar-dragging");
      thumb.classList.add("is-dragging");
      bar.setPointerCapture?.(event.pointerId);
      scrollFromPointer(event.clientY);
      event.preventDefault();
    });
    bar.addEventListener("pointermove", (event) => {
      if (!drag || event.pointerId !== drag.pointerId) return;
      scrollFromPointer(event.clientY);
      event.preventDefault();
    });
    const stopDrag = (event) => {
      if (event?.pointerId !== undefined && drag && event.pointerId !== drag.pointerId) return;
      drag = null;
      document.documentElement.classList.remove("is-scrollbar-dragging");
      thumb.classList.remove("is-dragging");
      requestUpdate();
    };
    bar.addEventListener("pointerup", stopDrag);
    bar.addEventListener("pointercancel", stopDrag);
    bar.addEventListener("lostpointercapture", stopDrag);
    window.addEventListener("blur", stopDrag);
    bar.addEventListener("keydown", (event) => {
      const steps = {
        ArrowUp: -60,
        ArrowDown: 60,
        PageUp: -window.innerHeight * .85,
        PageDown: window.innerHeight * .85,
        Home: -metrics.maxScroll,
        End: metrics.maxScroll
      };
      if (!(event.key in steps)) return;
      event.preventDefault();
      setScrollTop(getScrollTop() + steps[event.key]);
    });

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestMeasure);
    window.addEventListener("load", requestMeasure);
    window.ScrollTrigger?.addEventListener("refresh", requestMeasure);
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(requestMeasure);
      resizeObserver.observe(document.body);
      const content = document.querySelector("#smooth-content");
      if (content) resizeObserver.observe(content);
    }
  }

  function scrollToTarget(selector) {
    const target = document.querySelector(selector);
    if (!target) return;
    if (hasGSAP && window.ScrollToPlugin && !reduceMotion) window.gsap.to(window, { duration: 1, scrollTo: { y: target }, ease: "power3.inOut" });
    else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  function bidirectionalTrigger(trigger, start = "top 88%", end = "bottom 12%") {
    return {
      trigger,
      start,
      end,
      toggleActions: "play reverse play reverse",
      invalidateOnRefresh: true
    };
  }

  function initNavbar() {
    const nav = document.querySelector(".navbar");
    const sections = [...document.querySelectorAll("main > section[data-theme]")];
    let positions = [], probe = 39, frame = 0;
    const measure = () => {
      probe = Math.min(window.innerHeight - 1, Math.max(1, nav.getBoundingClientRect().height * .5));
      const y = window.scrollY;
      positions = sections.map(section => {
        const rect = section.getBoundingClientRect();
        return { top: rect.top + y, bottom: rect.bottom + y, theme: section.dataset.theme };
      });
      update();
    };
    const update = () => {
      frame = 0;
      const y = window.scrollY + probe;
      const current = positions.findLast(section => section.top <= y && section.bottom > y);
      nav.classList.toggle("is-dark", current?.theme !== "light");
    };
    measure();
    window.addEventListener("scroll", () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
    window.addEventListener("resize", measure);
    window.ScrollTrigger?.addEventListener("refresh", measure);
    if (window.ResizeObserver) new ResizeObserver(measure).observe(document.querySelector("main"));
    document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#" || !document.getElementById(href.slice(1))) return;
      event.preventDefault();
      const target = document.getElementById(href.slice(1));
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      if (href === "#inicio") {
        window.gsap?.killTweensOf(window);
        if (hasGSAP && window.ScrollToPlugin && !reduceMotion) window.gsap.to(window, { duration: .9, scrollTo: { y: 0 }, ease: "power3.inOut" });
        else window.scrollTo({ top: 0, left: 0, behavior: reduceMotion ? "auto" : "smooth" });
        return;
      }
      scrollToTarget(href);
    }));
  }

  function initMobileMenu() {
    const menu = document.querySelector(".mobile-menu");
    const open = document.querySelector(".menu-toggle");
    const close = document.querySelector(".menu-close");
    const links = [...document.querySelectorAll(".mobile-links a")];
    const homeLinks = [...document.querySelectorAll(".mobile-brand,.mobile-symbol-home")];
    if (!menu || !open || !close) return;
    let timeline = null;
    let restoreBackground = () => {};
    let closing = false;
    if (hasGSAP && !reduceMotion) {
      timeline = window.gsap.timeline({ paused: true, defaults: { ease: "power4.out" } })
        .set(menu, { visibility: "visible", pointerEvents: "auto" })
        .to(menu, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: .75 })
        .from(links, { yPercent: 105, opacity: 0, stagger: .045, duration: .65 }, "-=.4")
        .from(".mobile-menu-foot", { y: 18, opacity: 0, duration: .5 }, "-=.45");
    }
    const show = () => {
      closing = false;
      timeline?.eventCallback("onReverseComplete", null);
      menu.inert = false;
      menu.classList.add("is-open"); menu.setAttribute("aria-hidden", "false"); open.setAttribute("aria-expanded", "true"); document.body.classList.add("menu-open");
      if (timeline) { window.gsap.set(menu, { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }); timeline.restart(); }
      close.focus({ preventScroll: true });
      restoreBackground = isolateDialog(menu);
    };
    const hide = (event) => {
      if (closing) return;
      closing = true;
      const href = event?.currentTarget?.getAttribute?.("href");
      const destination = href?.startsWith("#") ? document.getElementById(href.slice(1)) : null;
      const done = () => {
        restoreBackground();
        if (destination) destination.focus({ preventScroll: true });
        else if (menu.contains(document.activeElement)) open.focus({ preventScroll: true });
        menu.inert = true; menu.classList.remove("is-open"); menu.setAttribute("aria-hidden", "true"); open.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-open"); closing = false;
      };
      if (timeline) timeline.reverse().eventCallback("onReverseComplete", done); else done();
    };
    open.addEventListener("click", show); close.addEventListener("click", hide); [...links, ...homeLinks].forEach((link) => link.addEventListener("click", hide));
    document.addEventListener("keydown", (event) => {
      if (!menu.classList.contains("is-open")) return;
      if (event.key === "Escape") { event.preventDefault(); hide(); }
      else trapDialogFocus(event, menu);
    });
    window.matchMedia("(min-width: 993px)").addEventListener("change", event => { if (event.matches && menu.classList.contains("is-open")) hide(); });
  }

  function initHero() {
    const hero = document.querySelector(".bow-hero");
    if (!hero || !hasGSAP || reduceMotion) return null;
    const g = window.gsap;
    const lines = [...hero.querySelectorAll(".bh-title > span")];
    const chars = window.SplitText ? lines.flatMap((line) => new window.SplitText(line, { type: "chars", charsClass: "bh-char", aria: "none" }).chars) : lines;
    lines.forEach(line => line.setAttribute("aria-hidden", "true"));

    g.set(".navbar", { y: -20, opacity: 0 });
    g.set(chars, { yPercent: 115, rotationX: -70, opacity: 0, filter: "blur(14px)", transformOrigin: "50% 100%" });
    g.set(".bh-lead", { y: 22, opacity: 0 });
    g.set(".bh-actions > *", { y: 20, opacity: 0 });
    g.set("#hero-3d", { opacity: 0, scale: .94 });

    const timeline = g.timeline({ paused: true, defaults: { ease: "power4.out" } })
      .to(".navbar", { y: 0, opacity: 1, duration: .55 }, 0)
      .to("#hero-3d", { opacity: 1, scale: 1, duration: 1.4, ease: "power3.out" }, .1)
      .to(chars, { yPercent: 0, rotationX: 0, opacity: 1, filter: "blur(0px)", duration: .9, stagger: .03, onComplete: () => { g.set(chars, { clearProps: "transform,opacity,filter" }); chars.forEach(char => { char.style.willChange = "auto"; }); } }, .25)
      .to(".bh-lead", { y: 0, opacity: 1, duration: .7 }, .7)
      .to(".bh-actions > *", { y: 0, opacity: 1, stagger: .08, duration: .6 }, .82);

    if (window.ScrollTrigger) {
      const scrub = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
      g.to(".bh-copy", { yPercent: -16, ease: "none", scrollTrigger: scrub });
      g.to(".bh-inner", { opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "35% top", end: "bottom 25%", scrub: true } });
      window.ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", scrub: true, onUpdate: (self) => window.BOWHero?.setProgress(self.progress) });
    }
    return timeline;
  }

  function initCaseTag() {
    const cards = [...document.querySelectorAll(".service-card[data-case]")];
    const tag = document.querySelector(".case-tag");
    if (!cards.length) return;
    const label = tag?.querySelector("b");
    const text = label?.textContent || "";
    let soonTimer = 0;
    const open = (card) => {
      if (CASES_READY) { window.location.href = `cases/${card.dataset.case}.html`; return; }
      if (!label) return;
      label.textContent = "Cases em breve";
      document.querySelector("[data-case-status]").textContent = `Cases de ${card.querySelector("h3").textContent} em breve.`;
      window.clearTimeout(soonTimer);
      soonTimer = window.setTimeout(() => { label.textContent = text; }, 1500);
    };
    cards.forEach((card) => {
      card.addEventListener("click", () => open(card));
    });
    if (!tag || isTouch || !window.matchMedia("(hover: hover)").matches) return;

    let mx = -200, my = -200, x = -200, y = -200, active = false, frame = 0;
    const dark = (card) => card.matches(".service-card-primary,.service-card-social,.service-card-performance");
    const tick = () => {
      x += (mx - x) * .22; y += (my - y) * .22;
      tag.style.transform = `translate3d(${x}px,${y}px,0)`;
      frame = Math.abs(mx - x) > .5 || Math.abs(my - y) > .5 ? window.requestAnimationFrame(tick) : 0;
    };
    cards.forEach((card) => {
      card.addEventListener("pointerenter", (event) => { mx = x = event.clientX; my = y = event.clientY; tag.classList.toggle("is-light", dark(card)); tag.classList.add("is-on"); active = true; if (!frame) frame = window.requestAnimationFrame(tick); });
      card.addEventListener("pointermove", (event) => { mx = event.clientX; my = event.clientY; if (!frame) frame = window.requestAnimationFrame(tick); }, { passive: true });
      card.addEventListener("pointerleave", () => { active = false; tag.classList.remove("is-on"); });
    });
  }

  function initReveals() {
    if (!hasGSAP || !window.ScrollTrigger || reduceMotion) return;

    const selector = [
      ".about-heading .section-title",
      ".about-heading > p:last-child",
      ".about-lead",
      ".about-card h3",
      ".about-card > p",
      ".about-card-metric strong",
      ".about-card-metric div > span",
      ".services-headline .section-title",
      ".services-headline > div > p",
      ".services-headline .text-link",
      ".service-card h3",
      ".service-card-body > p",
      ".team-heading .display-title",
      ".team-heading > p",
      ".brand-journey-header h2",
      ".brand-journey-intro",
      ".contact-heading h2",
      ".contact-heading > p",
      ".contact-panel h3",
      ".contact-steps strong",
      ".contact-steps p",
      ".footer-brand-row > p",
      ".footer-meta p"
    ].join(",");

    const prepare = (element) => {
      const split = window.SplitText && !element.matches(".text-link") ? new window.SplitText(element, { type: "words", wordsClass: "blur-word", aria: "none" }) : null;
      const isHeading = element.matches("h2,h3,strong,.section-title,.display-title,.about-lead");
      const words = split?.words?.length ? split.words : [element];

      window.gsap.set(words, { y: -42, opacity: 0, filter: "blur(10px)" });
      window.gsap.to(words, {
        keyframes: [
          { y: 5, opacity: .5, filter: "blur(5px)", duration: .35, ease: "none" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: .35, ease: "none" }
        ],
        stagger: isHeading ? .075 : .035,
        onStart: () => window.gsap.set(words, { willChange: "transform,filter,opacity" }),
        onComplete: () => window.gsap.set(words, { clearProps: "willChange" }),
        onReverseComplete: () => window.gsap.set(words, { clearProps: "willChange" }),
        scrollTrigger: bidirectionalTrigger(element)
      });
    };
    // Prepare before the original 88% trigger, keeping the same reveal/reverse timeline.
    const elements = window.gsap.utils.toArray(selector);
    if (!window.IntersectionObserver) { elements.forEach(prepare); return; }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        prepare(entry.target);
      });
    }, { rootMargin: "100% 0px" });
    elements.forEach(element => observer.observe(element));
  }

  function initServices() {
    const cards = [...document.querySelectorAll(".service-card")];
    cards.forEach(card => {
      let frame = 0, x = 0, y = 0;
      card.addEventListener("pointermove", event => {
        x = event.clientX; y = event.clientY;
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const rect = card.getBoundingClientRect();
          card.style.setProperty("--spot-x", `${((x - rect.left) / rect.width) * 100}%`);
          card.style.setProperty("--spot-y", `${((y - rect.top) / rect.height) * 100}%`);
        });
      }, { passive: true });
    });

    const galleries = cards.map((card) => ({
      card,
      images: [...card.querySelectorAll(".service-card-image")],
      activeIndex: 0
    })).filter((gallery) => gallery.images.length > 1);

    if (galleries.length && !reduceMotion) {
      const servicesGrid = document.querySelector(".services-bento");
      let servicesVisible = !window.IntersectionObserver;
      const visibilityObserver = window.IntersectionObserver && new IntersectionObserver(([entry]) => {
        servicesVisible = entry.isIntersecting;
      }, { rootMargin: "20% 0px" });

      if (servicesGrid && visibilityObserver) visibilityObserver.observe(servicesGrid);

      const cycleTimer = window.setInterval(() => {
        if (!servicesVisible || document.hidden) return;
        galleries.forEach((gallery, index) => {
          window.setTimeout(() => {
            if (!servicesVisible || document.hidden) return;
            const nextIndex = (gallery.activeIndex + 1) % gallery.images.length;
            gallery.images[gallery.activeIndex].classList.remove("is-active");
            gallery.images[nextIndex].classList.add("is-active");
            gallery.activeIndex = nextIndex;
          }, index * 260);
        });
      }, 5200);

      window.addEventListener("pagehide", event => {
        if (event.persisted) return;
        window.clearInterval(cycleTimer);
        visibilityObserver?.disconnect();
      });
    }

    if (!hasGSAP || !window.ScrollTrigger || reduceMotion) return;

    window.gsap.from(".about-feature", { y: 45, scale: .975, opacity: 0, duration: 1.05, ease: "power3.out", scrollTrigger: bidirectionalTrigger(".about-feature", "top 84%", "bottom 16%") });
    window.gsap.from(".about-card", {
      y: 42,
      opacity: 0,
      duration: .85,
      ease: "power3.out",
      onComplete: () => window.gsap.set(".about-card", { clearProps: "transform,opacity" }),
      scrollTrigger: bidirectionalTrigger(".about-grid", "top 86%", "bottom 14%")
    });
    window.gsap.to(".about-feature-visual img", { yPercent: -24, rotation: 14, ease: "none", scrollTrigger: { trigger: ".about-feature", start: "top bottom", end: "bottom top", scrub: true } });

    if (window.DrawSVGPlugin) {
      window.gsap.from(".about-signal-line", { drawSVG: "0%", duration: 1.6, stagger: .18, ease: "power2.inOut", scrollTrigger: bidirectionalTrigger(".about-feature-visual") });
    } else {
      window.gsap.from(".about-signal-line", { opacity: 0, duration: 1, stagger: .15, scrollTrigger: bidirectionalTrigger(".about-feature-visual") });
    }

    const servicesReveal = window.gsap.timeline({
      scrollTrigger: {
        trigger: ".services-bento",
        start: "top 92%",
        end: "top 55%",
        scrub: .6,
        invalidateOnRefresh: true
      }
    });
    servicesReveal
      .fromTo(".services-bento", { y: 52, scale: .98, transformOrigin: "50% 0%" }, { y: 0, scale: 1, duration: .97, ease: "none" }, 0)
      .fromTo(cards, { opacity: 0 }, { opacity: 1, duration: .65, stagger: .08, ease: "none" }, 0);
    cards.forEach((card) => { const fig = card.querySelector("figure"); if (fig) window.gsap.fromTo(fig, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "bottom top", scrub: true } }); });
    window.gsap.from(".team-card", { y: 48, scale: .985, opacity: 0, stagger: .1, duration: .9, ease: "power3.out", onComplete: () => window.gsap.set(".team-card", { clearProps: "transform,opacity" }), scrollTrigger: bidirectionalTrigger(".team-grid", "top 84%", "bottom 16%") });
    window.gsap.from(".contact-panel", {
      x: () => window.matchMedia("(max-width: 700px)").matches ? 0 : 42,
      y: () => window.matchMedia("(max-width: 700px)").matches ? 32 : 0,
      scale: .975,
      opacity: 0,
      duration: 1.05,
      ease: "power3.out",
      scrollTrigger: bidirectionalTrigger(".contact-layout", "top 80%", "bottom 20%")
    });
    window.gsap.from(".contact-steps li", { y: 24, opacity: 0, stagger: .1, duration: .75, ease: "power3.out", scrollTrigger: bidirectionalTrigger(".contact-steps") });
    window.gsap.to(".contact-backdrop-symbol", { yPercent: -14, rotation: 2, ease: "none", scrollTrigger: { trigger: ".contact", start: "top bottom", end: "bottom top", scrub: true } });
  }

  function initTeam() {
    const cards = [...document.querySelectorAll(".team-card")];
    if (!cards.length || !isTouch) return;
    if (hasGSAP && window.ScrollTrigger && !reduceMotion) {
      cards.forEach((card) => window.ScrollTrigger.create({ trigger: card, start: "top 66%", end: "bottom 34%", toggleClass: { targets: card, className: "is-active" } }));
    } else if (window.IntersectionObserver) {
      const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.target.classList.toggle("is-active", entry.isIntersecting)), { rootMargin: "-28% 0px -28% 0px", threshold: .15 });
      cards.forEach((card) => observer.observe(card));
    }
  }

  function initBrandJourney() {
    const section = document.querySelector(".brand-journey");
    const cards = [...(section?.querySelectorAll(".brand-pillar-card") || [])];
    if (!section || !cards.length || !hasGSAP || !window.ScrollTrigger || reduceMotion) return;

    let cardsReveal = null;
    const resetCards = () => {
      cardsReveal?.kill();
      cardsReveal = null;
      window.gsap.set(cards, { y: 64, scale: .975, opacity: 0 });
    };
    const revealCards = () => {
      cardsReveal?.kill();
      cardsReveal = window.gsap.fromTo(cards,
        { y: 64, scale: .975, opacity: 0 },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: .8,
          stagger: { each: .13, from: "start" },
          ease: "power3.out",
          onComplete: () => window.gsap.set(cards, { clearProps: "transform,opacity" })
        }
      );
    };

    resetCards();
    window.ScrollTrigger.create({
      trigger: ".brand-pillars-grid",
      start: "top 86%",
      end: "bottom 14%",
      onEnter: revealCards,
      onEnterBack: revealCards,
      onLeave: resetCards,
      onLeaveBack: resetCards,
      invalidateOnRefresh: true
    });

    window.gsap.to(".brand-journey-mark", {
      yPercent: -14,
      rotation: 2,
      ease: "none",
      scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true }
    });
  }

  function initMagnetic() {
    if (isTouch || reduceMotion || !hasGSAP) return;
    document.querySelectorAll(".magnetic").forEach((button) => { button.addEventListener("mousemove", (event) => { const rect = button.getBoundingClientRect(); window.gsap.to(button, { x: (event.clientX - rect.left - rect.width / 2) * .1, y: (event.clientY - rect.top - rect.height / 2) * .14, duration: .35, ease: "power3.out" }); }); button.addEventListener("mouseleave", () => window.gsap.to(button, { x: 0, y: 0, duration: .6, ease: "power3.out" })); });
  }

  function isolateDialog(dialog) {
    const siblings = [...document.body.children].filter(element => element !== dialog && !element.matches("script,style"));
    const states = siblings.map(element => element.inert);
    siblings.forEach(element => { element.inert = true; });
    return () => siblings.forEach((element, index) => { element.inert = states[index]; });
  }

  function trapDialogFocus(event, dialog) {
    if (event.key !== "Tab") return;
    const controls = [...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),[tabindex="0"]')].filter(element => element.getClientRects().length);
    const index = controls.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1)?.focus(); }
    else if (!event.shiftKey && (index === -1 || index === controls.length - 1)) { event.preventDefault(); controls[0]?.focus(); }
  }

  function initFloatingWhatsApp() {
    const link = document.querySelector(".whatsapp-float");
    if (!link) return;
    const banner = document.querySelector("[data-cookie-banner]");
    // The mobile hero reserves space below its CTAs for the fixed corner button.
    const controls = [...document.querySelectorAll('.contact-panel input:not([type="hidden"]),.contact-panel textarea,.contact-panel button,.footer a,.footer button')];
    let frame = 0;
    const update = () => {
      frame = 0;
      const own = link.getBoundingClientRect();
      const gap = 8;
      const safeBottom = parseFloat(getComputedStyle(link).bottom) || 20;
      const rects = controls.map(control => control.getBoundingClientRect()).filter(rect => rect.width && rect.top < innerHeight && rect.bottom > 0);
      if (banner && !banner.hidden) {
        const rect = banner.getBoundingClientRect();
        const settledTop = innerHeight - (parseFloat(getComputedStyle(banner).bottom) || 0) - banner.offsetHeight;
        rects.push({ left: rect.left, right: rect.right, top: Math.min(rect.top, settledTop), bottom: rect.bottom });
      }
      let bottom = innerHeight - safeBottom;
      let top = bottom - own.height;
      // All reads precede the single write. Only move when an actual control overlaps.
      for (let i = 0; i <= rects.length; i++) {
        const hit = rects.find(rect => rect.right > own.left && rect.left < own.right && rect.bottom > top - gap && rect.top < bottom + gap);
        if (!hit) break;
        bottom = hit.top - gap; top = bottom - own.height;
      }
      link.style.transform = `translateY(${Math.min(0, bottom - (innerHeight - safeBottom))}px)`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    addEventListener("scroll", schedule, { passive: true });
    addEventListener("resize", schedule);
    if (banner) {
      new MutationObserver(schedule).observe(banner, { attributes: true, attributeFilter: ["hidden", "class"] });
      new ResizeObserver(schedule).observe(banner);
      banner.addEventListener("transitionend", schedule);
      banner.addEventListener("animationend", schedule);
    }
    schedule();
  }

  function initContactForm() {
    const form = document.querySelector("[data-contact-form]");
    if (!form) return;

    const serviceInputs = [...form.querySelectorAll('input[name="Serviços[]"]')];
    const servicesFieldset = form.querySelector(".contact-services");
    const servicesError = form.querySelector(".contact-field-error");
    const submitButton = form.querySelector('[type="submit"]');
    const submitLabel = form.querySelector("[data-submit-label]");
    const status = form.querySelector(".contact-form-status");
    const success = form.querySelector("[data-contact-success]");
    const again = form.querySelector("[data-contact-again]");
    const phone = form.querySelector("[data-phone-input]");
    let submitting = false;

    const maskPhone = () => {
      const raw = phone.value;
      const caret = phone.selectionStart ?? raw.length;
      let digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, "").length;
      let digits = raw.replace(/\D/g, "");
      // Accept pasted Brazilian numbers with the +55 country code as well.
      if (digits.length === 13 && digits.startsWith("55")) {
        digits = digits.slice(2);
        digitsBeforeCaret = Math.max(0, digitsBeforeCaret - 2);
      }
      digits = digits.slice(0, 11);
      let formatted = digits ? `(${digits.slice(0, 2)}` : "";
      if (digits.length > 2) formatted += `) ${digits.slice(2, 7)}`;
      if (digits.length > 7) formatted += `-${digits.slice(7)}`;
      phone.value = formatted;
      // Keep edits in the middle of the number at the same digit position.
      let nextCaret = formatted.length;
      if (caret < raw.length) {
        nextCaret = 0;
        let count = 0;
        while (nextCaret < formatted.length && count < digitsBeforeCaret) {
          if (/\d/.test(formatted[nextCaret])) count++;
          nextCaret++;
        }
      }
      phone.setSelectionRange(nextCaret, nextCaret);
    };
    phone.addEventListener("input", maskPhone);
    phone.addEventListener("change", maskPhone);
    maskPhone();

    const validateServices = (showError = false) => {
      const isValid = serviceInputs.some((input) => input.checked);
      servicesFieldset?.classList.toggle("has-error", showError && !isValid);
      if (servicesError) servicesError.hidden = !showError || isValid;
      return isValid;
    };

    serviceInputs.forEach((input) => input.addEventListener("change", () => validateServices(true)));
    again.addEventListener("click", () => {
      success.hidden = true;
      form.classList.remove("is-submitted");
      status.textContent = "";
      status.className = "contact-form-status";
      submitLabel.textContent = "Enviar projeto";
      form.querySelector('input[name="Nome"]').focus({ preventScroll: true });
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitting || form.classList.contains("is-submitted")) return;
      maskPhone();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (!validateServices(true)) {
        serviceInputs[0]?.focus();
        return;
      }

      const data = new FormData(form);
      if (String(data.get("_honey") || "").trim()) return;
      const company = String(data.get("Empresa") || "").trim();
      const email = String(data.get("email") || "").trim();
      const message = String(data.get("Sobre o negócio") || "").trim();
      data.set("Nome", String(data.get("Nome") || "").trim());
      data.set("Empresa", company);
      data.set("email", email);
      data.set("Celular", phone.value);
      data.set("_replyto", email);
      data.set("_subject", `B0w Studio | Novo projeto — ${company.replace(/[\r\n]+/g, " ").slice(0, 100)}`);
      // AJAX stays on this site; the provider's separate CAPTCHA page cannot be used here.
      // Keep the honeypot in the request. The native no-JS fallback retains CAPTCHA.
      data.set("_captcha", "false");
      data.delete("Serviços[]");
      data.delete("Sobre o negócio");
      data.set("Serviços desejados", serviceInputs.filter((input) => input.checked).map((input) => input.value).join(", "));
      data.set("Sobre o negócio", message);

      submitting = true;
      submitButton.disabled = true;
      submitButton.classList.add("is-loading");
      submitButton.setAttribute("aria-busy", "true");
      submitLabel.textContent = "Enviando seu projeto…";
      status.className = "contact-form-status is-visually-hidden";
      status.textContent = "Enviando seu projeto…";
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 30000);

      try {
        const endpoint = form.action.replace("https://formsubmit.co/", "https://formsubmit.co/ajax/");
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          // Explicit allowlist: never forward injected provider options or extra fields.
          body: JSON.stringify(Object.fromEntries([
            "Nome", "Empresa", "email", "Celular", "Sobre o negócio", "Serviços desejados",
            "_replyto", "_subject", "_template", "_url", "_captcha", "_honey"
          ].map(key => [key, data.get(key)]))),
          credentials: "omit",
          cache: "no-store",
          redirect: "error",
          referrerPolicy: "origin",
          signal: controller.signal
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || (result?.success !== true && result?.success !== "true")) {
          throw new Error("Envio não confirmado");
        }
        // Only clear the visitor's data and animate after the API acknowledges the submission.
        form.reset();
        validateServices(false);
        status.textContent = "";
        form.classList.add("is-submitted");
        success.hidden = false;
        success.focus({ preventScroll: true });
      } catch (error) {
        submitLabel.textContent = "Tentar novamente";
        status.className = "contact-form-status is-error";
        status.textContent = error.name === "AbortError"
          ? "O envio demorou mais que o esperado. Não conseguimos confirmar o recebimento. Seus dados continuam aqui; tente novamente ou fale pelo WhatsApp."
          : "Não foi possível confirmar o envio. Seus dados continuam aqui; tente novamente ou fale pelo WhatsApp.";
      } finally {
        window.clearTimeout(timeout);
        submitting = false;
        submitButton.disabled = false;
        submitButton.classList.remove("is-loading");
        submitButton.removeAttribute("aria-busy");
      }
    });
  }

  function initLegalAndCookieModals() {
    const modals = new Map([...document.querySelectorAll("[data-legal-modal]")].map((modal) => [modal.dataset.legalModal, modal]));
    if (!modals.size) return;

    const focusableSelector = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const storageKey = "b0w_cookie_preferences_v1";
    const defaults = { version: 1, necessary: true, analytics: false, functional: false, marketing: false };
    const cookieBanner = document.querySelector("[data-cookie-banner]");
    let activeModal = null;
    let returnFocus = null;
    let savedScrollY = 0;
    let closeTimer = 0;
    let restoreBackground = () => {};
    let closing = false;
    const preferenceLifetime = 180 * 86400000;

    const parsePreferences = (raw) => {
      try {
        const saved = JSON.parse(raw || "null");
        const savedAt = Date.parse(saved?.updatedAt);
        const validAge = Number.isFinite(savedAt) && savedAt <= Date.now() + 300000 && Date.now() - savedAt < preferenceLifetime;
        return saved?.version === 1 && validAge && ["analytics", "functional", "marketing"].every((category) => typeof saved[category] === "boolean")
          ? { ...defaults, analytics: saved.analytics, functional: saved.functional, marketing: saved.marketing, updatedAt: saved.updatedAt } : null;
      } catch (error) {
        return null;
      }
    };

    const readCookie = () => {
      try {
        const entry = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${storageKey}=`));
        return entry ? decodeURIComponent(entry.slice(storageKey.length + 1)) : null;
      } catch (error) {
        return null;
      }
    };

    const readStoredPreferences = () => {
      let local = null;
      try { local = parsePreferences(window.localStorage.getItem(storageKey)); } catch (error) { /* Cookies can still be available. */ }
      const cookie = parsePreferences(readCookie());
      if (!local) return cookie;
      if (!cookie) return local;
      return (Date.parse(cookie.updatedAt) || 0) >= (Date.parse(local.updatedAt) || 0) ? cookie : local;
    };

    const readPreferences = () => readStoredPreferences() || { ...defaults };
    const hasStoredPreferences = () => Boolean(readStoredPreferences());

    const persistPreferences = (value) => {
      const serialized = JSON.stringify(value);
      let localSaved = false;
      let cookieSaved = false;
      try {
        window.localStorage.setItem(storageKey, serialized);
        localSaved = window.localStorage.getItem(storageKey) === serialized;
      } catch (error) { /* Fall back to the necessary preference cookie. */ }
      try {
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        const remainingSeconds = Math.max(0, Math.ceil((Date.parse(value.updatedAt) + preferenceLifetime - Date.now()) / 1000));
        document.cookie = `${storageKey}=${encodeURIComponent(serialized)}; Max-Age=${remainingSeconds}; Path=/; SameSite=Lax${secure}`;
        cookieSaved = readCookie() === serialized;
      } catch (error) { /* Local storage can still preserve the choice. */ }
      return localSaved || cookieSaved;
    };

    const showCookieBanner = () => {
      if (!cookieBanner || hasStoredPreferences()) return;
      cookieBanner.hidden = false;
      window.requestAnimationFrame(() => cookieBanner.classList.add("is-visible"));
    };

    const hideCookieBanner = () => {
      if (!cookieBanner || cookieBanner.hidden) return;
      cookieBanner.classList.remove("is-visible");
      window.setTimeout(() => { cookieBanner.hidden = true; }, reduceMotion ? 0 : 360);
    };

    const activateConsentedScripts = (preferences) => {
      document.querySelectorAll('script[type="text/plain"][data-consent-category]').forEach((template) => {
        const category = template.dataset.consentCategory;
        if (!preferences[category] || template.dataset.activated === "true") return;
        const script = document.createElement("script");
        [...template.attributes].forEach((attribute) => {
          if (!["type", "data-consent-category", "data-src", "data-activated"].includes(attribute.name)) script.setAttribute(attribute.name, attribute.value);
        });
        if (template.dataset.src) script.src = template.dataset.src;
        if (template.textContent.trim()) script.textContent = template.textContent;
        template.dataset.activated = "true";
        template.after(script);
      });
    };

    const syncPreferenceControls = () => {
      const preferences = readPreferences();
      document.querySelectorAll("[data-cookie-category]").forEach((input) => {
        input.checked = Boolean(preferences[input.dataset.cookieCategory]);
      });
      return preferences;
    };

    const lockBackground = () => {
      savedScrollY = window.scrollY;
      document.documentElement.classList.add("legal-scroll-locked");
      document.body.classList.add("legal-modal-open");
    };

    const unlockBackground = () => {
      const root = document.documentElement;
      const previousScrollBehavior = root.style.scrollBehavior;
      root.style.scrollBehavior = "auto";
      root.classList.remove("legal-scroll-locked");
      document.body.classList.remove("legal-modal-open");
      if (Math.abs(window.scrollY - savedScrollY) > .5) window.scrollTo({ top: savedScrollY, left: 0, behavior: "auto" });
      window.requestAnimationFrame(() => {
        root.style.scrollBehavior = previousScrollBehavior;
      });
    };

    const showModal = (name, trigger) => {
      const modal = modals.get(name);
      if (!modal) return;
      window.clearTimeout(closeTimer);
      closing = false;
      if (!activeModal) {
        returnFocus = trigger || document.activeElement;
        lockBackground();
      } else {
        activeModal.classList.remove("is-open");
        activeModal.hidden = true;
      }
      activeModal = modal;
      if (name === "preferences") syncPreferenceControls();
      modal.hidden = false;
      restoreBackground();
      window.requestAnimationFrame(() => {
        if (activeModal !== modal) return;
        modal.classList.add("is-open");
        modal.querySelector(".legal-dialog")?.focus({ preventScroll: true });
        restoreBackground = isolateDialog(modal);
      });
    };

    const hideModal = () => {
      if (!activeModal || closing) return;
      const modal = activeModal;
      closing = true;
      modal.classList.remove("is-open");
      const finish = () => {
        modal.hidden = true;
        activeModal = null;
        closing = false;
        restoreBackground();
        unlockBackground();
        if (returnFocus instanceof HTMLElement && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
        returnFocus = null;
      };
      closeTimer = window.setTimeout(finish, reduceMotion ? 0 : 280);
    };

    document.querySelectorAll("[data-legal-open]").forEach((trigger) => {
      trigger.addEventListener("click", () => showModal(trigger.dataset.legalOpen, trigger));
    });
    document.querySelectorAll("[data-legal-close]").forEach((button) => button.addEventListener("click", hideModal));
    modals.forEach((modal) => modal.addEventListener("click", (event) => {
      if (event.target === modal) hideModal();
    }));

    document.addEventListener("keydown", (event) => {
      if (!activeModal) return;
      if (event.key === "Escape") {
        event.preventDefault();
        hideModal();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...activeModal.querySelectorAll(focusableSelector)].filter((element) => !element.hidden && element.getClientRects().length);
      if (!focusable.length) {
        event.preventDefault();
        activeModal.querySelector(".legal-dialog")?.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeIndex = focusable.indexOf(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || activeIndex === -1)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || activeIndex === -1)) {
        event.preventDefault();
        first.focus();
      }
    });

    const cookieForm = document.querySelector("[data-cookie-form]");
    const cookieStatus = document.querySelector("[data-cookie-status]");
    const cookieBannerStatus = document.querySelector("[data-cookie-banner-status]");
    const savePreferences = (preferences, message) => {
      const value = { ...defaults, ...preferences, necessary: true, version: 1, updatedAt: new Date().toISOString() };
      if (!persistPreferences(value)) {
        const errorMessage = "Não foi possível salvar sua escolha. Permita cookies ou armazenamento local para este site e tente novamente.";
        if (cookieStatus) cookieStatus.textContent = errorMessage;
        if (cookieBannerStatus) cookieBannerStatus.textContent = errorMessage;
        return;
      }
      if (cookieStatus) cookieStatus.textContent = message;
      if (cookieBannerStatus) cookieBannerStatus.textContent = "";
      hideCookieBanner();
      window.dispatchEvent(new CustomEvent("b0w:consent-updated", { detail: { ...value } }));
      try {
        activateConsentedScripts(value);
      } catch (error) {
        console.error("As preferências foram salvas, mas uma integração opcional não pôde ser iniciada.");
      }
    };

    cookieForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const preferences = { ...defaults };
      cookieForm.querySelectorAll("[data-cookie-category]").forEach((input) => {
        preferences[input.dataset.cookieCategory] = input.checked;
      });
      savePreferences(preferences, "Preferências salvas. Categorias opcionais permanecem sob seu controle.");
    });

    document.querySelector("[data-cookie-reject]")?.addEventListener("click", () => {
      const preferences = { ...defaults };
      cookieForm?.querySelectorAll("[data-cookie-category]").forEach((input) => { input.checked = false; });
      savePreferences(preferences, "Categorias opcionais recusadas.");
    });

    document.querySelector("[data-cookie-banner-reject]")?.addEventListener("click", () => {
      const preferences = { ...defaults };
      cookieForm?.querySelectorAll("[data-cookie-category]").forEach((input) => { input.checked = false; });
      savePreferences(preferences, "Categorias opcionais recusadas.");
    });

    document.querySelector("[data-cookie-accept-all]")?.addEventListener("click", () => {
      const preferences = { ...defaults, analytics: true, functional: true, marketing: true };
      cookieForm?.querySelectorAll("[data-cookie-category]").forEach((input) => { input.checked = true; });
      savePreferences(preferences, "Todas as categorias foram autorizadas.");
    });

    const initialPreferences = syncPreferenceControls();
    // Also register existing local-only choices as a persistent cookie.
    if (hasStoredPreferences()) persistPreferences(initialPreferences);
    activateConsentedScripts(initialPreferences);
    window.B0wConsent = Object.freeze({
      get: () => ({ ...readPreferences() }),
      has: (category) => Boolean(readPreferences()[category])
    });
    if (!hasStoredPreferences()) window.setTimeout(showCookieBanner, reduceMotion ? 100 : 2200);
  }

  function setupCanvas(canvas) {
    if (!canvas) return null; const context = canvas.getContext("2d"); const state = { width: 0, height: 0, dpr: Math.min(devicePixelRatio || 1, 1.5) };
    const resize = () => { const rect = canvas.getBoundingClientRect(); state.width = rect.width; state.height = rect.height; canvas.width = Math.round(rect.width * state.dpr); canvas.height = Math.round(rect.height * state.dpr); context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0); }; resize(); window.addEventListener("resize", resize); return { context, state };
  }

  function initParticles() {
    const canvas = document.querySelector(".particles-canvas"); if (!canvas || reduceMotion) return; const setup = setupCanvas(canvas); if (!setup) return; const { context, state } = setup; let particles = [], visible = false, frame = 0; const pointer = { x: -999, y: -999 };
    const syncLoop = () => { cancelAnimationFrame(frame); frame = 0; if (visible && !document.hidden) frame = requestAnimationFrame(draw); };
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncLoop(); }).observe(canvas.parentElement);
    document.addEventListener("visibilitychange", syncLoop);
    const build = () => { particles = Array.from({ length: Math.min(55, Math.max(24, Math.floor(state.width / 28))) }, () => ({ x: Math.random() * state.width, y: Math.random() * state.height, vx: (Math.random() - .5) * .07, vy: (Math.random() - .5) * .07, radius: Math.random() * .8 + .3, alpha: Math.random() * .22 + .06 })); }; build(); window.addEventListener("resize", build);
    canvas.parentElement.addEventListener("pointermove", (event) => { const rect = canvas.getBoundingClientRect(); pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; }, { passive: true });
    const draw = () => { context.clearRect(0, 0, state.width, state.height); particles.forEach((p) => { const dx = p.x - pointer.x, dy = p.y - pointer.y, distance = Math.hypot(dx, dy); if (distance < 100 && distance) { p.x += dx / distance * .07; p.y += dy / distance * .07; } p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = state.width; if (p.x > state.width) p.x = 0; if (p.y < 0) p.y = state.height; if (p.y > state.height) p.y = 0; context.beginPath(); context.arc(p.x, p.y, p.radius, 0, Math.PI * 2); context.fillStyle = `rgba(255,255,255,${p.alpha})`; context.fill(); }); frame = requestAnimationFrame(draw); };
  }
});
