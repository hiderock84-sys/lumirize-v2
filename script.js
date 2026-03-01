(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector("#site-nav");
  const story = document.querySelector("#story");
  const rawToggle = document.querySelector("#raw-toggle");
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
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", setHeaderOffset);
  }

  const syncRawMode = (enabled) => {
    body.classList.toggle("is-raw", enabled);
    if (!rawToggle) {
      return;
    }
    rawToggle.classList.toggle("is-active", enabled);
    rawToggle.setAttribute("aria-pressed", String(enabled));
  };

  if (rawToggle) {
    syncRawMode(false);
    rawToggle.addEventListener("click", () => {
      const nextMode = !body.classList.contains("is-raw");
      syncRawMode(nextMode);
    });
  }

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
  window.addEventListener("orientationchange", () => {
    closeMenu();
    window.setTimeout(() => {
      setHeaderOffset();
      scheduleParallax();
    }, 120);
  });

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

  /* Cinematic scene switch (stable + debug) */
  if (story) {
    const sceneVisual = story.querySelector(".cinematic__media, .cinematic__visual");
    const imgs = story.querySelectorAll(".cinematic__img");
    const blocks = story.querySelectorAll(".cinematic__block");
    const count = Math.min(imgs.length, blocks.length);
    if (count >= 3) {
      const DEBUG = new URLSearchParams(window.location.search).has("debug");
      const CUT_12 = 0.45;
      const CUT_23 = 0.8;
      const HYS = 0.02;
      const TH = {
        enter2: CUT_12 + HYS,
        exit2: CUT_12 - HYS,
        enter3: CUT_23 + HYS,
        exit3: CUT_23 - HYS
      };
      const ACTIVE_CLASS = "is-active";

      let rangeStart = 0;
      let rangeEnd = 1;
      let currentIndex = 0;
      let ticking = false;

      // DEBUG stats (created/updated only when ?debug=1)
      let switchCount = 0;
      let lastSwitchAt = 0;
      let lastRafAt = window.performance.now();
      let fps = 0;

      const clamp01 = (x) => Math.max(0, Math.min(1, x));

      const computeRange = () => {
        const rect = story.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
        const top = rect.top + scrollTop;
        const height = story.offsetHeight;
        rangeStart = top;
        rangeEnd = Math.max(rangeStart + 1, top + height - window.innerHeight);
        if (DEBUG) {
          console.log("[Cinematic][range]", {
            storyHeight: height,
            innerHeight: window.innerHeight,
            rangeStart,
            rangeEnd,
            span: rangeEnd - rangeStart
          });
        }
      };

      const getProgress = () => {
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        const p = (y - rangeStart) / (rangeEnd - rangeStart);
        return clamp01(p);
      };

      const decideIndex = (p, cur) => {
        if (cur === 0) {
          return p >= TH.enter2 ? 1 : 0;
        }
        if (cur === 1) {
          if (p >= TH.enter3) {
            return 2;
          }
          if (p <= TH.exit2) {
            return 0;
          }
          return 1;
        }
        return p <= TH.exit3 ? 1 : 2;
      };

      let hud = null;
      const ensureHUD = () => {
        if (!DEBUG || hud) {
          return;
        }
        const style = document.createElement("style");
        style.textContent =
          ".cinematic-debug-hud{position:fixed;right:12px;bottom:12px;z-index:99999;font:12px/1.35 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace;background:rgba(0,0,0,.65);color:#fff;padding:10px 12px;border-radius:10px;max-width:320px;pointer-events:none;white-space:pre;}";
        document.head.appendChild(style);
        hud = document.createElement("div");
        hud.className = "cinematic-debug-hud";
        document.body.appendChild(hud);
      };

      const updateHUD = (p, nextIndex) => {
        if (!DEBUG) {
          return;
        }
        ensureHUD();
        const rect = story.getBoundingClientRect();
        const y = window.scrollY || document.documentElement.scrollTop || 0;
        hud.textContent = `progress: ${p.toFixed(3)}
current: ${currentIndex}  next: ${nextIndex}
rangeStart: ${Math.round(rangeStart)}  rangeEnd: ${Math.round(rangeEnd)}
storyRect.top: ${Math.round(rect.top)}  height: ${Math.round(rect.height)}
innerHeight: ${window.innerHeight}  scrollY: ${Math.round(y)}
fps: ${fps.toFixed(1)}
lastSwitchAt: ${Math.round(lastSwitchAt)}ms
switchCount: ${switchCount}`;
      };

      function activateScene(nextIndex, p = 0, force = false) {
        if (nextIndex === currentIndex && !force) {
          return;
        }

        imgs[currentIndex]?.classList.remove(ACTIVE_CLASS);
        blocks[currentIndex]?.classList.remove(ACTIVE_CLASS);
        blocks[currentIndex]?.setAttribute("aria-current", "false");

        imgs[nextIndex]?.classList.add(ACTIVE_CLASS);
        blocks[nextIndex]?.classList.add(ACTIVE_CLASS);
        blocks[nextIndex]?.setAttribute("aria-current", "true");

        if (sceneVisual) {
          sceneVisual.setAttribute("data-active-scene", String(nextIndex + 1));
        }

        if (DEBUG) {
          switchCount += 1;
          lastSwitchAt = window.performance.now();
          console.log("[Cinematic][switch]", {
            from: currentIndex,
            to: nextIndex,
            progress: Number(p.toFixed(3)),
            scrollY: window.scrollY || document.documentElement.scrollTop || 0,
            rangeStart,
            rangeEnd
          });
        }

        currentIndex = nextIndex;
        updateHUD(p, nextIndex);
      }

      const update = () => {
        ticking = false;
        const now = window.performance.now();
        const dt = now - lastRafAt;
        lastRafAt = now;
        if (dt > 0) {
          fps = 1000 / dt;
        }

        const p = getProgress();
        const next = decideIndex(p, currentIndex);
        updateHUD(p, next);
        activateScene(next, p);
      };

      const requestUpdate = () => {
        if (reducedMotion) {
          update();
          return;
        }
        if (ticking) {
          return;
        }
        ticking = true;
        window.requestAnimationFrame(update);
      };

      const initActive = () => {
        for (let i = 0; i < count; i += 1) {
          const active = i === 0;
          imgs[i]?.classList.toggle(ACTIVE_CLASS, active);
          blocks[i]?.classList.toggle(ACTIVE_CLASS, active);
          blocks[i]?.setAttribute("aria-current", active ? "true" : "false");
        }
        currentIndex = 0;
        if (sceneVisual) {
          sceneVisual.setAttribute("data-active-scene", "1");
        }
      };

      const init = () => {
        computeRange();
        initActive();
        update();
      };

      window.addEventListener(
        "load",
        () => {
          computeRange();
          requestUpdate();
        },
        { passive: true }
      );

      if (document.fonts && document.fonts.ready) {
        document.fonts.ready
          .then(() => {
            computeRange();
            requestUpdate();
          })
          .catch(() => {});
      }

      if (window.ResizeObserver) {
        const ro = new ResizeObserver(() => {
          computeRange();
          requestUpdate();
        });
        ro.observe(story);
      }

      window.addEventListener(
        "resize",
        () => {
          computeRange();
          requestUpdate();
        },
        { passive: true }
      );
      window.addEventListener(
        "orientationchange",
        () => {
          computeRange();
          requestUpdate();
        },
        { passive: true }
      );

      if (reducedMotion) {
        window.addEventListener("scroll", update, { passive: true });
      } else {
        window.addEventListener("scroll", requestUpdate, { passive: true });
      }

      init();
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
