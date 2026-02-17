import { motion } from 'framer-motion';

interface QuickActionsProps {
  onLuckyClick: () => void;
}

export default function QuickActions({ onLuckyClick }: QuickActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.15, ease: 'easeOut' }}
      className="flex gap-4 mt-8"
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onLuckyClick}
        className="px-6 py-3 
                 bg-[#F8F7F4] dark:bg-[#1A1D24] text-[#2D3E50] dark:text-white
                 rounded-lg
                 text-sm font-medium
                 transition-all duration-200
                 hover:bg-[#F0EFE9] dark:hover:bg-[#2A2D35] hover:shadow-sm
                 border border-[#E8E7E1] dark:border-[#2A2D35]"
        style={{ fontFamily: "'Manrope', sans-serif" }}
      >
        I'm Feeling Lucky
      </motion.button>
    </motion.div>
  );
}
