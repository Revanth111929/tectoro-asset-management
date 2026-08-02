import { useSearchParams } from 'react-router-dom';

// Generic URL-synced filter/sort/pagination state, shared by every list
// page so search/filter/sort/page always live in the URL query string
// (never bare React state) and Back/Forward/refresh restore them exactly.
//
// Usage:
//   const { values, setValue, buildUrl, clearAll } = useUrlFilters({
//     search: '', category: '', status: '', location: '', sort: 'id_desc', page: 1
//   });
//   values.search, values.page, ... are always in sync with the URL.
//   setValue('search', 'noel', { resetPage: true, replace: true })
export function useUrlFilters(defaults) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = {};
  Object.keys(defaults).forEach(function (key) {
    const raw = searchParams.get(key);
    if (raw === null) {
      values[key] = defaults[key];
    } else if (typeof defaults[key] === 'number') {
      const n = parseInt(raw, 10);
      values[key] = isNaN(n) ? defaults[key] : n;
    } else {
      values[key] = raw;
    }
  });

  const updateFilters = function (updates, opts) {
    opts = opts || {};
    const resetPage = opts.resetPage || false;
    const replace = opts.replace || false;
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(function (entry) {
      const key = entry[0];
      const value = entry[1];
      const isDefault =
        value === '' || value === null || value === undefined || value === defaults[key];
      if (isDefault) next.delete(key);
      else next.set(key, value);
    });
    if (resetPage && Object.prototype.hasOwnProperty.call(defaults, 'page')) {
      next.delete('page');
    }
    setSearchParams(next, { replace: replace });
  };

  const setValue = function (key, value, opts) {
    updateFilters({ [key]: value }, opts);
  };

  // Builds the current full path+query, e.g. buildUrl('/assets') ->
  // '/assets?search=noel&page=3'. Used to pass as `returnTo` state when
  // navigating into an Edit/View/Details page.
  const buildUrl = function (pathname) {
    const qs = searchParams.toString();
    return pathname + (qs ? '?' + qs : '');
  };

  const clearAll = function () {
    setSearchParams(new URLSearchParams());
  };

  return { values, setValue, updateFilters, buildUrl, clearAll, searchParams, setSearchParams };
}
