(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#site-nav");
  const rawToggle = document.querySelector("#raw-toggle");
  const story = document.querySelector("#story");
  const heroParallaxLayer = document.querySelector(".hero__bg-parallax");
  const cinematicVisual = document.querySelector(".cinematic__visual");
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
    if (cinematicVisual) {
      cinematicVisual.style.transform = `translate3d(0, ${value}px, 0)`;
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

  const syncMotionPreference = (event) => {
    reducedMotion = event.matches;
    if (reducedMotion) {
      document.querySelectorAll(".reveal").forEach((el) => {
        el.classList.add("is-visible");
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
  if (!reducedMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );
    revealTargets.forEach((el) => revealObserver.observe(el));
  } else {
    revealTargets.forEach((el) => {
      el.classList.add("is-visible");
    });
  }

  if (story) {
    const sceneVisual = story.querySelector(".cinematic__visual");
    const sceneImages = Array.from(story.querySelectorAll(".cinematic__img[data-scene]"));
    const sceneBlocks = Array.from(story.querySelectorAll(".cinematic__block[data-scene]"));

    if (sceneImages.length > 0 && sceneBlocks.length > 0) {
      const sceneOrder = sceneBlocks.map((block) => block.dataset.scene).filter(Boolean);
      const normalizedSceneOrder = [
        sceneOrder[0] || "1",
        sceneOrder[1] || sceneOrder[0] || "1",
        sceneOrder[2] || sceneOrder[sceneOrder.length - 1] || sceneOrder[0] || "1"
      ];
      const scene1Id = normalizedSceneOrder[0];
      const scene2Id = normalizedSceneOrder[1];
      const scene3Id = normalizedSceneOrder[2];

      const SCENE1_RANGE_END = 0.45;
      const SCENE2_RANGE_END = 0.75;
      const S1_TO_S2 = 0.50;
      const S2_TO_S1 = 0.40;
      const S2_TO_S3 = 0.80;
      const S3_TO_S2 = 0.70;
      const MIN_SCENE_HOLD_MS = 1000;

      let activeSceneId = scene1Id;
      let lastSceneActivatedAt = window.performance.now();

      const activateScene = (sceneId, force = false) => {
        if (!force && sceneId === activeSceneId) {
          return;
        }
        activeSceneId = sceneId;
        lastSceneActivatedAt = window.performance.now();
        if (sceneVisual) {
          sceneVisual.setAttribute("data-active-scene", sceneId);
        }
        sceneImages.forEach((image) => {
          image.classList.toggle("is-active", image.dataset.scene === sceneId);
        });
        sceneBlocks.forEach((block) => {
          const active = block.dataset.scene === sceneId;
          block.classList.toggle("is-active", active);
          block.setAttribute("aria-current", active ? "true" : "false");
        });
      };

      const sceneByProgress = (progress) => {
        if (progress < SCENE1_RANGE_END) {
          return scene1Id;
        }
        if (progress < SCENE2_RANGE_END) {
          return scene2Id;
        }
        return scene3Id;
      };

      const sceneByHysteresis = (progress) => {
        if (activeSceneId === scene1Id) {
          return progress > S1_TO_S2 ? scene2Id : scene1Id;
        }
        if (activeSceneId === scene2Id) {
          if (progress < S2_TO_S1) {
            return scene1Id;
          }
          if (progress > S2_TO_S3) {
            return scene3Id;
          }
          return scene2Id;
        }
        return progress < S3_TO_S2 ? scene2Id : scene3Id;
      };

      let cinematicRafId = 0;
      const updateCinematicByScroll = () => {
        cinematicRafId = 0;
        const rect = story.getBoundingClientRect();
        const vh = window.innerHeight;
        const storyTop = window.scrollY + rect.top;
        const storyBottom = window.scrollY + rect.bottom;
        const start = storyTop - vh * 0.28;
        const end = storyBottom - vh * 0.42;
        const span = Math.max(1, end - start);
        const progress = Math.min(1, Math.max(0, (window.scrollY - start) / span));

        if (reducedMotion) {
          activateScene(sceneByProgress(progress));
          return;
        }

        const nextSceneId = sceneByHysteresis(progress);
        if (nextSceneId === activeSceneId) {
          return;
        }

        const now = window.performance.now();
        if (now - lastSceneActivatedAt < MIN_SCENE_HOLD_MS) {
          return;
        }

        activateScene(nextSceneId);
      };

      const requestCinematicUpdate = () => {
        if (cinematicRafId) {
          return;
        }
        cinematicRafId = window.requestAnimationFrame(updateCinematicByScroll);
      };

      activateScene(scene1Id, true);
      window.addEventListener("scroll", requestCinematicUpdate, { passive: true });
      window.addEventListener("resize", requestCinematicUpdate);
      requestCinematicUpdate();
    }
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
