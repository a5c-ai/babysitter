'use client';

import { useState, useEffect, useCallback } from 'react';

export function MobileNavToggle() {
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      const sidebar = document.getElementById('kradle-sidebar');
      if (sidebar) {
        sidebar.classList.toggle('mobileOpen', next);
      }
      return next;
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    const sidebar = document.getElementById('kradle-sidebar');
    if (sidebar) sidebar.classList.remove('mobileOpen');
  }, []);

  // Close sidebar on navigation (popstate)
  useEffect(() => {
    window.addEventListener('popstate', close);
    return () => window.removeEventListener('popstate', close);
  }, [close]);

  // Close on click outside sidebar (overlay)
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      const sidebar = document.getElementById('kradle-sidebar');
      if (sidebar && !sidebar.contains(e.target) && !e.target.closest('.mobileNavToggle')) {
        close();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, close]);

  return (
    <>
      <button
        className="mobileNavToggle"
        onClick={toggle}
        aria-label={open ? 'Close navigation' : 'Open navigation'}
        aria-expanded={open}
        type="button"
      >
        <span className="hamburgerIcon" aria-hidden="true">
          <span /><span /><span />
        </span>
      </button>
      {open && <div className="mobileNavOverlay" onClick={close} aria-hidden="true" />}
    </>
  );
}
