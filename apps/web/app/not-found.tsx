import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Página não encontrada.</p>
      <Link
        href="/"
        className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
      >
        Voltar para o início
      </Link>
    </div>
  )
}
