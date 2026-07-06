"use client";

import { useEffect } from "react";

export const PUBLIC_SECTION_SCROLL_ASSIST_SELECTOR =
  ".site-main > :is(.stitch-home-hero, .stitch-catalogue-hero, .stitch-setups-hero, .stitch-setups-feature-section, .stitch-setups-grid-section, .stitch-about-hero, .stitch-quote-hero, .stitch-legal-hero, .stitch-editorial-hero, .stitch-section)";

const ASSIST_LOCK_MS = 780;
const WHEEL_DELTA_THRESHOLD = 1;
const CURRENT_SECTION_TOLERANCE_PX = 48;
const INNER_SCROLL_EDGE_TOLERANCE_PX = 2;
const MIN_TARGET_SECTION_HEIGHT_PX = 120;

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

function getMaxScrollTop() {
  const page = document.documentElement;

  return Math.max(0, page.scrollHeight - window.innerHeight);
}

function getSectionTargetTop(rect: DOMRect, headerOffset: number) {
  const targetTop = window.scrollY + rect.top - headerOffset;

  return Math.min(Math.max(0, targetTop), getMaxScrollTop());
}

function getSectionTargets() {
  const headerOffset = getHeaderOffset();

  return Array.from(
    document.querySelectorAll<HTMLElement>(PUBLIC_SECTION_SCROLL_ASSIST_SELECTOR)
  )
    .flatMap((element) => {
      const rect = element.getBoundingClientRect();

      if (rect.width < 1 || rect.height < MIN_TARGET_SECTION_HEIGHT_PX) {
        return [];
      }

      return [
        {
          element,
          targetTop: getSectionTargetTop(rect, headerOffset)
        }
      ];
    })
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
    let assistLocked = false;

    function clearGlide() {
      if (unlockTimer) {
        window.clearTimeout(unlockTimer);
        unlockTimer = undefined;
      }

      assistLocked = false;
    }

    function glideTo(targetTop: number) {
      if (unlockTimer) {
        window.clearTimeout(unlockTimer);
        unlockTimer = undefined;
      }

      const startTop = window.scrollY;
      const distance = targetTop - startTop;

      if (Math.abs(distance) < 1) {
        assistLocked = false;
        return;
      }

      assistLocked = true;
      window.scrollTo({ top: targetTop, left: 0 });

      unlockTimer = window.setTimeout(() => {
        assistLocked = false;
      }, ASSIST_LOCK_MS);
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
