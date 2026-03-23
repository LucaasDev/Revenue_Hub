import { DynamicIcon } from '@/components/ui/IconPicker'
import { cn } from '@/lib/utils/cn'

interface CategoryBadgeProps {
  name: string
  icon?: string | null
  color?: string | null
  isSystem?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function CategoryBadge({
  name,
  icon,
  color,
  isSystem,
  size = 'md',
  className,
}: CategoryBadgeProps) {
  const sizeClass = size === 'sm' ? 'gap-1 px-1.5 py-0.5 text-xs' : 'gap-1.5 px-2 py-1 text-sm'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        sizeClass,
        className,
      )}
      style={{
        borderColor: color ? `${color}40` : undefined,
        backgroundColor: color ? `${color}15` : undefined,
        color: color ?? undefined,
      }}
    >
      {icon && <DynamicIcon name={icon} className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />}
      <span>{name}</span>
      {isSystem && (
        <span
          className="ml-0.5 rounded-sm px-1 py-0 text-[10px] font-bold uppercase"
          style={{ backgroundColor: color ? `${color}30` : undefined }}
        >
          sys
        </span>
      )}
    </span>
  )
}
