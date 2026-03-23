'use client'

import { useEffect, useState } from 'react'

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

type Breakpoint = keyof typeof BREAKPOINTS

/**
 * Returns true if the window width is >= the given breakpoint.
 * Defaults to false on SSR (server-side rendering).
 */
export function useBreakpoint(breakpoint: Breakpoint = 'md'): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${BREAKPOINTS[breakpoint]}px)`)
    setMatches(mq.matches)

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [breakpoint])

  return matches
}

/**
 * Returns the current active breakpoint name.
 */
export function useCurrentBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>('sm')

  useEffect(() => {
    function update() {
      const w = window.innerWidth
      if (w >= BREAKPOINTS['2xl']) setBp('2xl')
      else if (w >= BREAKPOINTS.xl) setBp('xl')
      else if (w >= BREAKPOINTS.lg) setBp('lg')
      else if (w >= BREAKPOINTS.md) setBp('md')
      else setBp('sm')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return bp
}
