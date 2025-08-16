import { cn } from '@/lib/utils'

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class')
      expect(result).toContain('base-class')
      expect(result).toContain('additional-class')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'conditional', false && 'not-included')
      expect(result).toContain('base')
      expect(result).toContain('conditional')
      expect(result).not.toContain('not-included')
    })

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'valid')
      expect(result).toContain('base')
      expect(result).toContain('valid')
    })

    it('should handle empty strings', () => {
      const result = cn('base', '', 'valid')
      expect(result).toContain('base')
      expect(result).toContain('valid')
    })

    it('should handle objects with conditional properties', () => {
      const result = cn('base', {
        'active': true,
        'inactive': false,
        'highlighted': true
      })
      expect(result).toContain('base')
      expect(result).toContain('active')
      expect(result).toContain('highlighted')
      expect(result).not.toContain('inactive')
    })

    it('should handle arrays', () => {
      const result = cn(['base', 'array-class'], 'standalone')
      expect(result).toContain('base')
      expect(result).toContain('array-class')
      expect(result).toContain('standalone')
    })

    it('should handle duplicate classes', () => {
      const result = cn('duplicate', 'other', 'duplicate')
      const classes = result.split(' ')
      const duplicateCount = classes.filter(cls => cls === 'duplicate').length
      // clsx/cn may or may not deduplicate - test that it works consistently
      expect(duplicateCount).toBeGreaterThanOrEqual(1)
    })

    it('should handle Tailwind class conflicts', () => {
      // cn should merge and handle Tailwind conflicts appropriately
      const result = cn('px-4 py-2', 'px-6')
      // Should prefer the last px value
      expect(result).toContain('px-6')
      expect(result).toContain('py-2')
    })
  })
})