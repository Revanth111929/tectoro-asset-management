import { useState, useEffect, useRef, useCallback } from 'react';

// Measures the actual rendered height of whatever is wrapped in `toolbarRef`
// (page title, breadcrumbs, filters, action buttons) and `footerRef`
// (pagination/footer), and returns a style object that sizes the table's
// scroll area to fill exactly the remaining viewport space. No hardcoded
// magic numbers — re-measures automatically via ResizeObserver whenever
// either area's height changes (e.g. a filter row wrapping to two lines
// on a narrow screen), so the table always fills the true remaining space
// without causing a second, outer page scrollbar.
//
// Usage:
//   const { toolbarRef, footerRef, tableAreaStyle } = useTableAreaHeight();
//   <div ref={toolbarRef}>{...page title, filters, buttons...}</div>
//   <div className="table-responsive" style={tableAreaStyle}>...</div>
//   <div ref={footerRef}>{...pagination...}</div>
export function useTableAreaHeight(minHeight = 200, bottomBuffer = 16) {
  const toolbarRef = useRef(null);
  const footerRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState(400);

  const recompute = useCallback(() => {
    const toolbarBottom = toolbarRef.current
      ? toolbarRef.current.getBoundingClientRect().bottom
      : 0;
    const footerHeight = footerRef.current
      ? footerRef.current.getBoundingClientRect().height
      : 0;
    const remaining = window.innerHeight - toolbarBottom - footerHeight - bottomBuffer;
    setMaxHeight(Math.max(remaining, minHeight));
  }, [minHeight, bottomBuffer]);

  useEffect(() => {
    recompute();
    const ro = new ResizeObserver(recompute);
    if (toolbarRef.current) ro.observe(toolbarRef.current);
    if (footerRef.current) ro.observe(footerRef.current);
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [recompute]);

  return {
    toolbarRef,
    footerRef,
    tableAreaStyle: { maxHeight: `${maxHeight}px`, overflowY: 'auto' },
  };
}
