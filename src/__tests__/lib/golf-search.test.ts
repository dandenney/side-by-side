import { golfSearchQuery, mentionsGolf } from '@/lib/golf-search'

describe('mentionsGolf', () => {
  it.each(['pebble beach golf links', 'Torrey Pines Golf Course', 'Erin Hills GC'])(
    'detects golf wording in %s',
    (query) => expect(mentionsGolf(query)).toBe(true)
  )

  it.each(['pebble beach', 'bandon dunes', 'sand valley'])(
    'leaves %s alone',
    (query) => expect(mentionsGolf(query)).toBe(false)
  )

  it('matches whole words only, so "concourse" is not "course"', () => {
    expect(mentionsGolf('concourse plaza')).toBe(false)
  })

  it('handles punctuation around the keyword', () => {
    expect(mentionsGolf('Pinehurst (No. 2) — Golf')).toBe(true)
  })
})

describe('golfSearchQuery', () => {
  // "pebble beach" alone returns the town; the suffix returns the course.
  it('appends golf course to a bare place name', () => {
    expect(golfSearchQuery('pebble beach')).toBe('pebble beach golf course')
  })

  it('does not double up when the user already said it', () => {
    expect(golfSearchQuery('pebble beach golf course')).toBe(
      'pebble beach golf course'
    )
  })

  it('respects an abbreviation', () => {
    expect(golfSearchQuery('Erin Hills GC')).toBe('Erin Hills GC')
  })

  it('trims surrounding whitespace', () => {
    expect(golfSearchQuery('  bandon dunes  ')).toBe('bandon dunes golf course')
  })

  it('leaves an empty query untouched for the caller to guard', () => {
    expect(golfSearchQuery('   ')).toBe('')
  })
})
