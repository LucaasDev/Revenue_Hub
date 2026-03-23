import { redirect } from 'next/navigation'

interface ReportsPageProps {
  params: Promise<{ workspace: string }>
}

export default async function ReportsPage({ params }: ReportsPageProps) {
  const { workspace } = await params
  redirect(`/${workspace}/reports/income-statement`)
}
