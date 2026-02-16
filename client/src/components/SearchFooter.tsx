import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function SearchFooter() {
  const links = [
    { label: 'About', href: '/about' },
    { label: 'Privacy', href: '#' },
    { label: 'Settings', href: '#' },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.45, ease: 'easeOut' }}
      className="fixed bottom-0 left-0 right-0 pb-12"
    >
      <div className="flex justify-center gap-8">
        {links.map((link, index) => (
          <Link
            key={link.label}
            to={link.href}
            target={link.href.startsWith('http') ? '_blank' : undefined}
            rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
            className="text-[#6B7280] text-sm font-light
                     hover:text-[#2D3E50]
                     transition-colors duration-200"
            style={{ 
              fontFamily: "'Manrope', sans-serif",
              transitionDelay: `${index * 50}ms` 
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </motion.footer>
  );
}
