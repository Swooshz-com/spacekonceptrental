"use client";

import { useEffect } from "react";

export const PUBLIC_SECTION_SCROLL_ASSIST_SELECTOR =
  ".site-main > :is(.stitch-home-hero, .stitch-catalogue-hero, .stitch-setups-hero, .stitch-setups-feature-section, .stitch-setups-grid-section, .stitch-about-hero, .stitch-quote-hero, .stitch-legal-hero, .stitch-editorial-hero, .stitch-section)";

const GLIDE_DURATION_MS = 440;
const ASSIST_LOCK_MS = 180;
const WHEEL_DELTA_THRESHOLD = 1;
const CURRENT_SECTION_TOLERANCE_PX = 48;
const INNER_SCROLL_EDGE_TOLERANCE_PX = 2;
const LINEAR_GLIDE_RATIO = 0.58;

function linearThenEaseOut(progress: number) {
  if (progress <= LINEAR_GLIDE_RATIO) {
    return progress;
  }

  const landingProgress =
    (progress - LINEAR_GLIDE_RATIO) / (1 - LINEAR_GLIDE_RATIO);

  return (
    LINEAR_GLIDE_RATIO +
    (1 - LINEAR_GLIDE_RATIO) *
      (-Math.pow(landingProgress, 3) +
        Math.pow(landingProgress, 2) +
        landingProgress)
  );
}

function isTextEntryActive() {
  const active = document.activeElement;

  if (!active) {
    return false;
  }

  return (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement ||
    (active instanceof HTMLElement && active.isContentEditable)
  );
}

function canScrollInDirection(element: HTMLElement, deltaY: number) {
  if (deltaY > 0) {
    return (
      element.scrollTop + element.clientHeight <
      element.scrollHeight - INNER_SCROLL_EDGE_TOLERANCE_PX
    );
  }

  return element.scrollTop > INNER_SCROLL_EDGE_TOLERANCE_PX;
}

function getScrollableAncestor(target: EventTarget | null, deltaY: number) {
  if (!(target instanceof Element)) {
    return null;
  }

  let element: HTMLElement | null =
    target instanceof HTMLElement ? target : target.parentElement;

  while (
    element &&
    element !== document.body &&
    element !== document.documentElement
  ) {
    const style = window.getComputedStyle(element);
    const scrollableY =
      style.overflowY === "auto" ||
      style.overflowY === "scroll" ||
      style.overflowY === "overlay";

    if (
      scrollableY &&
      element.scrollHeight > element.clientHeight &&
      canScrollInDirection(element, deltaY)
    ) {
      return element;
    }

    element = element.parentElement;
  }

  return null;
}

function getHeaderOffset() {
  const header = document.querySelector<HTMLElement>(".stitch-site-header");

  return header?.getBoundingClientRect().height ?? 72;
}

function getViewportCenter(headerOffset: number) {
  return headerOffset + (window.innerHeight - headerOffset) / 2;
}

function getMaxScrollTop() {
  const page = document.documentElement;

  return Math.max(0, page.scrollHeight - window.innerHeight);
}

function getSectionTargetTop(element: HTMLElement, headerOffset: number) {
  const rect = element.getBoundingClientRect();
  const viewportCenter = getViewportCenter(headerOffset);
  const targetTop = window.scrollY + rect.top + rect.height / 2 - viewportCenter;

  return Math.min(Math.max(0, targetTop), getMaxScrollTop());
}

function getSectionTargets() {
  const headerOffset = getHeaderOffset();

  return Array.from(
    document.querySelectorAll<HTMLElement>(PUBLIC_SECTION_SCROLL_ASSIST_SELECTOR)
  )
    .map((element) => ({
      element,
      targetTop: getSectionTargetTop(element, headerOffset)
    }))
    .sort((first, second) => first.targetTop - second.targetTop);
}

function getTargetForWheel(deltaY: number) {
  const currentTop = window.scrollY;
  const targets = getSectionTargets();

  if (deltaY > 0) {
    return (
      targets.find(
        ({ targetTop }) =>
          targetTop > currentTop + CURRENT_SECTION_TOLERANCE_PX
      )?.targetTop ?? null
    );
  }

  return (
    [...targets]
      .reverse()
      .find(
        ({ targetTop }) =>
          targetTop < currentTop - CURRENT_SECTION_TOLERANCE_PX
      )?.targetTop ?? null
  );
}

