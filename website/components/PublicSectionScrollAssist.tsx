"use client";

import { useEffect } from "react";

export const PUBLIC_SECTION_SCROLL_ASSIST_SELECTOR =
  ".site-main > :is(.stitch-home-hero, .stitch-catalogue-hero, .stitch-setups-hero, .stitch-setups-feature-section, .stitch-setups-grid-section, .stitch-about-hero, .stitch-quote-hero, .stitch-legal-hero, .stitch-editorial-hero, .stitch-section)";

const SETTLE_DELAY_MS = 180;
const ASSIST_LOCK_MS = 700;
const MAX_DISTANCE_RATIO = 0.18;
const MAX_DISTANCE_PX = 180;
const MIN_DISTANCE_PX = 12;

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

function getViewportCenter(headerOffset: number) {
  return headerOffset + (window.innerHeight - headerOffset) / 2;
}

export default function PublicSectionScrollAssist() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const desktopViewport = window.matchMedia("(min-width: 901px)");
    let settleTimer: number | undefined;
    let unlockTimer: number | undefined;
    let assistLocked = false;

    function clearTimers() {
      if (settleTimer) {
        window.clearTimeout(settleTimer);
        settleTimer = undefined;
      }

      if (unlockTimer) {
        window.clearTimeout(unlockTimer);
        unlockTimer = undefined;
      }
    }

    function nearestCenteredSection() {
      const header = document.querySelector<HTMLElement>(".stitch-site-header");
      const headerOffset = header?.getBoundingClientRect().height ?? 72;
      const viewportCenter = getViewportCenter(headerOffset);
      const maxDistance = Math.min(window.innerHeight * MAX_DISTANCE_RATIO, MAX_DISTANCE_PX);
      const sections = Array.from(
        document.querySelectorAll<HTMLElement>(PUBLIC_SECTION_SCROLL_ASSIST_SELECTOR)
      );

      return sections.reduce<{ element: HTMLElement; distance: number } | null>(
        (nearest, element) => {
          const rect = element.getBoundingClientRect();

          if (rect.bottom <= headerOffset || rect.top >= window.innerHeight) {
            return nearest;
          }

          const distance = rect.top + rect.height / 2 - viewportCenter;
          const absoluteDistance = Math.abs(distance);

          if (absoluteDistance < MIN_DISTANCE_PX || absoluteDistance > maxDistance) {
            return nearest;
          }

          if (!nearest || absoluteDistance < Math.abs(nearest.distance)) {
            return { element, distance };
          }

          return nearest;
        },
        null
      );
    }

    function assistScroll() {
      if (
        assistLocked ||
        reducedMotion.matches ||
        !desktopViewport.matches ||
        isTextEntryActive()
      ) {
        return;
      }

      const nearest = nearestCenteredSection();

      if (!nearest) {
        return;
      }

      assistLocked = true;
      window.scrollTo({
        top: Math.max(0, window.scrollY + nearest.distance),
        behavior: "smooth"
      });

      unlockTimer = window.setTimeout(() => {
        assistLocked = false;
      }, ASSIST_LOCK_MS);
    }

    function scheduleAssist() {
      if (assistLocked || reducedMotion.matches || !desktopViewport.matches) {
        return;
      }

      if (settleTimer) {
        window.clearTimeout(settleTimer);
      }

      settleTimer = window.setTimeout(() => {
        window.requestAnimationFrame(assistScroll);
      }, SETTLE_DELAY_MS);
    }

    function cancelAssist() {
      clearTimers();
      assistLocked = false;
    }

    window.addEventListener("scroll", scheduleAssist, { passive: true });
    window.addEventListener("wheel", cancelAssist, { passive: true });
    window.addEventListener("touchstart", cancelAssist, { passive: true });
    window.addEventListener("keydown", cancelAssist);

    return () => {
      clearTimers();
      window.removeEventListener("scroll", scheduleAssist);
      window.removeEventListener("wheel", cancelAssist);
      window.removeEventListener("touchstart", cancelAssist);
      window.removeEventListener("keydown", cancelAssist);
    };
  }, []);

  return null;
}
