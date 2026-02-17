import { useEffect } from 'react';

export default function DarkModeInitializer() {
  useEffect(() => {
    const stored = localStorage.getItem('apex_dark_mode');
    const isDark = stored === 'true' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return null;
}
