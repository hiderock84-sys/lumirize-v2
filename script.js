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
      const activateScene = (sceneId) => {
        sceneImages.forEach((image) => {
          image.classList.toggle("is-active", image.dataset.scene === sceneId);
        });
        sceneBlocks.forEach((block) => {
          const active = block.dataset.scene === sceneId;
          block.classList.toggle("is-active", active);
          block.setAttribute("aria-current", active ? "true" : "false");
        });
      };

      activateScene(sceneBlocks[0].dataset.scene || "1");

      if ("IntersectionObserver" in window) {
        const cinematicObserver = new IntersectionObserver(
          (entries) => {
            const visible = entries
              .filter((entry) => entry.isIntersecting)
              .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

            if (visible.length === 0) {
              return;
            }

            const sceneId = visible[0].target.dataset.scene;
            if (sceneId) {
              activateScene(sceneId);
            }
          },
          {
            root: null,
            rootMargin: "-34% 0px -34% 0px",
            threshold: [0.12, 0.32, 0.52, 0.72]
          }
        );

        sceneBlocks.forEach((block) => cinematicObserver.observe(block));
      } else {
        const fallbackSwitch = () => {
          const guideLine = window.scrollY + window.innerHeight * 0.48;
          let nearest = sceneBlocks[0];
          let nearestDistance = Number.POSITIVE_INFINITY;

          sceneBlocks.forEach((block) => {
            const rect = block.getBoundingClientRect();
            const center = window.scrollY + rect.top + rect.height * 0.5;
            const distance = Math.abs(center - guideLine);
            if (distance < nearestDistance) {
              nearest = block;
              nearestDistance = distance;
            }
          });

          const sceneId = nearest.dataset.scene || "1";
          activateScene(sceneId);
        };

        window.addEventListener("scroll", fallbackSwitch, { passive: true });
        fallbackSwitch();
      }
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
