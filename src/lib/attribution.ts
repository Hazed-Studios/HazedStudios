// Captures where a visitor came from (ad campaign, source, click ID) so
// it can be attached to their order at checkout - lets you see which
// ads/campaigns actually drove sales, both in your own dashboard and in
// Meta/TikTok's ad managers via the pixel events fired alongside this.

const STORAGE_KEY = 'hz_attribution';

interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  fbclid?: string;
  ttclid?: string;
  gclid?: string;
  landing_page?: string;
  captured_at?: string;
}

/**
 * Call this once when the app loads. If the URL has any tracking
 * parameters, save them - but only the FIRST time in a session, so a
 * later visit to an internal page doesn't overwrite the original
 * campaign that actually brought the visitor in.
 */
export function captureAttribution(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid', 'ttclid', 'gclid'];
    const found: Attribution = {};

    keys.forEach((key) => {
      const value = params.get(key);
      if (value) (found as any)[key] = value;
    });

    // Only save if we actually found tracking params, and only if
    // nothing is already stored (first-touch attribution).
    if (Object.keys(found).length > 0 && !localStorage.getItem(STORAGE_KEY)) {
      found.landing_page = window.location.pathname;
      found.captured_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
    }
  } catch (err) {
    // Never let attribution tracking break the actual site
    console.warn('Attribution capture failed:', err);
  }
}

/** Call this at checkout to get whatever attribution data was captured. */
export function getAttribution(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
