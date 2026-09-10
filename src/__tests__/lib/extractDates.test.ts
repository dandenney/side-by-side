import { extractEventDates } from '@/lib/extractDates'

// Dates in fixtures are relative to "now" so the future-only heuristics stay
// meaningful as time passes.
const daysFromNow = (amount: number) => {
  const date = new Date()
  date.setDate(date.getDate() + amount)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const jsonLd = (payload: unknown) =>
  `<html><head><script type="application/ld+json">${JSON.stringify(payload)}</script></head></html>`

describe('extractEventDates', () => {
  describe('JSON-LD', () => {
    it('reads startDate and endDate from an Event', () => {
      const html = jsonLd({
        '@type': 'MusicEvent',
        name: 'Show',
        startDate: '2026-03-14T19:00:00-06:00',
        endDate: '2026-03-16T23:00:00-06:00',
      })

      expect(extractEventDates(html)).toEqual({
        startDate: '2026-03-14',
        endDate: '2026-03-16',
        source: 'jsonld',
      })
    })

    it('keeps the day named in the page timezone regardless of the viewer', () => {
      // A 9pm Hawaii start is the next calendar day in UTC; we keep March 14.
      const html = jsonLd({ '@type': 'Event', startDate: '2026-03-14T21:00:00-10:00' })

      expect(extractEventDates(html)?.startDate).toBe('2026-03-14')
    })

    it('treats a late-night end time as the same day', () => {
      const html = jsonLd({
        '@type': 'Event',
        startDate: '2026-03-14T21:00:00-05:00',
        endDate: '2026-03-15T01:30:00-05:00',
      })

      expect(extractEventDates(html)).toMatchObject({
        startDate: '2026-03-14',
        endDate: '2026-03-14',
      })
    })

    it('falls back to the start when no end is given', () => {
      const html = jsonLd({ '@type': 'Event', startDate: '2026-03-14' })

      expect(extractEventDates(html)).toMatchObject({
        startDate: '2026-03-14',
        endDate: '2026-03-14',
      })
    })

    it('finds events nested in an @graph', () => {
      const html = jsonLd({
        '@context': 'https://schema.org',
        '@graph': [
          { '@type': 'WebPage', name: 'Listing' },
          { '@type': 'Event', startDate: '2026-05-02T10:00:00Z' },
        ],
      })

      expect(extractEventDates(html)?.startDate).toBe('2026-05-02')
    })

    it('picks the soonest upcoming event on a listing page', () => {
      const html = jsonLd([
        { '@type': 'Event', startDate: daysFromNow(-30) },
        { '@type': 'Event', startDate: daysFromNow(60) },
        { '@type': 'Event', startDate: daysFromNow(10) },
      ])

      expect(extractEventDates(html)?.startDate).toBe(daysFromNow(10))
    })

    it('ignores malformed JSON-LD and moves on', () => {
      const html = `
        <script type="application/ld+json">{ nope: }</script>
        <meta property="event:start_time" content="2026-07-04T12:00:00-04:00">
      `

      expect(extractEventDates(html)).toMatchObject({
        startDate: '2026-07-04',
        source: 'meta',
      })
    })
  })

  describe('meta tags', () => {
    it('reads event:start_time and event:end_time', () => {
      const html = `
        <meta property="event:start_time" content="2026-08-01T18:00:00-07:00">
        <meta property="event:end_time" content="2026-08-03T22:00:00-07:00">
      `

      expect(extractEventDates(html)).toEqual({
        startDate: '2026-08-01',
        endDate: '2026-08-03',
        source: 'meta',
      })
    })

    it('handles content coming before property', () => {
      const html = `<meta content="2026-08-01" property="event:start_time">`

      expect(extractEventDates(html)?.startDate).toBe('2026-08-01')
    })
  })

  describe('microdata', () => {
    it('reads itemprop startDate from a time element', () => {
      const html = `
        <div itemscope itemtype="http://schema.org/Event">
          <time itemprop="startDate" datetime="2026-09-09T20:00">Sept 9</time>
        </div>
      `

      expect(extractEventDates(html)).toEqual({
        startDate: '2026-09-09',
        endDate: '2026-09-09',
        source: 'microdata',
      })
    })
  })

  describe('time elements', () => {
    it('uses a future time element as a last structured resort', () => {
      const html = `<time datetime="${daysFromNow(21)}T19:30:00">Later</time>`

      expect(extractEventDates(html)).toMatchObject({
        startDate: daysFromNow(21),
        source: 'time-element',
      })
    })

    it('ignores past timestamps like article bylines', () => {
      const html = `<time datetime="2019-04-01T09:00:00Z">Published</time>`

      expect(extractEventDates(html)).toBeNull()
    })
  })

  describe('text fallback', () => {
    const future = () => {
      const date = new Date()
      date.setDate(date.getDate() + 45)
      return date
    }
    const monthName = (date: Date) => date.toLocaleDateString('en-US', { month: 'long' })

    it('reads a written-out single date', () => {
      const date = future()
      const text = `Tickets for ${monthName(date)} ${date.getDate()}, ${date.getFullYear()}`

      expect(extractEventDates('<html></html>', text)).toMatchObject({
        startDate: daysFromNow(45),
        endDate: daysFromNow(45),
        source: 'text',
      })
    })

    it('reads a same-month range', () => {
      const start = future()
      const end = new Date(start)
      end.setDate(end.getDate() + 2)
      // Only meaningful when the range does not cross a month boundary.
      if (end.getMonth() !== start.getMonth()) return

      const text = `${monthName(start)} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`
      expect(extractEventDates('<html></html>', text)).toMatchObject({
        startDate: daysFromNow(45),
        endDate: daysFromNow(47),
      })
    })

    it('assumes the next occurrence when no year is written', () => {
      const date = future()
      const text = `Join us ${monthName(date)} ${date.getDate()}`

      expect(extractEventDates('<html></html>', text)?.startDate).toBe(daysFromNow(45))
    })

    it('ignores dates that have already passed', () => {
      expect(extractEventDates('<html></html>', 'Recap of March 14, 2019')).toBeNull()
    })
  })

  it('returns null when a page carries no dates', () => {
    expect(extractEventDates('<html><body>Nothing here</body></html>', 'A page')).toBeNull()
  })

  it('prefers structured data over text', () => {
    const html = jsonLd({ '@type': 'Event', startDate: '2026-03-14' })

    expect(extractEventDates(html, 'December 25, 2026')).toMatchObject({
      startDate: '2026-03-14',
      source: 'jsonld',
    })
  })
})
