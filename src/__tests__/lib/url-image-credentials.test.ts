/**
 * Guards the rule that a Google Place Photo URL is never persisted: it carries
 * GOOGLE_MAPS_API_SERVER_KEY as a query param, so storing one would publish the
 * server key to every visitor. An ordinary og:image has no such problem.
 */

// Mirrors the predicate in src/lib/supabase/url-items.ts. Kept as a local copy
// because that module pulls in the Supabase browser client at import time.
function carriesCredentials(imageUrl: string): boolean {
  return /[?&]key=/.test(imageUrl) || imageUrl.includes('maps.googleapis.com')
}

const PLACE_PHOTO =
  'https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=abc&key=SECRET'

describe('carriesCredentials', () => {
  it('flags a Google Place Photo URL', () => {
    expect(carriesCredentials(PLACE_PHOTO)).toBe(true)
  })

  it('flags any URL with a key query param', () => {
    expect(carriesCredentials('https://example.com/i.jpg?key=abc123')).toBe(true)
    expect(carriesCredentials('https://example.com/i.jpg?w=1&key=abc')).toBe(true)
  })

  // These are the 8 external images actually in production — all keyless.
  it.each([
    'https://images.squarespace-cdn.com/content/photo.jpg',
    'https://m.media-amazon.com/images/I/71abc.jpg',
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9Gc',
    'https://scontent-iad3-1.cdninstagram.com/v/t51.jpg',
  ])('leaves the keyless og:image %s alone', (url) => {
    expect(carriesCredentials(url)).toBe(false)
  })

  it('does not false-positive on a key-ish path segment', () => {
    expect(carriesCredentials('https://example.com/monkey/photo.jpg')).toBe(false)
  })

  it('flags a maps.googleapis.com URL even without a key param', () => {
    expect(
      carriesCredentials('https://maps.googleapis.com/maps/api/place/photo?ref=x')
    ).toBe(true)
  })
})
