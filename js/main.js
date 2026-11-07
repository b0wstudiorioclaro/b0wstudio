document.addEventListener("DOMContentLoaded", async () => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  const CASES_READY = false; // troque para true quando as páginas /cases/<slug>.html existirem

  const plugins = [window.DrawSVGPlugin, window.MorphSVGPlugin, window.ScrollTrigger, window.ScrollToPlugin, window.SplitText, window.TextPlugin].filter(Boolean);
  if (hasGSAP && plugins.length) window.gsap.registerPlugin(...plugins);

  initScrollbar();
  initNavbar();
  initMobileMenu();
  initServices();
  initTeam();
  initBrandJourney();
  initMagnetic();
  initCaseTag();
  initDotField();
  initParticles();
  initContactForm();
  initLegalAndCookieModals();
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
  const initialTarget = window.location.hash ? document.querySelector(window.location.hash) : null;
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
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("load", requestUpdate);
    window.ScrollTrigger?.addEventListener("refresh", requestUpdate);
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(requestUpdate);
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
    const update = () => {
      const navHeight = nav.getBoundingClientRect().height || 78;
      const probe = Math.min(window.innerHeight - 1, Math.max(1, navHeight * .5));
      const current = [...sections].reverse().find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top <= probe && rect.bottom > probe;
      });
      nav.classList.toggle("is-dark", current?.dataset.theme !== "light");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    document.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || href === "#" || !document.querySelector(href)) return;
      event.preventDefault();
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
    if (hasGSAP && !reduceMotion) {
      timeline = window.gsap.timeline({ paused: true, defaults: { ease: "power4.out" } })
        .set(menu, { visibility: "visible", pointerEvents: "auto" })
        .to(menu, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: .75 })
        .from(links, { yPercent: 105, opacity: 0, stagger: .045, duration: .65 }, "-=.4")
        .from(".mobile-menu-foot", { y: 18, opacity: 0, duration: .5 }, "-=.45");
    }
    const show = () => {
      menu.classList.add("is-open"); menu.setAttribute("aria-hidden", "false"); open.setAttribute("aria-expanded", "true"); document.body.classList.add("menu-open");
      if (timeline) { window.gsap.set(menu, { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" }); timeline.restart(); }
      close.focus({ preventScroll: true });
    };
    const hide = () => {
      const done = () => { menu.classList.remove("is-open"); menu.setAttribute("aria-hidden", "true"); open.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-open"); };
      if (timeline) timeline.reverse().eventCallback("onReverseComplete", done); else done();
    };
    open.addEventListener("click", show); close.addEventListener("click", hide); [...links, ...homeLinks].forEach((link) => link.addEventListener("click", hide));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && menu.classList.contains("is-open")) hide(); });
  }

  function initHero() {
    const hero = document.querySelector(".bow-hero");
    if (!hero || !hasGSAP || reduceMotion) return null;
    const g = window.gsap;
    const lines = [...hero.querySelectorAll(".bh-title > span")];
    const chars = window.SplitText ? lines.flatMap((line) => new window.SplitText(line, { type: "chars", charsClass: "bh-char" }).chars) : lines;

    g.set(".navbar", { y: -20, opacity: 0 });
    g.set(chars, { yPercent: 115, rotationX: -70, opacity: 0, filter: "blur(14px)", transformOrigin: "50% 100%" });
    g.set(".bh-lead", { y: 22, opacity: 0 });
    g.set(".bh-actions > *", { y: 20, opacity: 0 });
    g.set("#hero-3d", { opacity: 0, scale: .94 });

    const timeline = g.timeline({ paused: true, defaults: { ease: "power4.out" } })
      .to(".navbar", { y: 0, opacity: 1, duration: .55 }, 0)
      .to("#hero-3d", { opacity: 1, scale: 1, duration: 1.4, ease: "power3.out" }, .1)
      .to(chars, { yPercent: 0, rotationX: 0, opacity: 1, filter: "blur(0px)", duration: .9, stagger: .03, onComplete: () => g.set(chars, { clearProps: "transform,opacity,filter" }) }, .25)
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
      window.clearTimeout(soonTimer);
      soonTimer = window.setTimeout(() => { label.textContent = text; }, 1500);
    };
    cards.forEach((card) => {
      card.addEventListener("click", () => open(card));
      card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(card); } });
    });
    if (!tag || isTouch || !window.matchMedia("(hover: hover)").matches) return;

    let mx = -200, my = -200, x = -200, y = -200, active = false, frame = 0;
    const dark = (card) => card.matches(".service-card-primary,.service-card-social,.service-card-performance");
    const tick = () => {
      x += (mx - x) * .22; y += (my - y) * .22;
      tag.style.transform = `translate3d(${x}px,${y}px,0)`;
      frame = active || Math.abs(mx - x) > .5 || Math.abs(my - y) > .5 ? window.requestAnimationFrame(tick) : 0;
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

    window.gsap.utils.toArray(selector).forEach((element) => {
      const split = window.SplitText && !element.matches(".text-link") ? new window.SplitText(element, { type: "words", wordsClass: "blur-word" }) : null;
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
    });
  }

  function initServices() {
    const cards = [...document.querySelectorAll(".service-card")];
    cards.forEach((card) => card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
      card.style.setProperty("--spot-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
    }, { passive: true }));

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

      window.addEventListener("pagehide", () => {
        window.clearInterval(cycleTimer);
        visibilityObserver?.disconnect();
      }, { once: true });
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

  function initBrandPosterTabs() {
    const section = document.querySelector(".brand-poster");
    const tabs = [...(section?.querySelectorAll(".brand-poster-tabs li") || [])];
    if (!section || !tabs.length || isTouch) return;

    const focusCard = document.createElement("span");
    focusCard.className = "brand-poster-tab-focus-card";
    focusCard.setAttribute("aria-hidden", "true");
    document.body.appendChild(focusCard);

    let focusedTab = null;
    let focusFrame = 0;

    const setFocusOrigin = (tab) => {
      const label = tab.querySelector("span");
      if (!label) return;
      const rect = label.getBoundingClientRect();
      focusCard.textContent = label.textContent;
      focusCard.style.setProperty("--tab-origin-x", `${rect.left + rect.width / 2}px`);
      focusCard.style.setProperty("--tab-origin-y", `${rect.top + rect.height / 2}px`);
      focusCard.style.setProperty("--tab-origin-width", `${rect.width}px`);
      focusCard.style.setProperty("--tab-origin-height", `${rect.height}px`);
    };

    const focusTab = (tab) => {
      window.cancelAnimationFrame(focusFrame);
      focusedTab = tab;
      tabs.forEach((item) => item.classList.toggle("is-focused", item === tab));
      setFocusOrigin(tab);
      focusCard.classList.remove("is-visible");
      focusCard.getBoundingClientRect();
      section.classList.add("is-tab-focused");
      focusFrame = window.requestAnimationFrame(() => focusCard.classList.add("is-visible"));
    };

    const releaseTab = (tab) => {
      if (focusedTab !== tab) return;
      window.cancelAnimationFrame(focusFrame);
      focusedTab = null;
      tab.classList.remove("is-focused");
      section.classList.remove("is-tab-focused");
      focusCard.classList.remove("is-visible");
    };

    tabs.forEach((tab) => {
      tab.addEventListener("mouseenter", () => focusTab(tab));
      tab.addEventListener("mouseleave", () => releaseTab(tab));
    });

    window.addEventListener("resize", () => {
      if (focusedTab) setFocusOrigin(focusedTab);
    });
  }

  function initCursor() {
    if (isTouch || !window.matchMedia("(hover: hover)").matches) return;
    const cursor = document.querySelector(".cursor"); const label = cursor?.querySelector("span"); if (!cursor || !label) return;
    let mx = -100, my = -100, x = -100, y = -100;
    window.addEventListener("mousemove", (event) => { mx = event.clientX; my = event.clientY; }, { passive: true });
    const render = () => { x += (mx - x) * .18; y += (my - y) * .18; cursor.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`; requestAnimationFrame(render); }; render();
    document.querySelectorAll("[data-cursor]").forEach((item) => { item.addEventListener("mouseenter", () => { label.textContent = item.dataset.cursor; cursor.classList.add("is-view"); }); item.addEventListener("mouseleave", () => cursor.classList.remove("is-view")); });
    document.querySelectorAll("a,button").forEach((item) => { item.addEventListener("mouseenter", () => cursor.classList.add("is-button")); item.addEventListener("mouseleave", () => cursor.classList.remove("is-button")); });
  }

  function initMagnetic() {
    if (isTouch || reduceMotion || !hasGSAP) return;
    document.querySelectorAll(".magnetic").forEach((button) => { button.addEventListener("mousemove", (event) => { const rect = button.getBoundingClientRect(); window.gsap.to(button, { x: (event.clientX - rect.left - rect.width / 2) * .1, y: (event.clientY - rect.top - rect.height / 2) * .14, duration: .35, ease: "power3.out" }); }); button.addEventListener("mouseleave", () => window.gsap.to(button, { x: 0, y: 0, duration: .6, ease: "power3.out" })); });
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
    const successMessage = "Projeto enviado com sucesso para a B0w Studio!";

    const resetSubmitState = () => {
      if (!submitButton?.classList.contains("is-success")) return;
      submitButton.classList.remove("is-success");
      submitButton.disabled = false;
      submitButton.removeAttribute("aria-label");
      if (submitLabel) submitLabel.textContent = "Enviar projeto";
      if (status) {
        status.textContent = "";
        status.className = "contact-form-status";
      }
    };

    const validateServices = (showError = false) => {
      const isValid = serviceInputs.some((input) => input.checked);
      servicesFieldset?.classList.toggle("has-error", showError && !isValid);
      if (servicesError) servicesError.hidden = !showError || isValid;
      return isValid;
    };

    serviceInputs.forEach((input) => input.addEventListener("change", () => validateServices(true)));
    form.addEventListener("input", resetSubmitState);

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (submitButton.disabled) return;
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      if (!validateServices(true)) {
        serviceInputs[0]?.focus();
        return;
      }

      const formData = new FormData(form);
      const selectedServices = serviceInputs.filter((input) => input.checked).map((input) => input.value);
      const company = formData.get("Empresa").trim();
      const email = formData.get("email").trim();
      const message = formData.get("Sobre o negócio").trim();
      formData.set("Nome", formData.get("Nome").trim());
      formData.set("Empresa", company);
      formData.set("email", email);
      formData.set("_replyto", email);
      formData.set("_subject", `B0w Studio | Novo projeto — ${company.replace(/[\r\n]+/g, " ").slice(0, 100)}`);
      // Keep the email easy to scan: contact, services, then the project brief.
      formData.delete("Serviços[]");
      formData.delete("Sobre o negócio");
      formData.append("Serviços desejados", selectedServices.join(", "));
      formData.append("Sobre o negócio", message);
      submitButton.disabled = true;
      submitButton.classList.remove("is-success");
      submitButton.classList.add("is-loading");
      submitButton.setAttribute("aria-busy", "true");
      submitButton.setAttribute("aria-label", "Enviando projeto");
      submitLabel.textContent = "Enviando projeto";
      status.textContent = "";
      status.className = "contact-form-status";

      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 30000);
      try {
        const endpoint = form.action.replace("https://formsubmit.co/", "https://formsubmit.co/ajax/");
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: formData,
          signal: controller.signal
        });
        const result = await response.json();
        if (!response.ok || (result?.success !== true && result?.success !== "true")) throw new Error("Falha no envio");

        form.reset();
        validateServices(false);
        submitButton.classList.remove("is-loading");
        submitButton.classList.add("is-success");
        submitButton.removeAttribute("aria-busy");
        submitButton.setAttribute("aria-label", successMessage);
        submitLabel.textContent = successMessage;
        status.textContent = successMessage;
        status.classList.add("is-success", "is-visually-hidden");
      } catch (error) {
        submitButton.classList.remove("is-loading");
        submitButton.disabled = false;
        submitButton.removeAttribute("aria-busy");
        submitButton.removeAttribute("aria-label");
        submitLabel.textContent = "Tentar novamente";
        status.textContent = error.name === "AbortError"
          ? "O envio demorou mais que o esperado e não conseguimos confirmar o recebimento. Seus dados continuam aqui. Tente novamente ou fale pelo WhatsApp."
          : "Não foi possível confirmar o envio. Seus dados continuam aqui. Tente novamente ou fale pelo WhatsApp.";
        status.classList.add("is-error");
      } finally {
        window.clearTimeout(timeout);
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

    const parsePreferences = (raw) => {
      try {
        const saved = JSON.parse(raw || "null");
        return saved?.version === 1 && ["analytics", "functional", "marketing"].every((category) => typeof saved[category] === "boolean")
          ? { ...defaults, ...saved, necessary: true } : null;
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
        document.cookie = `${storageKey}=${encodeURIComponent(serialized)}; Max-Age=15552000; Path=/; SameSite=Lax${secure}`;
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
      window.requestAnimationFrame(() => {
        modal.classList.add("is-open");
        modal.querySelector(".legal-dialog")?.focus({ preventScroll: true });
      });
    };

    const hideModal = () => {
      if (!activeModal) return;
      const modal = activeModal;
      activeModal = null;
      modal.classList.remove("is-open");
      const finish = () => {
        modal.hidden = true;
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
        console.error("As preferências foram salvas, mas uma integração opcional não pôde ser iniciada.", error);
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

  function initDotField() {
    const canvas = document.querySelector(".dot-field"); if (!canvas || reduceMotion) return; const setup = setupCanvas(canvas); if (!setup) return; const { context, state } = setup; const mouse = { x: -999, y: -999 }; let visible = true;
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas.parentElement);
    canvas.parentElement.addEventListener("pointermove", (event) => { mouse.x = event.clientX; mouse.y = event.clientY; }, { passive: true }); canvas.parentElement.addEventListener("pointerleave", () => { mouse.x = -999; mouse.y = -999; });
    const draw = () => { if (visible && !document.hidden) { context.clearRect(0, 0, state.width, state.height); const gap = state.width < 600 ? 27 : 32; for (let py = gap; py < state.height; py += gap) for (let px = gap; px < state.width; px += gap) { const dx = px - mouse.x, dy = py - mouse.y, distance = Math.hypot(dx, dy), influence = Math.max(0, 1 - distance / 210), shift = influence * 11; context.beginPath(); context.arc(px + (distance ? dx / distance : 0) * shift, py + (distance ? dy / distance : 0) * shift, .72 + influence * 1.35, 0, Math.PI * 2); context.fillStyle = `rgba(255,255,255,${.16 + influence * .42})`; context.fill(); } } requestAnimationFrame(draw); }; draw();
  }

  function initParticles() {
    const canvas = document.querySelector(".particles-canvas"); if (!canvas || reduceMotion) return; const setup = setupCanvas(canvas); if (!setup) return; const { context, state } = setup; let particles = [], visible = false; const pointer = { x: -999, y: -999 };
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(canvas.parentElement);
    const build = () => { particles = Array.from({ length: Math.min(55, Math.max(24, Math.floor(state.width / 28))) }, () => ({ x: Math.random() * state.width, y: Math.random() * state.height, vx: (Math.random() - .5) * .07, vy: (Math.random() - .5) * .07, radius: Math.random() * .8 + .3, alpha: Math.random() * .22 + .06 })); }; build(); window.addEventListener("resize", build);
    canvas.parentElement.addEventListener("pointermove", (event) => { const rect = canvas.getBoundingClientRect(); pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top; }, { passive: true });
    const draw = () => { if (visible && !document.hidden) { context.clearRect(0, 0, state.width, state.height); particles.forEach((p) => { const dx = p.x - pointer.x, dy = p.y - pointer.y, distance = Math.hypot(dx, dy); if (distance < 100 && distance) { p.x += dx / distance * .07; p.y += dy / distance * .07; } p.x += p.vx; p.y += p.vy; if (p.x < 0) p.x = state.width; if (p.x > state.width) p.x = 0; if (p.y < 0) p.y = state.height; if (p.y > state.height) p.y = 0; context.beginPath(); context.arc(p.x, p.y, p.radius, 0, Math.PI * 2); context.fillStyle = `rgba(255,255,255,${p.alpha})`; context.fill(); }); } requestAnimationFrame(draw); }; draw();
  }
});
