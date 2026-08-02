import { useEffect, useRef } from 'react';

// Persists scroll position to sessionStorage keyed by the exact URL
// (pathname+search), and restores it once the page's data is ready.
// Works identically whether the page was reached via the app's own
// navigate(returnTo) calls or the browser's native Back/Forward buttons,
// since it relies on sessionStorage + the current URL, not router state.
//
// Usage (call once per list page, after data has loaded):
//   useScrollRestoration(buildUrl('/assets'), !loading);
export function useScrollRestoration(key, ready) {
  const restoredKeyRef = useRef(null);

  useEffect(() => {
    if (!ready || !key) return;
    if (restoredKeyRef.current === key) return;
    const saved = sessionStorage.getItem('scrollpos:' + key);
    if (saved !== null) {
      window.scrollTo(0, parseInt(saved, 10));
    }
    restoredKeyRef.current = key;
  }, [key, ready]);

  useEffect(() => {
    if (!key) return;
    const handler = () => {
      sessionStorage.setItem('scrollpos:' + key, String(window.scrollY));
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [key]);
}

// Persists which row/record the user last opened (Edit/View) from a given
// list URL, so it can be visually highlighted again on return.
// Usage:
//   const lastId = useLastSelected(buildUrl('/assets'));      // read
//   markLastSelected(buildUrl('/assets'), asset.id);          // write, on click
export function useLastSelected(key) {
  if (!key) return null;
  return sessionStorage.getItem('lastselected:' + key);
}

export function markLastSelected(key, id) {
  if (!key) return;
  sessionStorage.setItem('lastselected:' + key, String(id));
}
