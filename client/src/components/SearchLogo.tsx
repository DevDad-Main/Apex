import { motion } from 'framer-motion';

export default function SearchLogo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="mb-20"
    >
      <h1 
        className="text-6xl font-light tracking-tight text-[#2D3E50] dark:text-white"
        style={{ fontFamily: "'Fraunces', serif" }}
      >
        Apex
      </h1>
    </motion.div>
  );
}
