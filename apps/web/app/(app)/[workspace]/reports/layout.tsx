import type { ReactNode } from 'react'
import Link from 'next/link'

interface ReportsLayoutProps {
  children: ReactNode
  params: Promise<{ workspace: string }>
}

const NAV_LINKS = [
  { href: 'income-statement', label: 'DRE' },
  { href: 'cash-flow', label: 'Fluxo de Caixa' },
  { href: 'net-worth', label: 'Patrimônio Líquido' },
]

export default async function ReportsLayout({ children, params }: ReportsLayoutProps) {
  const { workspace } = await params
  const base = `/${workspace}/reports`

  return (
    <div>
      {/* Sub-navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto max-w-6xl px-4">
          <nav className="flex gap-1" aria-label="Relatórios">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={`${base}/${href}`}
                className="rounded-t-lg px-4 py-2.5 text-sm font-medium text-gray-500 transition hover:text-gray-900 dark:hover:text-white aria-[current=page]:border-b-2 aria-[current=page]:border-indigo-600 aria-[current=page]:text-indigo-600"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {children}
    </div>
  )
}
