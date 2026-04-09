import { useState, useEffect } from 'react';

export function useSearchHighlight() {
  const [highlightEnabled, setHighlightEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('apex_search_highlight_enabled');
    if (stored !== null) {
      setHighlightEnabled(stored === 'true');
    }
  }, []);

  const toggle = (enabled: boolean) => {
    setHighlightEnabled(enabled);
    localStorage.setItem('apex_search_highlight_enabled', String(enabled));
  };

  return { highlightEnabled, toggle };
}
