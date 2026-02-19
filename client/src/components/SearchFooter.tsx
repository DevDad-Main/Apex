import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

export default function SearchFooter() {
  const { isDark, toggle } = useDarkMode();
  const location = useLocation();
  const [showToggle, setShowToggle] = useState(true);

  useEffect(() => {
    setShowToggle(location.pathname === '/');
  }, [location.pathname]);

  const links = [
    { label: 'About', href: '/about' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Settings', href: '/settings' },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
      className="fixed bottom-0 left-0 right-0 pb-6 sm:pb-12"
    >
      <div className="flex justify-center items-center gap-6 sm:gap-8">
        {links.map((link, index) => (
          <Link
            key={link.label}
            to={link.href}
            target={link.href.startsWith('http') ? '_blank' : undefined}
            rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="text-[#6B7280] dark:text-[#9CA3AF] text-xs sm:text-sm font-light
                     hover:text-[#2D3E50] dark:hover:text-white
                     transition-colors duration-200"
            style={{ 
              fontFamily: "'Manrope', sans-serif",
              transitionDelay: `${index * 50}ms` 
            }}
          >
            {link.label}
          </Link>
        ))}
        
        <motion.button
          onClick={toggle}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="text-[#6B7280] dark:text-[#9CA3AF] text-sm font-light
                   hover:text-[#2D3E50] dark:hover:text-white
                   transition-colors duration-200 cursor-pointer bg-transparent border-none p-0"
          style={{ fontFamily: "'Manrope', sans-serif" }}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </motion.button>
      </div>
    </motion.footer>
  );
}
