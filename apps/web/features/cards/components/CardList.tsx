import Link from 'next/link'
import { CreditCardIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/dates'
import { differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils/cn'

const BRAND_COLORS: Record<string, string> = {
  visa: '#1A1F71',
  mastercard: '#EB001B',
  elo: '#00A4E0',
  amex: '#007BC1',
  hipercard: '#CC0000',
  other: '#6366F1',
}

interface CardListProps {
  cards: any[]
  workspaceSlug: string
}

export function CardList({ cards, workspaceSlug }: CardListProps) {
  if (!cards.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum cartão cadastrado.
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map(card => {
        const invoices = card.open_invoices ?? []
        const openInvoice = invoices.find((i: any) => i.status === 'open')
        const closedInvoice = invoices.find((i: any) => i.status === 'closed' || i.status === 'overdue')

        const utilization = card.credit_limit > 0
          ? (card.current_balance / card.credit_limit) * 100
          : 0

        const utilizationVariant =
          utilization > 70 ? 'expense' :
          utilization > 30 ? 'warning' : 'income'

        const brandColor = BRAND_COLORS[card.brand] ?? BRAND_COLORS.other

        return (
          <Card key={card.id} className="overflow-hidden">
            {/* Card header with brand color */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ backgroundColor: `${brandColor}15`, borderBottom: `2px solid ${brandColor}30` }}
            >
              <div className="flex items-center gap-2">
                <CreditCardIcon className="h-5 w-5" style={{ color: brandColor }} />
                <div>
                  <p className="font-semibold text-foreground">{card.name}</p>
                  {card.last_four && (
                    <p className="text-xs text-muted-foreground">•••• {card.last_four}</p>
                  )}
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-xs capitalize"
                style={{ borderColor: `${brandColor}40`, color: brandColor }}
              >
                {card.brand}
              </Badge>
            </div>

            <CardContent className="p-4 space-y-3">
              {/* Utilization bar */}
              <div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Limite utilizado</span>
                  <span>{utilization.toFixed(0)}%</span>
                </div>
                <ProgressBar
                  value={utilization}
                  max={100}
                  size="sm"
                  variant={utilizationVariant}
                />
                <div className="flex items-center justify-between text-xs mt-1">
                  <span className="text-expense font-medium">
                    {formatCurrency(card.current_balance)}
                  </span>
                  <span className="text-muted-foreground">
                    / {formatCurrency(card.credit_limit)}
                  </span>
                </div>
              </div>

              {/* Open invoice */}
              {openInvoice && (
                <div className="rounded-md bg-muted/50 p-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fatura aberta</span>
                    <span className="font-semibold text-expense">
                      {formatCurrency(openInvoice.total_amount)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fecha em {differenceInDays(new Date(openInvoice.period_end), new Date())} dias
                  </p>
                </div>
              )}

              {/* Closed invoice (unpaid) */}
              {closedInvoice && (
                <div className={cn(
                  'rounded-md p-2 text-sm',
                  closedInvoice.status === 'overdue'
                    ? 'bg-destructive/10'
                    : 'bg-yellow-50 dark:bg-yellow-900/20',
                )}>
                  <div className="flex items-center justify-between">
                    <span className={closedInvoice.status === 'overdue' ? 'text-destructive' : 'text-yellow-700 dark:text-yellow-400'}>
                      Vence {formatDate(closedInvoice.due_date)}
                    </span>
                    <span className="font-semibold text-expense">
                      {formatCurrency(closedInvoice.total_amount - closedInvoice.paid_amount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Link href={`/${workspaceSlug}/cards/${card.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver fatura
                  </Button>
                </Link>
                {closedInvoice && (
                  <Link href={`/${workspaceSlug}/cards/${card.id}?pay=${closedInvoice.id}`} className="flex-1">
                    <Button size="sm" className="w-full">
                      Pagar agora
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
