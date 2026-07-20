import { motion, useReducedMotion as useFramerReducedMotion } from 'framer-motion'

const EASE = [0.22, 1, 0.36, 1]

export function useMotionSafe() {
  const reduced = useFramerReducedMotion()
  return !reduced
}

/**
 * Soft rise on scroll. Starts visible so route changes do not white-flash.
 */
export function FadeIn({
  children,
  className = '',
  delay = 0,
  y = 16,
  duration = 0.45,
  once = true,
  amount = 0.15,
  as = 'div',
}) {
  const animate = useMotionSafe()
  const Component = motion[as] || motion.div

  if (!animate) {
    const Tag = as === 'div' ? 'div' : as
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 1, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </Component>
  )
}

/** Staggered children container. */
export function Stagger({ children, className = '', delay = 0, stagger = 0.06, once = true }) {
  const animate = useMotionSafe()

  if (!animate) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial="show"
      whileInView="show"
      viewport={{ once, amount: 0.1 }}
      variants={{
        show: {
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  )
}

/** Child item for Stagger — visible immediately, slight rise only. */
export function StaggerItem({ children, className = '', y = 12 }) {
  const animate = useMotionSafe()

  if (!animate) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={{
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: EASE },
        },
      }}
      initial={{ opacity: 1, y }}
    >
      {children}
    </motion.div>
  )
}

/** Soft hover lift for cards / links. */
export function HoverLift({ children, className = '', as = 'div' }) {
  const animate = useMotionSafe()
  const Component = motion[as] || motion.div

  if (!animate) {
    const Tag = as === 'div' ? 'div' : as
    return <Tag className={className}>{children}</Tag>
  }

  return (
    <Component
      className={className}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </Component>
  )
}

/** Page section entrance from top (hero promo, banners). */
export function SlideDown({ children, className = '', delay = 0 }) {
  const animate = useMotionSafe()

  if (!animate) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 1, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}
