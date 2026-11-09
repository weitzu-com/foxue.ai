"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ANALYTICS_CONSENT_KEY,
  ANALYTICS_PREFERENCES_EVENT,
  type AnalyticsConsent,
  trackEvent,
} from "@/lib/analytics";
import { enqueueGtagCommand } from "@/lib/gtag-queue";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const validMeasurementId = /^G-[A-Z0-9]+$/.test(measurementId ?? "")
  ? measurementId
  : undefined;

function queueGtag() {
  window.dataLayer = window.dataLayer ?? [];
  // Must forward the Arguments object. Copying it into an array makes gtag.js drop the hit.
  // eslint-disable-next-line prefer-rest-params -- rest parameters are arrays, which gtag.js ignores
  enqueueGtagCommand(window.dataLayer, arguments);
}

let lastPageViewPath: string | null = null;
let lastPageViewTitle = "";

function enableAnalytics() {
  if (!validMeasurementId) return;

  window.gtag = window.gtag ?? queueGtag;
  window.gtag("consent", "update", { analytics_storage: "granted" });

  if (!document.querySelector(`script[data-ga4-id="${validMeasurementId}"]`)) {
    window.gtag("js", new Date());
    window.gtag("config", validMeasurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      send_page_view: false,
    });

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${validMeasurementId}`;
    script.dataset.ga4Id = validMeasurementId;
    document.head.appendChild(script);
  }
}

function updateConsent(choice: AnalyticsConsent) {
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, choice);
  } catch {
    // A blocked storage API should not prevent the visitor from using the site.
  }

  window.gtag = window.gtag ?? queueGtag;
  window.gtag("consent", "update", { analytics_storage: choice });

  if (choice === "granted") enableAnalytics();
}

function safePageLocation(pathname: string) {
  const current = new URL(window.location.href);
  const campaign = new URLSearchParams();
  const allowedParameters = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "gclid",
    "dclid",
  ];

  for (const name of allowedParameters) {
    const value = current.searchParams.get(name);
    if (value) campaign.set(name, value);
  }

  const query = campaign.toString();
  return `${current.origin}${pathname}${query ? `?${query}` : ""}`;
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<AnalyticsConsent | null | undefined>(undefined);

  useEffect(() => {
    if (!validMeasurementId) return;

    window.dataLayer = window.dataLayer ?? [];
    window.gtag = window.gtag ?? queueGtag;
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      wait_for_update: 500,
    });

    let stored: AnalyticsConsent | null = null;
    try {
      const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
      if (value === "granted" || value === "denied") stored = value;
    } catch {
      stored = null;
    }

    if (stored === "granted") enableAnalytics();
    const animationFrame = window.requestAnimationFrame(() => setConsent(stored));
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  useEffect(() => {
    function reopenPreferences() {
      updateConsent("denied");
      try {
        window.localStorage.removeItem(ANALYTICS_CONSENT_KEY);
      } catch {
        // Keep the controls usable even when storage is blocked.
      }
      setConsent(null);
    }

    window.addEventListener(ANALYTICS_PREFERENCES_EVENT, reopenPreferences);
    return () => window.removeEventListener(ANALYTICS_PREFERENCES_EVENT, reopenPreferences);
  }, []);

  useEffect(() => {
    if (consent !== "granted" || !validMeasurementId) return;
    if (lastPageViewPath === pathname) return;

    let cancelled = false;
    const sendPageView = () => {
      if (cancelled || lastPageViewPath === pathname) return;
      lastPageViewPath = pathname;
      lastPageViewTitle = document.title;
      trackEvent("page_view", {
        page_location: safePageLocation(pathname),
        page_path: pathname,
        page_title: document.title,
      });
    };

    // The first HTML response already has a title. Client navigations often clear
    // <title> and then briefly restore the previous one, so wait for a new title.
    if (lastPageViewPath === null && document.title) {
      sendPageView();
      return;
    }

    const titleElement = document.querySelector("title");
    let settled = false;
    let pendingTitle = "";
    let stableTimer = 0;
    const settle = () => {
      if (settled) return;
      settled = true;
      observer.disconnect();
      window.clearInterval(watchdog);
      window.clearTimeout(stableTimer);
      sendPageView();
    };
    const titleReady = () => document.title !== "" && document.title !== lastPageViewTitle;
    const schedule = () => {
      if (settled) return;
      if (!titleReady()) return;
      if (document.title === pendingTitle) return;
      pendingTitle = document.title;
      window.clearTimeout(stableTimer);
      // Metadata can flicker back to the previous title for one frame. Send once it stays.
      stableTimer = window.setTimeout(() => {
        if (document.title === pendingTitle) settle();
      }, 150);
    };
    const observer = new MutationObserver(schedule);
    if (titleElement) {
      observer.observe(titleElement, { childList: true, subtree: true, characterData: true });
    }
    const startedAt = Date.now();
    const watchdog = window.setInterval(() => {
      if (titleReady()) schedule();
      else if (Date.now() - startedAt >= 4000) settle();
    }, 50);
    schedule();

    return () => {
      cancelled = true;
      settled = true;
      observer.disconnect();
      window.clearInterval(watchdog);
      window.clearTimeout(stableTimer);
    };
  }, [consent, pathname]);

  useEffect(() => {
    function handleTrackedClick(event: MouseEvent) {
      const origin = event.target;
      if (!(origin instanceof Element)) return;

      const target = origin.closest<HTMLElement>("[data-analytics-event]");
      if (!target) return;

      trackEvent(target.dataset.analyticsEvent ?? "link_clicked", {
        content_id: target.dataset.analyticsContentId,
        link_location: target.dataset.analyticsLocation,
        link_text: target.dataset.analyticsLabel,
      });
    }

    // Read state-dependent metadata before React click handlers can update the target.
    document.addEventListener("click", handleTrackedClick, true);
    return () => document.removeEventListener("click", handleTrackedClick, true);
  }, []);

  if (!validMeasurementId || consent !== null) return null;

  function choose(choice: AnalyticsConsent) {
    updateConsent(choice);
    setConsent(choice);
  }

  return (
    <aside className="analytics-consent" aria-label="网站分析设置" aria-live="polite">
      <div>
        <strong>是否帮助我们改进 foxue.ai？</strong>
        <p>
          同意后才会加载 Google Analytics。我们只统计匿名使用路径，不发送你的问题原文，
          也不启用广告个性化。
        </p>
      </div>
      <div className="analytics-consent__actions">
        <button type="button" className="analytics-consent__accept" onClick={() => choose("granted")}>
          同意匿名统计
        </button>
        <button type="button" onClick={() => choose("denied")}>
          暂不
        </button>
      </div>
    </aside>
  );
}

export function AnalyticsPreferencesButton() {
  if (!validMeasurementId) return null;

  return (
    <button
      type="button"
      className="analytics-preferences-button"
      onClick={() => window.dispatchEvent(new Event(ANALYTICS_PREFERENCES_EVENT))}
    >
      分析偏好
    </button>
  );
}
