import { rateLimit, getClientIP } from '@/lib/rate-limit'

// Mock environment variables
const originalEnv = process.env

beforeEach(() => {
  jest.resetModules()
  process.env = { ...originalEnv }
  // Clear any environment variables for clean tests
  delete process.env.REDIS_URL
  delete process.env.REDIS_HOST
})

afterEach(() => {
  process.env = originalEnv
})

describe('rate-limit', () => {
  describe('rateLimit', () => {
    it('should allow requests under the limit', async () => {
      const result = await rateLimit('test-user', {
        limit: 5,
        window: 60000,
        keyPrefix: 'test',
      })

      expect(result.success).toBe(true)
      expect(result.limit).toBe(5)
      expect(result.remaining).toBe(4)
      expect(typeof result.reset).toBe('number')
    })

    it('should block requests over the limit', async () => {
      const options = {
        limit: 2,
        window: 60000,
        keyPrefix: 'test-limit',
      }

      // Make requests up to the limit
      await rateLimit('test-user-2', options)
      await rateLimit('test-user-2', options)
      
      // This should be blocked
      const result = await rateLimit('test-user-2', options)
      
      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after the window expires', async () => {
      const options = {
        limit: 1,
        window: 100, // Very short window
        keyPrefix: 'test-reset',
      }

      // Use up the limit
      const firstResult = await rateLimit('test-user-3', options)
      expect(firstResult.success).toBe(true)
      
      const secondResult = await rateLimit('test-user-3', options)
      expect(secondResult.success).toBe(false)

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150))

      // Should be allowed again
      const thirdResult = await rateLimit('test-user-3', options)
      expect(thirdResult.success).toBe(true)
    })

    it('should handle different users independently', async () => {
      const options = {
        limit: 1,
        window: 60000,
        keyPrefix: 'test-users',
      }

      const user1Result = await rateLimit('user-1', options)
      const user2Result = await rateLimit('user-2', options)
      
      expect(user1Result.success).toBe(true)
      expect(user2Result.success).toBe(true)
    })

    it('should use default options when not provided', async () => {
      const result = await rateLimit('test-default')
      
      expect(result.limit).toBe(50) // default limit
      expect(result.success).toBe(true)
    })

    it('should handle Redis unavailable gracefully', async () => {
      // Set Redis environment variables to trigger Redis path
      process.env.REDIS_HOST = 'nonexistent-host'
      
      const result = await rateLimit('test-fallback', {
        limit: 10,
        window: 60000,
      })
      
      // Should fallback to in-memory and still work
      expect(result.success).toBe(true)
      expect(result.limit).toBe(10)
    })
  })

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1, 10.0.0.1'
            return null
          })
        }
      } as any

      const ip = getClientIP(mockRequest)
      expect(ip).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header when x-forwarded-for is not available', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name === 'x-real-ip') return '192.168.1.2'
            return null
          })
        }
      } as any

      const ip = getClientIP(mockRequest)
      expect(ip).toBe('192.168.1.2')
    })

    it('should extract IP from cf-connecting-ip header when others are not available', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name === 'cf-connecting-ip') return '192.168.1.3'
            return null
          })
        }
      } as any

      const ip = getClientIP(mockRequest)
      expect(ip).toBe('192.168.1.3')
    })

    it('should return "unknown" when no IP headers are available', () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null)
        }
      } as any

      const ip = getClientIP(mockRequest)
      expect(ip).toBe('unknown')
    })

    it('should prioritize x-forwarded-for over other headers', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1'
            if (name === 'x-real-ip') return '192.168.1.2'
            if (name === 'cf-connecting-ip') return '192.168.1.3'
            return null
          })
        }
      } as any

      const ip = getClientIP(mockRequest)
      expect(ip).toBe('192.168.1.1')
    })

    it('should handle x-forwarded-for with spaces', () => {
      const mockRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name === 'x-forwarded-for') return ' 192.168.1.1 , 10.0.0.1 '
            return null
          })
        }
      } as any

      const ip = getClientIP(mockRequest)
      expect(ip).toBe('192.168.1.1')
    })
  })
})