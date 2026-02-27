(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#site-nav");
  const rawToggle = document.querySelector("#raw-toggle");
  const story = document.querySelector("#story");
  const heroParallaxLayer = document.querySelector(".hero__bg-parallax");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;
  const parallaxState = {
    current: 0,
    target: 0,
    rafId: 0
  };

  const setHeaderOffset = () => {
    const headerHeight = header ? header.offsetHeight : 78;
    root.style.setProperty("--header-offset", `${headerHeight + 14}px`);
  };

  const RAW_MODE_STORAGE_KEY = "lumirize.rawMode";
  const syncRawMode = (enabled) => {
    body.classList.toggle("is-raw", enabled);
    if (rawToggle) {
      rawToggle.classList.toggle("is-active", enabled);
      rawToggle.setAttribute("aria-pressed", String(enabled));
    }
  };

  if (rawToggle) {
    let initialRawMode = false;
    try {
      initialRawMode = window.localStorage.getItem(RAW_MODE_STORAGE_KEY) === "1";
    } catch (_error) {
      initialRawMode = false;
    }
    syncRawMode(initialRawMode);

    rawToggle.addEventListener("click", () => {
      const nextRawMode = !body.classList.contains("is-raw");
      syncRawMode(nextRawMode);
      try {
        window.localStorage.setItem(RAW_MODE_STORAGE_KEY, nextRawMode ? "1" : "0");
      } catch (_error) {
        // ストレージ不可環境では永続化せず継続
      }
    });
  }

  const setParallaxPosition = (value) => {
    if (heroParallaxLayer) {
      heroParallaxLayer.style.transform = `translate3d(0, ${value}px, 0)`;
    }
  };

  const renderParallax = () => {
    if (reducedMotion) {
      parallaxState.current = 0;
      parallaxState.target = 0;
      parallaxState.rafId = 0;
      setParallaxPosition(0);
      return;
    }

    parallaxState.current += (parallaxState.target - parallaxState.current) * 0.16;
    setParallaxPosition(parallaxState.current);

    if (Math.abs(parallaxState.target - parallaxState.current) > 0.04) {
      parallaxState.rafId = window.requestAnimationFrame(renderParallax);
    } else {
      parallaxState.current = parallaxState.target;
      setParallaxPosition(parallaxState.current);
      parallaxState.rafId = 0;
    }
  };

  const scheduleParallax = () => {
    if (reducedMotion) {
      if (parallaxState.rafId) {
        window.cancelAnimationFrame(parallaxState.rafId);
        parallaxState.rafId = 0;
      }
      setParallaxPosition(0);
      return;
    }

    const maxShift = window.innerHeight * 0.02;
    parallaxState.target = Math.min(maxShift, window.scrollY * 0.01);
    if (!parallaxState.rafId) {
      parallaxState.rafId = window.requestAnimationFrame(renderParallax);
    }
  };

  const heroRevealTargets = Array.from(document.querySelectorAll(".hero-reveal"));
  let heroRevealPlayed = false;
  const runHeroReveal = () => {
    if (heroRevealPlayed || heroRevealTargets.length === 0) {
      return;
    }
    heroRevealPlayed = true;

    if (reducedMotion) {
      heroRevealTargets.forEach((el) => {
        el.classList.add("is-in");
      });
      return;
    }

    body.classList.add("hero-motion-ready");
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        heroRevealTargets.forEach((el) => {
          el.classList.add("is-in");
        });
      });
    });
  };

  const syncMotionPreference = (event) => {
    reducedMotion = event.matches;
    if (reducedMotion) {
      document.querySelectorAll(".reveal").forEach((el) => {
        el.classList.add("is-visible");
      });
      heroRevealTargets.forEach((el) => {
        el.classList.add("is-in");
      });
      scheduleParallax();
      return;
    }

    scheduleParallax();
  };

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", syncMotionPreference);
  } else if (typeof motionQuery.addListener === "function") {
    motionQuery.addListener(syncMotionPreference);
  }

  document.addEventListener("DOMContentLoaded", runHeroReveal, { once: true });
  if (document.readyState !== "loading") {
    runHeroReveal();
  }

  setHeaderOffset();
  window.addEventListener("resize", setHeaderOffset);
  window.addEventListener("resize", scheduleParallax);
  window.addEventListener("scroll", scheduleParallax, { passive: true });
  scheduleParallax();

  const closeMenu = () => {
    if (!menuToggle || !nav) {
      return;
    }
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "メニューを開く");
    menuToggle.classList.remove("is-open");
    nav.classList.remove("is-open");
    body.classList.remove("menu-open");
  };

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const nextExpanded = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(nextExpanded));
      menuToggle.setAttribute("aria-label", nextExpanded ? "メニューを閉じる" : "メニューを開く");
      menuToggle.classList.toggle("is-open", nextExpanded);
      nav.classList.toggle("is-open", nextExpanded);
      body.classList.toggle("menu-open", nextExpanded);
    });

    nav.addEventListener("click", (event) => {
      if (event.target === nav) {
        closeMenu();
        return;
      }
      const link = event.target.closest("a");
      if (link) {
        closeMenu();
      }
    });

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) {
        return;
      }
      const target = event.target;
      if (!nav.contains(target) && !menuToggle.contains(target)) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    const desktopQuery = window.matchMedia("(min-width: 900px)");
    const onDesktop = (event) => {
      if (event.matches) {
        closeMenu();
      }
    };

    if (typeof desktopQuery.addEventListener === "function") {
      desktopQuery.addEventListener("change", onDesktop);
    } else if (typeof desktopQuery.addListener === "function") {
      desktopQuery.addListener(onDesktop);
    }

    // iOSのページ復帰・再読込で状態が残るケースを防ぐ
    window.addEventListener("pageshow", () => {
      closeMenu();
    });
  }

  closeMenu();

  const scrollToAnchor = (id) => {
    if (!id || id === "#") {
      return;
    }
    const target = document.querySelector(id);
    if (!target) {
      return;
    }

    const headerHeight = header ? header.offsetHeight : 78;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 14;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: reducedMotion ? "auto" : "smooth"
    });
  };

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) {
      return;
    }
    const href = anchor.getAttribute("href");
    if (!href || href === "#") {
      return;
    }
    const target = document.querySelector(href);
    if (!target) {
      return;
    }
    event.preventDefault();
    closeMenu();
    scrollToAnchor(href);
  });

  const revealTargets = Array.from(document.querySelectorAll(".reveal"));
  revealTargets.forEach((el) => {
    el.classList.add("is-visible");
  });

  if (story) {
    const sceneVisual = story.querySelector(".cinematic__visual");
    const sceneImages = Array.from(document.querySelectorAll(".cinematic__img"));
    const sceneBlocks = Array.from(document.querySelectorAll(".cinematic__block"));
    let currentScene = 1;
    let lastProgress = -1;
    let cinematicRafId = 0;
    let cinematicNeedsUpdate = false;

    const sceneByProgress = (progress) => {
      if (progress < 0.333) {
        return 1;
      }
      if (progress < 0.666) {
        return 2;
      }
      return 3;
    };

    const getStoryProgress = () => {
      const rect = story.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const storyTop = window.scrollY + rect.top;
      const storyBottom = window.scrollY + rect.bottom;
      const start = storyTop - viewportHeight * 0.2;
      const end = storyBottom - viewportHeight * 0.8;
      const span = Math.max(1, end - start);
      return Math.min(1, Math.max(0, (window.scrollY - start) / span));
    };

    function activateScene(sceneId, force = false) {
      if (!force && sceneId === currentScene) {
        return;
      }

      sceneImages.forEach((img) => {
        img.classList.toggle("is-active", Number(img.dataset.scene) === sceneId);
      });

      sceneBlocks.forEach((block) => {
        const active = Number(block.dataset.scene) === sceneId;
        block.classList.toggle("is-active", active);
        block.setAttribute("aria-current", active ? "true" : "false");
      });

      if (sceneVisual) {
        sceneVisual.setAttribute("data-active-scene", String(sceneId));
      }
      currentScene = sceneId;
    }

    const updateSceneByProgress = () => {
      cinematicRafId = 0;
      if (!cinematicNeedsUpdate) {
        return;
      }
      cinematicNeedsUpdate = false;

      const progress = getStoryProgress();
      if (Math.abs(progress - lastProgress) < 0.005 && !reducedMotion) {
        return;
      }
      lastProgress = progress;

      const targetScene = sceneByProgress(progress);
      if (Math.abs(targetScene - currentScene) > 1) {
        const nextScene = targetScene > currentScene ? currentScene + 1 : currentScene - 1;
        activateScene(nextScene);
        cinematicNeedsUpdate = true;
        if (!cinematicRafId) {
          cinematicRafId = window.requestAnimationFrame(updateSceneByProgress);
        }
        return;
      }
      activateScene(targetScene);
    };

    const requestSceneUpdate = () => {
      cinematicNeedsUpdate = true;
      if (cinematicRafId) {
        return;
      }
      cinematicRafId = window.requestAnimationFrame(updateSceneByProgress);
    };

    const initialScene = sceneImages.find((img) => img.classList.contains("is-active"));
    const initialSceneId = initialScene ? Number(initialScene.dataset.scene) : 1;
    activateScene(initialSceneId, true);
    requestSceneUpdate();

    window.addEventListener("scroll", requestSceneUpdate, { passive: true });
    window.addEventListener("resize", requestSceneUpdate);
    window.addEventListener("orientationchange", requestSceneUpdate, { passive: true });
  }

  const form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const name = String(formData.get("name") || "").trim();
      const email = String(formData.get("email") || "").trim();
      const type = String(formData.get("type") || "").trim();
      const message = String(formData.get("message") || "").trim();

      if (!type || !message) {
        return;
      }

      const subject = encodeURIComponent(`[ルミライズ無料相談] ${type}`);
      const body = encodeURIComponent(
        [
          "株式会社ルミライズ 御中",
          "",
          `相談種別: ${type}`,
          `お名前: ${name || "未記入"}`,
          `メール: ${email || "未記入"}`,
          "",
          "相談内容:",
          message
        ].join("\n")
      );

      window.location.href = `mailto:info@lumirize.com?subject=${subject}&body=${body}`;
    });
  }
})();
