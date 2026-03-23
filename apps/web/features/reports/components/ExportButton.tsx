'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'

type ExportFormat = 'pdf' | 'csv'

interface ExportButtonProps {
  type: string   // 'income-statement' | 'cash-flow' | 'net-worth' | 'transactions'
  params: Record<string, string>
  format: ExportFormat
  label?: string
  className?: string
}

export function ExportButton({ type, params, format, label, className }: ExportButtonProps) {
  const [loading, setLoading] = useState(false)

  function buildUrl() {
    const searchParams = new URLSearchParams({ type, ...params })
    return `/api/export/${format}?${searchParams.toString()}`
  }

  async function handleClick() {
    setLoading(true)
    try {
      const url = buildUrl()
      const a = document.createElement('a')
      a.href = url
      a.download = ''
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      // Give browser time to start download
      await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      setLoading(false)
    }
  }

  const defaultLabel = format === 'pdf' ? 'Exportar PDF' : 'Exportar CSV'

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      loading={loading}
      disabled={loading}
      className={className}
    >
      <Download className="mr-1.5 h-4 w-4" />
      {label ?? defaultLabel}
    </Button>
  )
}
