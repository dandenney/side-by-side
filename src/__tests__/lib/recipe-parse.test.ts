import { extractShareUrl } from '@/lib/recipe-parse'

describe('extractShareUrl', () => {
  it('strips ReciMe share text before the URL', () => {
    expect(
      extractShareUrl(
        "Check out @restovivaldi's Beef Stroganoff on ReciMe 🙌. https://recime.app/p/c9c8430e-4958-47e7-9299-44d9042327d2"
      )
    ).toBe('https://recime.app/p/c9c8430e-4958-47e7-9299-44d9042327d2')
  })

  it('drops anything after the URL', () => {
    expect(extractShareUrl('See https://recime.app/p/abc and enjoy')).toBe(
      'https://recime.app/p/abc'
    )
  })

  it('leaves a bare URL unchanged', () => {
    expect(extractShareUrl('https://example.com/recipe')).toBe('https://example.com/recipe')
  })

  it('returns trimmed input when there is no http URL', () => {
    expect(extractShareUrl('  recime.app/p/abc ')).toBe('recime.app/p/abc')
    expect(extractShareUrl('')).toBe('')
  })
})
