// sidebarActiveResolver.js
// Determines which sidebar section + menu key should be highlighted
// for a given route, without relying on prefix/startsWith matching.
// Extensible: add a new pattern to ROUTE_PATTERNS for any future module/page.

import { CATEGORY_CONFIG } from '../pages/InventoryCategory';

// Reverse map: "Hard Disk" -> "hard-disk", built once from the single
// source of truth (CATEGORY_CONFIG), so categories never need to be
// hardcoded a second time here.
const CATEGORY_TO_SLUG = Object.entries(CATEGORY_CONFIG).reduce((acc, [slug, cfg]) => {
  acc[cfg.category] = slug;
  return acc;
}, {});

// Ordered list of {test, resolve} patterns. First match wins.
// resolve(match, category) -> { section, key }
const ROUTE_PATTERNS = [
  { test: /^\/dashboard/, resolve: () => ({ section: null, key: '/dashboard' }) },

  { test: /^\/assets\/add/, resolve: () => ({ section: 'assets', key: '/assets/add' }) },
  { test: /^\/assets\/import/, resolve: () => ({ section: 'assets', key: '/assets/import' }) },

  // Asset edit/view/timeline pages don't carry category in the URL —
  // highlight the matching Inventory category once it's known (via a
  // lightweight lookup in Layout.js), otherwise fall back to "All Assets".
  {
    test: /^\/assets\/(edit|view|timeline)\/[^/]+/,
    resolve: (match, category) => {
      const slug = category && CATEGORY_TO_SLUG[category];
      return slug
        ? { section: 'inventory', key: `/inventory/${slug}` }
        : { section: 'assets', key: '/assets' };
    },
  },

  { test: /^\/assets\/?$/, resolve: () => ({ section: 'assets', key: '/assets' }) },

  // Any /inventory/<slug>[/anything] — future categories work automatically.
  {
    test: /^\/inventory\/([^/]+)/,
    resolve: (match) => ({ section: 'inventory', key: `/inventory/${match[1]}` }),
  },

  { test: /^\/corporate-sims/, resolve: () => ({ section: 'inventory', key: '/corporate-sims' }) },

  { test: /^\/temporary-assignments/, resolve: () => ({ section: 'lifecycle', key: '/temporary-assignments' }) },
  { test: /^\/asset-replacements/, resolve: () => ({ section: 'lifecycle', key: '/asset-replacements' }) },
  // Future: service-history, repairs, disposal — add one line each here.

  { test: /^\/reports/, resolve: () => ({ section: 'reports', key: '/reports' }) },
  { test: /^\/warranty/, resolve: () => ({ section: 'reports', key: '/warranty' }) },
  { test: /^\/activity-history/, resolve: () => ({ section: 'reports', key: '/activity-history' }) },

  { test: /^\/employees/, resolve: () => ({ section: 'settings', key: '/employees' }) },
  { test: /^\/settings/, resolve: () => ({ section: 'settings', key: '/settings' }) },
  { test: /^\/email-config/, resolve: () => ({ section: 'settings', key: '/email-config' }) },
];

/**
 * @param {string} pathname - current location.pathname
 * @param {string|null} assetCategory - resolved category for /assets/edit|view|timeline/:id pages, if known
 * @returns {{ section: string|null, key: string|null }}
 */
export function resolveActiveMenu(pathname, assetCategory = null) {
  for (const { test, resolve } of ROUTE_PATTERNS) {
    const match = pathname.match(test);
    if (match) return resolve(match, assetCategory);
  }
  return { section: null, key: null };
}

// Regex used by Layout.js to detect when it needs to fetch an asset's
// category to resolve highlighting for edit/view/timeline pages.
export const ASSET_DETAIL_ROUTE = /^\/assets\/(?:edit|view|timeline)\/([^/]+)/;
