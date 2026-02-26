(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#site-nav");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let reducedMotion = motionQuery.matches;

  const setHeaderOffset = () => {
    const headerHeight = header ? header.offsetHeight : 78;
    root.style.setProperty("--header-offset", `${headerHeight + 14}px`);
  };

  const syncMotionPreference = (event) => {
    reducedMotion = event.matches;
    if (reducedMotion) {
      document.querySelectorAll(".reveal").forEach((el) => {
        el.classList.add("is-visible");
      });
    }
  };

  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", syncMotionPreference);
  } else if (typeof motionQuery.addListener === "function") {
    motionQuery.addListener(syncMotionPreference);
  }

  setHeaderOffset();
  window.addEventListener("resize", setHeaderOffset);

  const closeMenu = () => {
    if (!menuToggle || !nav) {
      return;
    }
    menuToggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    body.classList.remove("menu-open");
  };

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const nextExpanded = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(nextExpanded));
      nav.classList.toggle("is-open", nextExpanded);
      body.classList.toggle("menu-open", nextExpanded);
    });

    nav.addEventListener("click", (event) => {
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
  }

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

  const story = document.querySelector("#story");
  if (story) {
    const sceneImages = Array.from(story.querySelectorAll(".cinematic__img[data-scene]"));
    const sceneBlocks = Array.from(story.querySelectorAll(".cinematic__block[data-scene]"));

    if (sceneImages.length > 0 && sceneBlocks.length > 0) {
      const sceneVisual = story.querySelector(".cinematic__visual");
      const sceneIds = sceneBlocks
        .map((block) => block.dataset.scene)
        .filter(Boolean);
      const firstSceneId = sceneIds[0] || "1";
      const secondSceneId = sceneIds[1] || firstSceneId;

      const SCENE_ONE_TRANSITION_PROGRESS = 0.62;
      const SCENE_ONE_TEXT_DELAY_MS = 2000;
      const TEXT_FADE_IN_MS = 1000;
      const POST_TEXT_HOLD_MS = 1200;

      let activeSceneId = firstSceneId;
      let sceneOneActivatedAt = window.performance.now();
      let storyEntered = false;
      let pendingSceneId = "";
      let pendingTimer = 0;
      let sceneOneTextTimer = 0;
      let cinematicRafId = 0;
      let sceneOneCopyVisible = false;

      const clearPendingTransition = () => {
        if (pendingTimer) {
          window.clearTimeout(pendingTimer);
          pendingTimer = 0;
        }
        pendingSceneId = "";
      };

      const clearSceneOneTextReveal = () => {
        if (sceneOneTextTimer) {
          window.clearTimeout(sceneOneTextTimer);
          sceneOneTextTimer = 0;
        }
      };

      const syncCopyVisibility = () => {
        sceneBlocks.forEach((block) => {
          const isActive = block.dataset.scene === activeSceneId;
          const isSceneOne = block.dataset.scene === firstSceneId;
          const visible = isActive && (!isSceneOne || sceneOneCopyVisible);
          block.classList.toggle("is-copy-visible", visible);
        });
      };

      const scheduleSceneOneTextReveal = () => {
        clearSceneOneTextReveal();
        if (activeSceneId !== firstSceneId) {
          return;
        }
        sceneOneCopyVisible = false;
        syncCopyVisibility();
        sceneOneTextTimer = window.setTimeout(() => {
          sceneOneTextTimer = 0;
          if (activeSceneId !== firstSceneId) {
            return;
          }
          sceneOneCopyVisible = true;
          syncCopyVisibility();
        }, SCENE_ONE_TEXT_DELAY_MS);
      };

      const activateScene = (sceneId, options = {}) => {
        const force = Boolean(options.force);
        if (!sceneId || (!force && sceneId === activeSceneId)) {
          return;
        }

        activeSceneId = sceneId;
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

        if (sceneId === firstSceneId) {
          sceneOneActivatedAt = window.performance.now();
          scheduleSceneOneTextReveal();
          return;
        }

        sceneOneCopyVisible = false;
        clearSceneOneTextReveal();
        syncCopyVisibility();
      };

      const getStoryProgress = () => {
        const rect = story.getBoundingClientRect();
        const viewportHeight = window.innerHeight || 1;
        const storyTop = window.scrollY + rect.top;
        const storyBottom = window.scrollY + rect.bottom;
        const start = storyTop - viewportHeight * 0.26;
        const end = storyBottom - viewportHeight * 0.56;
        const span = Math.max(1, end - start);
        return Math.min(1, Math.max(0, (window.scrollY - start) / span));
      };

      const scheduleSceneTwoTransition = (delayMs) => {
        if (delayMs <= 0) {
          clearPendingTransition();
          activateScene(secondSceneId);
          return;
        }

        if (pendingSceneId === secondSceneId && pendingTimer) {
          return;
        }

        clearPendingTransition();
        pendingSceneId = secondSceneId;
        pendingTimer = window.setTimeout(() => {
          pendingTimer = 0;
          pendingSceneId = "";
          activateScene(secondSceneId);
        }, delayMs);
      };

      const updateCinematicByScroll = () => {
        const progress = getStoryProgress();

        if (!storyEntered && progress > 0) {
          storyEntered = true;
          if (activeSceneId === firstSceneId) {
            sceneOneActivatedAt = window.performance.now();
            scheduleSceneOneTextReveal();
          }
        }

        const wantsSecondScene = secondSceneId !== firstSceneId && progress >= SCENE_ONE_TRANSITION_PROGRESS;
        if (!wantsSecondScene) {
          clearPendingTransition();
          activateScene(firstSceneId);
          return;
        }

        if (activeSceneId === secondSceneId) {
          return;
        }

        const now = window.performance.now();
        const earliestTransitionAt = sceneOneActivatedAt + SCENE_ONE_TEXT_DELAY_MS + TEXT_FADE_IN_MS + POST_TEXT_HOLD_MS;
        const waitMs = Math.max(0, earliestTransitionAt - now);
        scheduleSceneTwoTransition(waitMs);
      };

      const requestCinematicUpdate = () => {
        if (cinematicRafId) {
          return;
        }
        cinematicRafId = window.requestAnimationFrame(() => {
          cinematicRafId = 0;
          updateCinematicByScroll();
        });
      };

      activateScene(firstSceneId, { force: true });
      window.addEventListener("scroll", requestCinematicUpdate, { passive: true });
      window.addEventListener("resize", requestCinematicUpdate);
      window.addEventListener("pagehide", () => {
        clearPendingTransition();
        clearSceneOneTextReveal();
      });
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
