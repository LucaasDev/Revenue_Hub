'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

interface TabsContextValue {
  active: string
  setActive: (value: string) => void
}

const TabsContext = createContext<TabsContextValue>({
  active: '',
  setActive: () => {},
})

interface TabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue)
  const active = value ?? internal
  const setActive = (v: string) => {
    setInternal(v)
    onValueChange?.(v)
  }

  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn('flex flex-col', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  children: ReactNode
  className?: string
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex h-10 items-center justify-start rounded-lg bg-muted p-1',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
  disabled?: boolean
}

export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const { active, setActive } = useContext(TabsContext)
  const isActive = active === value

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActive(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium',
        'ring-offset-background transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
        className,
      )}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { active } = useContext(TabsContext)
  if (active !== value) return null

  return (
    <div
      role="tabpanel"
      className={cn('mt-2 focus-visible:outline-none', className)}
    >
      {children}
    </div>
  )
}
