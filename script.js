// Preserve links shared before the four-page migration.
(() => {
  if (!/(?:\/|\/index\.html)$/.test(window.location.pathname)) return;
  const targets = {
    "start-top": "#main",
    top: "#main",
    "story-title": "#story",
    "about-us": "about.html",
    services: "support.html#services",
    target: "support.html#for-you",
    impact: "about.html",
    support: "support.html#housing-first",
    process: "contact.html#flow",
    faq: "contact.html#faq",
    about: "about.html#company",
    contact: "contact.html",
    "contact-form": "contact.html#contact-form",
  };
  const target = targets[window.location.hash.slice(1)];
  if (target) window.location.replace(target);
})();

(() => {
  "use strict";
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  const dialog = document.querySelector("#site-menu");
  const toggle = document.querySelector("[data-menu-open]");
  let menuScrollY = null;
  function unlockMenuScroll() {
    if (menuScrollY === null) return;
    const y = menuScrollY;
    menuScrollY = null;
    document.body.classList.remove("menu-open");
    document.body.style.removeProperty("--menu-scroll-top");
    window.scrollTo({ left: 0, top: y, behavior: "instant" });
    document.documentElement.classList.remove("menu-open");
    toggle?.setAttribute("aria-expanded", "false");
  }
  function closeMenu() {
    if (dialog?.open) dialog.close();
    // Restore before a menu anchor performs its native navigation.
    unlockMenuScroll();
  }
  if (dialog && toggle) {
    toggle.addEventListener("click", () => {
      if (dialog.open) return;
      menuScrollY = Math.max(0, window.scrollY);
      document.body.style.setProperty("--menu-scroll-top", -menuScrollY + "px");
      document.documentElement.classList.add("menu-open");
      document.body.classList.add("menu-open");
      dialog.showModal();
      toggle.setAttribute("aria-expanded", "true");
    });
    dialog.querySelector("[data-menu-close]").addEventListener("click", closeMenu);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog && event.clientX < dialog.getBoundingClientRect().left) closeMenu();
      if (event.target.closest("a")) closeMenu();
    });
    dialog.addEventListener("close", unlockMenuScroll);
    window.addEventListener("pageshow", closeMenu);
  }

  const reveals = [...document.querySelectorAll("[data-reveal]")];
  let observer;
  if (!media.matches && "IntersectionObserver" in window) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -20px 0px" }
    );
    reveals.forEach((el) => {
      el.classList.add("reveal-ready");
      observer.observe(el);
    });
  }

  const story = document.querySelector("[data-story]");
  const stage = story?.querySelector(".story-stage");
  const scenes = story ? [...story.querySelectorAll(".scene")] : [];
  const dots = story ? [...story.querySelectorAll("[data-scene-go]")] : [];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const smooth = (start, end, value) => {
    const t = clamp((value - start) / (end - start), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const sceneParts = scenes.map((scene) => ({
    photo: scene.querySelector("img"),
    copy: scene.querySelector(".scene-copy"),
    track: scene.querySelector(".scene-text-window"),
    trackHeight: 0,
    copyHeight: 0,
  }));
  let frame = 0;
  let headerHeight = 68;
  function syncDimensions() {
    headerHeight = document.querySelector(".site-header")?.getBoundingClientRect().height || 68;
    sceneParts.forEach((part) => {
      part.trackHeight = part.track.clientHeight;
      part.copyHeight = part.copy.offsetHeight;
    });
    requestMotion();
  }
  function drawStory() {
    frame = 0;
    if (menuScrollY !== null) return;
    if (!story || !stage || media.matches) return;
    const rect = story.getBoundingClientRect();
    const distance = Math.max(1, story.offsetHeight - stage.offsetHeight);
    const progress = clamp((headerHeight - rect.top) / distance, 0, 1);
    const pos = progress * 3;
    const cross1 = smooth(0.84, 1.16, pos);
    const cross2 = smooth(1.84, 2.16, pos);
    // Keep the previous photo opaque beneath the incoming one: no dark flash.
    const weights = [1, cross1, cross2];
    const current = pos < 1 ? 0 : pos < 2 ? 1 : 2;
    sceneParts.forEach((part, i) => {
      const local = clamp(pos - i, 0, 1);
      part.photo.style.opacity = weights[i].toFixed(3);
      part.photo.style.zIndex = String(i + 1);
      part.photo.style.transform =
        "translate3d(0," + ((0.5 - local) * 2.4).toFixed(3) + "%,0) scale(" + (1.055 - local * 0.02).toFixed(4) + ")";
      // Each message enters below the frame and leaves above it, including
      // the last one. Text stays above the photos throughout the handoff.
      const start = part.trackHeight + 16;
      const end = -part.copyHeight - 16;
      const y = start + (end - start) * local;
      part.copy.style.transform = "translate3d(0," + y.toFixed(1) + "px,0)";
    });
    dots.forEach((dot, i) => dot.setAttribute("aria-current", String(i === current)));
  }
  function requestMotion() {
    if (!frame && story && !media.matches) frame = requestAnimationFrame(drawStory);
  }
  function configureMotion() {
    if (story) {
      story.classList.toggle("motion-enabled", !media.matches);
      if (media.matches)
        scenes.forEach((scene) => {
          scene.style.opacity = "";
          scene.style.zIndex = "";
          scene.querySelector("img").style.transform = "";
          scene.querySelector("img").style.opacity = "";
          scene.querySelector("img").style.zIndex = "";
          scene.querySelector(".scene-copy").style.transform = "";
          scene.querySelector(".scene-copy").style.opacity = "";
        });
      else syncDimensions();
    }
    if (media.matches) reveals.forEach((el) => el.classList.add("is-visible"));
  }
  dots.forEach((dot) =>
    dot.addEventListener("click", () => {
      const i = Number(dot.dataset.sceneGo);
      const distance = Math.max(0, story.offsetHeight - stage.offsetHeight);
      const y =
        window.scrollY + story.getBoundingClientRect().top - headerHeight + distance * ((i + 0.5) / scenes.length);
      window.scrollTo({ top: y, behavior: media.matches ? "auto" : "smooth" });
    })
  );
  configureMotion();
  window.addEventListener("scroll", requestMotion, { passive: true });
  window.addEventListener("resize", syncDimensions, { passive: true });
  window.addEventListener("pageshow", syncDimensions);
  document.fonts?.ready.then(syncDimensions);
  if (media.addEventListener) media.addEventListener("change", configureMotion);
  else media.addListener(configureMotion);

  const form = document.querySelector("#contact-form");
  if (form)
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      const kind = String(data.get("type") || "").trim();
      const message = String(data.get("message") || "").trim();
      const messageField = form.querySelector('[name="message"]');
      if (!message) {
        messageField.setCustomValidity("ご相談内容を入力してください。");
        messageField.reportValidity();
        return;
      }
      const name = String(data.get("name") || "").trim() || "未記入";
      const email = String(data.get("email") || "").trim() || "未記入";
      const subject = "[ルミライズ無料相談] " + kind;
      const body = [
        "株式会社ルミライズ 御中",
        "",
        "相談種別: " + kind,
        "お名前: " + name,
        "メールアドレス: " + email,
        "",
        "相談内容:",
        message,
      ].join("\n");
      document.querySelector("#form-status").textContent =
        "メールアプリで宛先と内容をご確認のうえ、送信してください。開かない場合は、下のメールアドレスまたはお電話からご相談ください。";
      window.location.href =
        "mailto:info@lumirize.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  form?.querySelector('[name="message"]').addEventListener("input", (event) => event.target.setCustomValidity(""));
})();
