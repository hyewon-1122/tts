'use client';

import { motion } from 'motion/react';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="20" r="18" fill="#BEFF00" />
          <path d="M16 13L28 20L16 27V13Z" fill="#000000" />
        </svg>
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: '#BEFF0033' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>
      <div className="flex flex-col leading-none">
        <span className="text-xl font-bold" style={{ color: '#BEFF00' }}>
          머니터링 Pick
        </span>
        <span className="text-[9px] text-zinc-500 font-medium tracking-wider">
          MONEYTORING PICK
        </span>
      </div>
    </div>
  );
}
