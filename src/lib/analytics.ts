export const ANALYTICS_CONSENT_KEY = "foxue:analytics-consent";
export const ANALYTICS_PREFERENCES_EVENT = "foxue:open-analytics-preferences";

export type AnalyticsConsent = "granted" | "denied";

type AnalyticsValue = string | number | boolean;
type AnalyticsParameters = Record<string, AnalyticsValue | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function hasAnalyticsConsent() {
  try {
    return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

export function trackEvent(name: string, parameters: AnalyticsParameters = {}) {
  if (typeof window === "undefined" || !hasAnalyticsConsent() || !window.gtag) {
    return;
  }

  const cleanParameters = Object.fromEntries(
    Object.entries(parameters).filter((entry): entry is [string, AnalyticsValue] => {
      return entry[1] !== undefined;
    }),
  );

  window.gtag("event", name, cleanParameters);
}
