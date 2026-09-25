// Preserve links shared before the four-page migration.
(() => {
  if (!/(?:\/|\/index\.html)$/.test(window.location.pathname)) {
    return;
  }
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
  if (target) {
    window.location.replace(target);
  }
})();

(() => {
  "use strict";
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let readingMode = false;
  try {
    readingMode = localStorage.getItem("lumirize-reading-mode") === "static";
  } catch {
    /* Private browsing can restrict preference storage. */
  }
  const motionPaused = () => media.matches || readingMode;
  const motionButtons = [...document.querySelectorAll("[data-motion-toggle]")];
  const dialog = document.querySelector("#site-menu");
  const toggle = document.querySelector("[data-menu-open]");
  let menuScrollY = null;
  function unlockMenuScroll() {
    if (menuScrollY === null) {
      return;
    }
    const y = menuScrollY;
    menuScrollY = null;
    document.body.classList.remove("menu-open");
    document.body.style.removeProperty("--menu-scroll-top");
    window.scrollTo({ left: 0, top: y, behavior: "instant" });
    document.documentElement.classList.remove("menu-open");
    toggle?.setAttribute("aria-expanded", "false");
  }
  function closeMenu() {
    if (dialog?.open) {
      dialog.close();
    }
    // Restore before a menu anchor performs its native navigation.
    unlockMenuScroll();
  }
  if (dialog && toggle) {
    toggle.addEventListener("click", () => {
      if (dialog.open) {
        return;
      }
      menuScrollY = Math.max(0, window.scrollY);
      document.body.style.setProperty("--menu-scroll-top", -menuScrollY + "px");
      document.documentElement.classList.add("menu-open");
      document.body.classList.add("menu-open");
      dialog.showModal();
      toggle.setAttribute("aria-expanded", "true");
    });
    dialog.querySelector("[data-menu-close]").addEventListener("click", closeMenu);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog && event.clientX < dialog.getBoundingClientRect().left) {
        closeMenu();
      }
      if (event.target.closest("a")) {
        closeMenu();
      }
    });
    dialog.addEventListener("close", unlockMenuScroll);
    window.addEventListener("pageshow", closeMenu);
  }

  const reveals = [...document.querySelectorAll("[data-reveal]")];
  let observer;
  if (!motionPaused() && "IntersectionObserver" in window) {
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
    if (menuScrollY !== null) {
      return;
    }
    if (!story || !stage || motionPaused()) {
      return;
    }
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
    if (!frame && story && !motionPaused()) {
      frame = requestAnimationFrame(drawStory);
    }
  }
  function configureMotion() {
    document.documentElement.classList.toggle("motion-paused", motionPaused());
    motionButtons.forEach((button) => {
      button.hidden = false;
      button.disabled = media.matches;
      button.setAttribute("aria-pressed", String(motionPaused()));
      button.querySelector("[data-motion-label]").textContent = media.matches
        ? "端末設定で静止表示中"
        : readingMode
          ? "動きのある表示に戻す"
          : "静止して読む";
    });
    if (story) {
      story.classList.toggle("motion-enabled", !motionPaused());
      if (motionPaused()) {
        scenes.forEach((scene) => {
          scene.style.opacity = "";
          scene.style.zIndex = "";
          scene.querySelector("img").style.transform = "";
          scene.querySelector("img").style.opacity = "";
          scene.querySelector("img").style.zIndex = "";
          scene.querySelector(".scene-copy").style.transform = "";
          scene.querySelector(".scene-copy").style.opacity = "";
        });
      } else {
        syncDimensions();
      }
    }
    if (motionPaused()) {
      reveals.forEach((el) => el.classList.add("is-visible"));
    }
  }
  dots.forEach((dot) =>
    dot.addEventListener("click", () => {
      const i = Number(dot.dataset.sceneGo);
      const distance = Math.max(0, story.offsetHeight - stage.offsetHeight);
      const y =
        window.scrollY + story.getBoundingClientRect().top - headerHeight + distance * ((i + 0.5) / scenes.length);
      window.scrollTo({ top: y, behavior: motionPaused() ? "auto" : "smooth" });
    })
  );
  motionButtons.forEach((button) =>
    button.addEventListener("click", () => {
      readingMode = !readingMode;
      try {
        localStorage.setItem("lumirize-reading-mode", readingMode ? "static" : "motion");
      } catch {
        /* The choice still works for this page. */
      }
      configureMotion();
      if (button.closest(".story-controls")) {
        motionButtons[0]?.focus({ preventScroll: true });
        document.querySelector(".story-intro")?.scrollIntoView({ behavior: "instant", block: "start" });
      }
    })
  );
  configureMotion();
  window.addEventListener("scroll", requestMotion, { passive: true });
  window.addEventListener("resize", syncDimensions, { passive: true });
  window.addEventListener("pageshow", syncDimensions);
  document.fonts?.ready.then(syncDimensions);
  if (media.addEventListener) {
    media.addEventListener("change", configureMotion);
  } else {
    media.addListener(configureMotion);
  }

  const form = document.querySelector("#contact-form");
  if (!form) {
    return;
  }
  const fields = form.querySelector("#form-fields");
  const emailField = form.querySelector('[name="email"]');
  const messageField = form.querySelector('[name="message"]');
  const status = form.querySelector("#form-status");
  const review = form.querySelector("#form-review");
  const submitButton = form.querySelector("#form-submit");
  const sendButton = form.querySelector("#form-send");
  const backButton = form.querySelector("#form-back");
  const methodNote = form.querySelector("#form-method-note");
  let online = false;
  let sending = false;
  let payload;
  let submissionId;

  function announce(message, state = "") {
    status.textContent = message;
    status.dataset.state = state;
  }
  function requestId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return "form-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2);
  }
  async function checkDelivery() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch("/api/contact", {
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      const config = response.ok ? await response.json() : null;
      online = config?.available === true;
    } catch {
      online = false;
    } finally {
      clearTimeout(timeout);
    }
    fields.disabled = false;
    emailField.required = online;
    form.querySelector('label[for="contact-email"] span').textContent = online ? "必須" : "任意";
    if (online) {
      form.querySelector("#form-title").textContent = "フォームで相談する";
      submitButton.textContent = "入力内容を確認する";
      methodNote.textContent = "内容を確認してから、このサイト内で送信できます。";
    }
  }
  checkDelivery();

  function readFields() {
    const data = new FormData(form);
    return {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      type: String(data.get("type") || "").trim(),
      message: String(data.get("message") || "").trim(),
      website: String(data.get("website") || ""),
      consent: data.get("consent") === "on",
    };
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (sending) {
      return;
    }
    const next = readFields();
    messageField.setCustomValidity(next.message ? "" : "ご相談内容を入力してください。");
    if (!form.reportValidity()) {
      return;
    }
    if (next.website) {
      announce("入力内容をご確認ください。", "error");
      return;
    }
    if (!online) {
      const body = [
        "株式会社ルミライズ 御中",
        "",
        "相談種別: " + next.type,
        "お名前: " + (next.name || "未記入"),
        "メールアドレス: " + (next.email || "未記入"),
        "個人情報の取り扱い: 同意済み",
        "",
        "相談内容:",
        next.message,
      ].join("\n");
      announce(
        "メールアプリで宛先と内容をご確認のうえ、送信してください。開かない場合は、下のメールアドレスまたはお電話からご相談ください。"
      );
      window.location.href =
        "mailto:info@lumirize.com?subject=" +
        encodeURIComponent("[ルミライズ初回相談] " + next.type) +
        "&body=" +
        encodeURIComponent(body);
      return;
    }
    // A retry of unchanged content uses the same key, including after an uncertain network response.
    if (JSON.stringify(next) !== JSON.stringify(payload)) {
      submissionId = requestId();
    }
    payload = next;
    const content = form.querySelector("#review-content");
    content.replaceChildren();
    [
      ["お名前", payload.name || "未記入"],
      ["メールアドレス", payload.email],
      ["相談種別", payload.type],
      ["ご相談内容", payload.message],
    ].forEach(([label, value]) => {
      const row = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      row.append(term, description);
      content.append(row);
    });
    fields.hidden = true;
    review.hidden = false;
    methodNote.hidden = true;
    announce("");
    form.querySelector("#review-title").focus();
  });
  messageField.addEventListener("input", () => messageField.setCustomValidity(""));
  backButton.addEventListener("click", () => {
    if (sending) {
      return;
    }
    review.hidden = true;
    fields.hidden = false;
    methodNote.hidden = false;
    submitButton.focus();
  });
  sendButton.addEventListener("click", async () => {
    if (sending || !payload) {
      return;
    }
    sending = true;
    sendButton.disabled = true;
    backButton.disabled = true;
    form.setAttribute("aria-busy", "true");
    sendButton.textContent = "送信しています…";
    announce("送信しています。この画面のままお待ちください。");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...payload, submissionId }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true) {
        throw new Error(
          response.status === 429
            ? "混み合っています。少し時間をおいて再度お試しください。"
            : "送信を完了できませんでした。入力内容は残っています。再度お試しいただくか、お電話・メールでご連絡ください。"
        );
      }
      review.hidden = true;
      form.reset();
      fields.disabled = true;
      payload = null;
      announce("送信を受け付けました。担当者が内容を確認します。受付番号：" + result.reference, "success");
      status.focus();
    } catch (error) {
      announce(
        error.name === "AbortError"
          ? "送信結果を確認できませんでした。内容を変えずに再度送信いただけます。お急ぎの場合はお電話ください。"
          : error.message.startsWith("送信") || error.message.startsWith("混み")
            ? error.message
            : "通信できませんでした。入力内容は残っています。接続を確認して再度お試しください。",
        "error"
      );
      status.focus();
    } finally {
      clearTimeout(timeout);
      sending = false;
      sendButton.disabled = false;
      backButton.disabled = false;
      sendButton.textContent = "この内容で送信する";
      form.removeAttribute("aria-busy");
    }
  });
})();
