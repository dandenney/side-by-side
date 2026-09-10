/**
 * Infers event dates from fetched page HTML.
 *
 * Strategies run in confidence order and the first one that yields a date wins:
 *   1. JSON-LD  - schema.org Event objects (startDate / endDate)
 *   2. meta     - <meta property="event:start_time"> and friends
 *   3. microdata- itemprop="startDate" on <time datetime> or <meta content>
 *   4. time     - a bare <time datetime> that points at a future day
 *   5. text     - a date written out in the title/description
 *
 * Everything is returned as a `YYYY-MM-DD` calendar day to match how
 * upcoming_events stores dates. Datetimes keep the day they name in their own
 * offset, so a 7pm show in Denver never slides to the day before/after for a
 * viewer in another timezone.
 */

export type DateSource = 'jsonld' | 'meta' | 'microdata' | 'time-element' | 'text'

export interface ExtractedDates {
  startDate: string
  endDate: string
  source: DateSource
}

interface DateTimeParts {
  date: string
  hour: number | null
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

const MONTH_NAME = '(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\\.?'
const DAY = '(\\d{1,2})(?:st|nd|rd|th)?'
const DASH = '\\s*(?:[-–—]|to|through|thru|until)\\s*'

const todayString = () => toDateString(new Date())

function toDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isValidDay(year: number, month: number, day: number) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false
  const date = new Date(year, month - 1, day)
  return date.getMonth() === month - 1 && date.getDate() === day
}

function buildDate(year: number, month: number, day: number): string | null {
  if (!isValidDay(year, month, day)) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/**
 * A date written without a year ("March 14") means the next March 14. Anything
 * more than a few days past is read as next year's.
 */
function inferYear(month: number, day: number) {
  const now = new Date()
  const thisYear = now.getFullYear()
  const candidate = buildDate(thisYear, month, day)
  if (!candidate) return thisYear
  const grace = new Date(now)
  grace.setDate(grace.getDate() - 3)
  return candidate >= toDateString(grace) ? thisYear : thisYear + 1
}

/**
 * Pulls the calendar day out of an ISO-ish value without ever running it
 * through the viewer's timezone.
 */
function parseDateTime(value: unknown): DateTimeParts | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()

  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/)
  if (iso) {
    const date = buildDate(Number(iso[1]), Number(iso[2]), Number(iso[3]))
    if (!date) return null
    return { date, hour: iso[4] !== undefined ? Number(iso[4]) : null }
  }

  // Unix seconds, used by a few ticketing platforms in event: meta tags.
  if (/^\d{10}$/.test(trimmed)) {
    const asDate = new Date(Number(trimmed) * 1000)
    return { date: toDateString(asDate), hour: asDate.getHours() }
  }

  return null
}

function addDays(dateString: string, amount: number) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day + amount)
  return toDateString(date)
}

/**
 * Late-night events are frequently marked as ending at 1am the next day. That
 * is one evening out, not a two-day event.
 */
function normalizeRange(start: DateTimeParts, end: DateTimeParts | null): { startDate: string; endDate: string } {
  if (!end || end.date < start.date) {
    return { startDate: start.date, endDate: start.date }
  }
  const spillsPastMidnight =
    end.date === addDays(start.date, 1) && end.hour !== null && end.hour < 6
  return { startDate: start.date, endDate: spillsPastMidnight ? start.date : end.date }
}

