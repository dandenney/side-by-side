export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Quick Links</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <LinkCard
            title="Groceries"
            description="Shopping list and grocery stores"
            href="/groceries"
          />
          <LinkCard
            title="Costco"
            description="Costco shopping and deals"
            href="/costco"
          />
          <LinkCard
            title="Local"
            description="Local services and information"
            href="/local"
          />
          <LinkCard
            title="Reading List"
            description="Save and organize articles to read"
            href="/reading"
          />
        </div>
      </div>
    </main>
  )
}

function LinkCard({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <a
      href={href}
      className="block p-6 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
    >
      <h2 className="text-2xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600">{description}</p>
    </a>
  )
}
