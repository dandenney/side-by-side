type PageHeaderProps = {
  title: string
  /** Small line of personality under the title */
  note?: string
  /** Extra controls rendered to the right of the title */
  actions?: React.ReactNode
}

export default function PageHeader({ title, note, actions }: PageHeaderProps) {
  return (
    <header className="mx-auto flex w-full max-w-md items-start justify-between gap-3 pb-5 pt-5 md:max-w-2xl md:pt-24">
      <div className="min-w-0">
        <h1 className="font-display text-[2.5rem] font-bold leading-none tracking-tight text-hue-deep">
          {title}
          <span className="text-hue-strong">.</span>
        </h1>
        {note && <p className="mt-1.5 text-sm text-ink-soft">{note}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1 pt-1">{actions}</div>}
    </header>
  )
}
