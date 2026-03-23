'use client'

import { cn } from '@/lib/utils'

interface GoalProgressBarProps {
  percentage: number
  className?: string
  showLabel?: boolean
}

function getProgressColor(percentage: number) {
  if (percentage >= 100) return 'bg-green-500'
  if (percentage >= 75) return 'bg-blue-500'
  if (percentage >= 50) return 'bg-indigo-500'
  if (percentage >= 25) return 'bg-violet-500'
  return 'bg-gray-400'
}

export function GoalProgressBar({ percentage, className, showLabel = true }: GoalProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage))
  const colorClass = getProgressColor(clamped)

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={cn('h-2.5 rounded-full transition-all duration-700 ease-out', colorClass)}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={Math.round(clamped)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-right text-xs text-gray-500">
          {Math.round(clamped)}%
        </p>
      )}
    </div>
  )
}
