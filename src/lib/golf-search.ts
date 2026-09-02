// Google's Places text search has no way to scope results to golf courses:
//
//   * `type=golf_course` is silently ignored by textsearch (verified against
//     the live API — identical results with and without it).
//   * `golf_course` never appears in a result's `types` either. "Torrey Pines
//     Golf Course" comes back as establishment/point_of_interest/store/
//     tourist_attraction, so results can't be filtered or ranked by type.
//
// The only lever that works is the query text itself: "pebble beach" returns
// the town, while "pebble beach golf course" returns Pebble Beach Golf Links.
// So we append the words for the user instead of making them type them.

const GOLF_WORDS = [
  'golf',
  'course',
  'links',
  'country club',
  'cc',
  'gc',
  'g&cc',
]

/**
 * True when the query already says "golf" in some form, so we don't end up
 * searching for "pebble beach golf course golf course".
 */
export function mentionsGolf(query: string): boolean {
  const normalized = ` ${query.toLowerCase().replace(/[^a-z& ]+/g, ' ').replace(/\s+/g, ' ')} `
  return GOLF_WORDS.some((word) => normalized.includes(` ${word} `))
}

/**
 * The query actually sent to Places. Adds "golf course" unless the user already
 * said something golf-ish. Empty/whitespace input is returned untouched so the
 * caller's own minimum-length guard still applies.
 */
export function golfSearchQuery(query: string): string {
  const trimmed = query.trim()
  if (!trimmed) return trimmed
  return mentionsGolf(trimmed) ? trimmed : `${trimmed} golf course`
}
