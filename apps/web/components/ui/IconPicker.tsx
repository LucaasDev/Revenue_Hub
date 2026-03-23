'use client'

import { useState } from 'react'
import {
  ShoppingCart, Utensils, Car, Home, Heart, Briefcase, Plane, Music,
  Book, Coffee, Gift, Zap, Wifi, Phone, Monitor, Camera, Film, Gamepad2,
  Dumbbell, Scissors, PawPrint, TreePine, Sun, Cloud, Star, Moon,
  DollarSign, CreditCard, TrendingUp, TrendingDown, PiggyBank, Wallet,
  Building, School, Hospital, ShoppingBag, Package, Truck, Globe,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export const ICON_MAP: Record<string, LucideIcon> = {
  shopping_cart: ShoppingCart,
  utensils: Utensils,
  car: Car,
  home: Home,
  heart: Heart,
  briefcase: Briefcase,
  plane: Plane,
  music: Music,
  book: Book,
  coffee: Coffee,
  gift: Gift,
  zap: Zap,
  wifi: Wifi,
  phone: Phone,
  monitor: Monitor,
  camera: Camera,
  film: Film,
  gamepad: Gamepad2,
  dumbbell: Dumbbell,
  scissors: Scissors,
  paw: PawPrint,
  tree: TreePine,
  sun: Sun,
  cloud: Cloud,
  star: Star,
  moon: Moon,
  dollar: DollarSign,
  credit_card: CreditCard,
  trending_up: TrendingUp,
  trending_down: TrendingDown,
  piggy_bank: PiggyBank,
  wallet: Wallet,
  building: Building,
  school: School,
  hospital: Hospital,
  shopping_bag: ShoppingBag,
  package: Package,
  truck: Truck,
  globe: Globe,
}

export type IconKey = keyof typeof ICON_MAP

interface IconPickerProps {
  value?: string | null
  onChange?: (value: IconKey) => void
  label?: string
  error?: string
}

export function IconPicker({ value, onChange, label, error }: IconPickerProps) {
  const [search, setSearch] = useState('')

  const filtered = Object.entries(ICON_MAP).filter(([key]) =>
    key.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-1.5">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Buscar ícone..."
        className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="grid max-h-40 grid-cols-8 gap-1 overflow-y-auto rounded-md border border-border p-1.5">
        {filtered.map(([key, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange?.(key as IconKey)}
            title={key.replace(/_/g, ' ')}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent',
              value === key && 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
            aria-pressed={value === key}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-8 py-2 text-center text-xs text-muted-foreground">
            Nenhum ícone encontrado
          </p>
        )}
      </div>
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
    </div>
  )
}

// Helper: renders an icon by key
export function DynamicIcon({
  name,
  className,
}: {
  name: string | null | undefined
  className?: string
}) {
  const Icon = name ? ICON_MAP[name] : null
  if (!Icon) return null
  return <Icon className={className} />
}
