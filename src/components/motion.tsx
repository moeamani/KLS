import { animate, motion, useInView, useReducedMotion, type Variants } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { faNumber } from '@/lib/format';

// Motion vocabulary: short, eased, and only ever opacity + a few pixels of travel.
export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE } },
};

/** Children marked with <StaggerItem> fade in one after another on first paint. */
export function Stagger({ children, className, step = 0.035, as = 'div' }: { children: ReactNode; className?: string; step?: number; as?: 'div' | 'ul' | 'ol' }) {
  const Component = motion[as];
  return (
    <Component className={className} initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: step } } }}>
      {children}
    </Component>
  );
}

export function StaggerItem({ children, className, as = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'li' }) {
  const Component = motion[as];
  return (
    <Component className={className} variants={fadeUp}>
      {children}
    </Component>
  );
}

/** Counts up to a number once it scrolls into view, rendered with Persian digits. */
export function CountUp({ value, format = faNumber, className }: { value: number; format?: (n: number) => string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  useEffect(() => {
    if (!inView) return;
    if (reduce) { setDisplay(value); return; }
    const controls = animate(0, value, { duration: 0.7, ease: EASE, onUpdate: (latest) => setDisplay(Math.round(latest)) });
    return () => controls.stop();
  }, [inView, value, reduce]);
  return <span ref={ref} className={className}>{format(display)}</span>;
}
