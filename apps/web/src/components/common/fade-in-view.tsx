'use client';

import { motion, useInView } from 'framer-motion';
import { ReactNode, useRef } from 'react';

interface FadeInViewProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  once?: boolean;
}

const getDirectionOffset = (direction: FadeInViewProps['direction']) => {
  switch (direction) {
    case 'up':
      return { y: 40 };
    case 'down':
      return { y: -40 };
    case 'left':
      return { x: 40 };
    case 'right':
      return { x: -40 };
    default:
      return {};
  }
};

export function FadeInView({
  children,
  className,
  delay = 0,
  direction = 'up',
  duration = 0.5,
  once = true,
}: FadeInViewProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{
        opacity: 0,
        ...getDirectionOffset(direction),
      }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