function decodeBasicEntities(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

/** Picks the soonest event that has not already happened, else the soonest overall. */
function pickCandidate<T extends { startDate: string }>(candidates: T[]): T | null {
  if (candidates.length === 0) return null
  const sorted = [...candidates].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const today = todayString()
  return sorted.find(candidate => candidate.startDate >= today) || sorted[0]
}

// --- Strategy 1: JSON-LD ----------------------------------------------------

function isEventType(node: any) {
  const type = node?.['@type']
  const types = Array.isArray(type) ? type : [type]
  return types.some(entry => typeof entry === 'string' && /event/i.test(entry))
}

function collectJsonLdEvents(node: any, found: { startDate: string; endDate: string }[]) {
  if (Array.isArray(node)) {
    node.forEach(child => collectJsonLdEvents(child, found))
    return
  }
  if (!node || typeof node !== 'object') return

  if (isEventType(node)) {
    const start = parseDateTime(node.startDate)
    if (start) {
      found.push(normalizeRange(start, parseDateTime(node.endDate)))
    }
  }

  Object.values(node).forEach(value => {
    if (value && typeof value === 'object') collectJsonLdEvents(value, found)
  })
}

function fromJsonLd(html: string) {
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  const found: { startDate: string; endDate: string }[] = []
  let block: RegExpExecArray | null

  while ((block = pattern.exec(html)) !== null) {
    try {
      collectJsonLdEvents(JSON.parse(decodeBasicEntities(block[1])), found)
    } catch {
      // Malformed JSON-LD is common; fall through to the other strategies.
    }
  }

  return pickCandidate(found)
}

// --- Strategy 2: meta tags --------------------------------------------------

function metaContent(html: string, attribute: string, name: string) {
  const pattern = new RegExp(
    `<meta[^>]*${attribute}=["']${name}["'][^>]*content=["']([^"']*)["']`,
    'i'
  )
  const reversed = new RegExp(
    `<meta[^>]*content=["']([^"']*)["'][^>]*${attribute}=["']${name}["']`,
    'i'
  )
  return html.match(pattern)?.[1] || html.match(reversed)?.[1] || null
}

function fromMetaTags(html: string) {
  const startNames = ['event:start_time', 'event:startDate', 'og:event:start_time']
  const endNames = ['event:end_time', 'event:endDate', 'og:event:end_time']

  const startRaw = startNames.map(name => metaContent(html, 'property', name) || metaContent(html, 'name', name)).find(Boolean)
  const start = parseDateTime(startRaw)
  if (!start) return null

  const endRaw = endNames.map(name => metaContent(html, 'property', name) || metaContent(html, 'name', name)).find(Boolean)
  return normalizeRange(start, parseDateTime(endRaw))
}

// --- Strategy 3: microdata --------------------------------------------------

function microdataValue(html: string, prop: string) {
  const patterns = [
    new RegExp(`<[^>]*itemprop=["']${prop}["'][^>]*(?:datetime|content)=["']([^"']*)["']`, 'i'),
    new RegExp(`<[^>]*(?:datetime|content)=["']([^"']*)["'][^>]*itemprop=["']${prop}["']`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1]
  }
  return null
}

function fromMicrodata(html: string) {
  const start = parseDateTime(microdataValue(html, 'startDate'))
  if (!start) return null
  return normalizeRange(start, parseDateTime(microdataValue(html, 'endDate')))
}

// --- Strategy 4: <time datetime> -------------------------------------------

function fromTimeElements(html: string) {
  const today = todayString()
  const candidates: { startDate: string }[] = []

  const pattern = /<time[^>]*datetime=["']([^"']*)["']/gi
  let match: RegExpExecArray | null

  while ((match = pattern.exec(html)) !== null) {
    const parsed = parseDateTime(match[1])
    // Article bylines and comment stamps are everywhere; only a future day is
    // plausibly the date of an upcoming event.
    if (parsed && parsed.date >= today) candidates.push({ startDate: parsed.date })
  }

  const picked = pickCandidate(candidates)
  return picked ? { startDate: picked.startDate, endDate: picked.startDate } : null
}

// --- Strategy 5: written-out dates -----------------------------------------

function monthNumber(name: string) {
  return MONTHS[name.slice(0, 3).toLowerCase()] ?? 0
}

function fromText(text: string) {
  if (!text) return null
  const today = todayString()

  // "March 14 - March 16, 2026"
  const crossMonth = text.match(
    new RegExp(`${MONTH_NAME}\\s+${DAY}(?:,?\\s*(\\d{4}))?${DASH}${MONTH_NAME}\\s+${DAY}(?:,?\\s*(\\d{4}))?`, 'i')
  )
  if (crossMonth) {
    const startMonth = monthNumber(crossMonth[1])
    const startDay = Number(crossMonth[2])
    const endMonth = monthNumber(crossMonth[4])
    const endDay = Number(crossMonth[5])
    const endYear = Number(crossMonth[6] || crossMonth[3]) || inferYear(startMonth, startDay)
    const startYear = Number(crossMonth[3]) || (endMonth < startMonth ? endYear - 1 : endYear)
    const startDate = buildDate(startYear, startMonth, startDay)
    const endDate = buildDate(endYear, endMonth, endDay)
    if (startDate && endDate && startDate >= today) {
      return { startDate, endDate: endDate < startDate ? startDate : endDate }
    }
  }

  // "March 14-16, 2026"
  const sameMonth = text.match(
    new RegExp(`${MONTH_NAME}\\s+${DAY}${DASH}${DAY}(?:,?\\s*(\\d{4}))?`, 'i')
  )
  if (sameMonth) {
    const month = monthNumber(sameMonth[1])
    const startDay = Number(sameMonth[2])
    const endDay = Number(sameMonth[3])
    const year = Number(sameMonth[4]) || inferYear(month, startDay)
    const startDate = buildDate(year, month, startDay)
    const endDate = buildDate(year, month, endDay)
    if (startDate && endDate && startDate >= today) {
      return { startDate, endDate: endDate < startDate ? startDate : endDate }
    }
  }

  // "March 14, 2026" / "14 March 2026"
  const single =
    text.match(new RegExp(`${MONTH_NAME}\\s+${DAY}(?:,?\\s*(\\d{4}))?`, 'i')) ||
    text.match(new RegExp(`${DAY}\\s+${MONTH_NAME}(?:,?\\s*(\\d{4}))?`, 'i'))
  if (single) {
    const monthFirst = Number.isNaN(Number(single[1]))
    const month = monthNumber(monthFirst ? single[1] : single[2])
    const day = Number(monthFirst ? single[2] : single[1])
    const year = Number(single[3]) || inferYear(month, day)
    const date = buildDate(year, month, day)
    if (date && date >= today) return { startDate: date, endDate: date }
  }

  // "3/14/2026" - assumed US ordering, matching the rest of the app.
  const numeric = text.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/)
  if (numeric) {
    const year = Number(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3])
    const date = buildDate(year, Number(numeric[1]), Number(numeric[2]))
    if (date && date >= today) return { startDate: date, endDate: date }
  }

  return null
}

// --- Entry point ------------------------------------------------------------

export function extractEventDates(html: string, textFallback = ''): ExtractedDates | null {
  const strategies: [DateSource, () => { startDate: string; endDate: string } | null][] = [
    ['jsonld', () => fromJsonLd(html)],
    ['meta', () => fromMetaTags(html)],
    ['microdata', () => fromMicrodata(html)],
    ['time-element', () => fromTimeElements(html)],
    ['text', () => fromText(textFallback)],
  ]

  for (const [source, run] of strategies) {
    const result = run()
    if (result) return { ...result, source }
  }

  return null
}
