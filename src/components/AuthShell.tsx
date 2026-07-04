export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-wash px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl font-bold tracking-tight text-ink">
            Side by Side
            <span className="ml-2 inline-flex items-baseline gap-1" aria-hidden>
              <span data-section="upcoming" className="size-2.5 rounded-full bg-hue-strong" />
              <span data-section="local" className="size-2.5 rounded-full bg-hue-strong" />
            </span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">Our lists, in one place</p>
        </div>

        <div className="card p-6 sm:p-8">
          <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
          {subtitle && <div className="mt-1 text-sm text-ink-soft">{subtitle}</div>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
