'use client'

import { motion, useInView, useMotionValue } from 'framer-motion'
import { useRef, ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  duration?: number
  className?: string
}

export function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  distance = 50,
  duration = 0.6,
  className = ''
}: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" })

  const directionOffset = {
    up: { y: distance, x: 0 },
    down: { y: -distance, x: 0 },
    left: { y: 0, x: distance },
    right: { y: 0, x: -distance }
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        ...directionOffset[direction]
      }}
      animate={isInView ? {
        opacity: 1,
        x: 0,
        y: 0
      } : {
        opacity: 0,
        ...directionOffset[direction]
      }}
      transition={{
        duration,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
    >
      {children}
    </motion.div>
  )
}

// Staggered children animations
export function ScrollStagger({
  children,
  className = '',
  staggerDelay = 0.1,
  direction = 'up'
}: {
  children: ReactNode[]
  className?: string
  staggerDelay?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" })

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children) && children.map((child, index) => (
        <ScrollReveal 
          key={index}
          delay={index * staggerDelay}
          direction={direction}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  )
}

// Parallax scroll effect
export function ParallaxScroll({
  children,
  speed = 0.5,
  className = ''
}: {
  children: ReactNode
  speed?: number
  className?: string
}) {
  return (
    <motion.div
      className={className}
      style={{
        y: useMotionValue(0)
      }}
      whileInView={{
        y: [0, -50 * speed]
      }}
      transition={{
        duration: 0.8,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  )
}

// Scale on scroll
export function ScaleReveal({
  children,
  className = '',
  initialScale = 0.8,
  delay = 0
}: {
  children: ReactNode
  className?: string
  initialScale?: number
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{
        opacity: 0,
        scale: initialScale
      }}
      animate={isInView ? {
        opacity: 1,
        scale: 1
      } : {
        opacity: 0,
        scale: initialScale
      }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.21, 0.47, 0.32, 0.98]
      }}
    >
      {children}
    </motion.div>
  )
}