export default function PublicSectionScrollAssist() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopViewport = window.matchMedia("(min-width: 901px)");
    const wheelListenerOptions: AddEventListenerOptions = { passive: false };
    let unlockTimer: number | undefined;
    let animationFrame: number | undefined;
    let assistLocked = false;
    let previousHtmlScrollBehavior: string | undefined;
    let previousBodyScrollBehavior: string | undefined;

    function forceInstantScrollBehavior() {
      if (previousHtmlScrollBehavior === undefined) {
        previousHtmlScrollBehavior =
          document.documentElement.style.scrollBehavior;
      }

      if (previousBodyScrollBehavior === undefined) {
        previousBodyScrollBehavior = document.body.style.scrollBehavior;
      }

      document.documentElement.style.scrollBehavior = "auto";
      document.body.style.scrollBehavior = "auto";
    }

    function restoreScrollBehavior() {
      if (previousHtmlScrollBehavior !== undefined) {
        document.documentElement.style.scrollBehavior =
          previousHtmlScrollBehavior;
        previousHtmlScrollBehavior = undefined;
      }

      if (previousBodyScrollBehavior !== undefined) {
        document.body.style.scrollBehavior = previousBodyScrollBehavior;
        previousBodyScrollBehavior = undefined;
      }
    }

    function clearGlide() {
      if (unlockTimer) {
        window.clearTimeout(unlockTimer);
        unlockTimer = undefined;
      }

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = undefined;
      }

      assistLocked = false;
      restoreScrollBehavior();
    }

    function glideTo(targetTop: number) {
      if (unlockTimer) {
        window.clearTimeout(unlockTimer);
        unlockTimer = undefined;
      }

      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = undefined;
      }

      const startTop = window.scrollY;
      const distance = targetTop - startTop;

      if (Math.abs(distance) < 1) {
        assistLocked = false;
        return;
      }

      const startTime = window.performance.now();
      assistLocked = true;
      forceInstantScrollBehavior();

      function step(now: number) {
        const progress = Math.min((now - startTime) / GLIDE_DURATION_MS, 1);
        const easedProgress = linearThenEaseOut(progress);

        window.scrollTo(0, startTop + distance * easedProgress);

        if (progress < 1 && assistLocked) {
          animationFrame = window.requestAnimationFrame(step);
          return;
        }

        animationFrame = undefined;
        unlockTimer = window.setTimeout(() => {
          assistLocked = false;
          restoreScrollBehavior();
        }, ASSIST_LOCK_MS);
      }

      animationFrame = window.requestAnimationFrame(step);
    }

    function handleWheel(event: WheelEvent) {
      if (assistLocked) {
        event.preventDefault();
        return;
      }

      if (
        event.defaultPrevented ||
        reducedMotion.matches ||
        !desktopViewport.matches ||
        isTextEntryActive() ||
        Math.abs(event.deltaY) < WHEEL_DELTA_THRESHOLD ||
        Math.abs(event.deltaY) < Math.abs(event.deltaX) ||
        getScrollableAncestor(event.target, event.deltaY)
      ) {
        return;
      }

      const targetTop = getTargetForWheel(event.deltaY);

      if (targetTop === null) {
        return;
      }

      event.preventDefault();
      glideTo(targetTop);
    }

    window.addEventListener("wheel", handleWheel, wheelListenerOptions);
    window.addEventListener("touchstart", clearGlide, { passive: true });
    window.addEventListener("keydown", clearGlide);
    reducedMotion.addEventListener("change", clearGlide);
    desktopViewport.addEventListener("change", clearGlide);

    return () => {
      clearGlide();
      window.removeEventListener("wheel", handleWheel, wheelListenerOptions);
      window.removeEventListener("touchstart", clearGlide);
      window.removeEventListener("keydown", clearGlide);
      reducedMotion.removeEventListener("change", clearGlide);
      desktopViewport.removeEventListener("change", clearGlide);
    };
  }, []);

  return null;
}
