import { useMemo } from 'react';

export function useRole() {
  const user = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); }
    catch { return {}; }
  }, []);
  const isAdmin = user.role === 'admin';
  return { isAdmin, isStandard: !isAdmin, role: user.role };
}
