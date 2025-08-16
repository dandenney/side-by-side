import { z } from 'zod'
import { 
  validateSchema, 
  validateSearchParams, 
  validateRequestBody,
  apiSchemas,
  commonSchemas 
} from '@/lib/validation'

describe('validation utilities', () => {
  describe('validateSchema', () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().positive(),
      email: z.string().email().optional(),
    })

    it('should validate correct data', () => {
      const validData = {
        name: 'John Doe',
        age: 25,
        email: 'john@example.com'
      }

      const result = validateSchema(testSchema, validData)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validData)
      }
    })

    it('should reject invalid data', () => {
      const invalidData = {
        name: '',
        age: -1,
        email: 'invalid-email'
      }

      const result = validateSchema(testSchema, invalidData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('name:')
        expect(result.error).toContain('age:')
        expect(result.error).toContain('email:')
        expect(result.issues).toHaveLength(3)
      }
    })

    it('should handle missing required fields', () => {
      const incompleteData = {
        name: 'John'
      }

      const result = validateSchema(testSchema, incompleteData)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('age:')
      }
    })
  })

  describe('validateSearchParams', () => {
    it('should validate URL search parameters', () => {
      const searchParams = new URLSearchParams('query=restaurant&location=nyc')
      const schema = z.object({
        query: z.string().min(1),
        location: z.string().optional(),
      })

      const result = validateSearchParams(schema, searchParams)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.query).toBe('restaurant')
        expect(result.data.location).toBe('nyc')
      }
    })

    it('should handle empty search parameters', () => {
      const searchParams = new URLSearchParams()
      const schema = z.object({
        query: z.string().min(1),
      })

      const result = validateSearchParams(schema, searchParams)
      
      expect(result.success).toBe(false)
    })
  })

  describe('validateRequestBody', () => {
    it('should validate valid JSON request body', async () => {
      const requestBody = { name: 'Test', value: 42 }
      const mockRequest = {
        json: jest.fn().mockResolvedValue(requestBody)
      } as any

      const schema = z.object({
        name: z.string(),
        value: z.number(),
      })

      const result = await validateRequestBody(schema, mockRequest)
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(requestBody)
      }
    })

    it('should handle invalid JSON', async () => {
      const mockRequest = {
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON'))
      } as any

      const schema = z.object({
        name: z.string(),
      })

      const result = await validateRequestBody(schema, mockRequest)
      
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON in request body')
      }
    })
  })

  describe('API schemas', () => {
    describe('placesSearch', () => {
      it('should validate valid search query', () => {
        const data = { query: 'restaurant near me' }
        const result = validateSchema(apiSchemas.placesSearch, data)
        
        expect(result.success).toBe(true)
      })

      it('should reject empty query', () => {
        const data = { query: '' }
        const result = validateSchema(apiSchemas.placesSearch, data)
        
        expect(result.success).toBe(false)
      })
    })

    describe('placesDetails', () => {
      it('should validate valid place ID', () => {
        const data = { placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' }
        const result = validateSchema(apiSchemas.placesDetails, data)
        
        expect(result.success).toBe(true)
      })

      it('should reject invalid place ID format', () => {
        const data = { placeId: 'invalid place id with spaces!' }
        const result = validateSchema(apiSchemas.placesDetails, data)
        
        expect(result.success).toBe(false)
      })
    })

    describe('metaFetch', () => {
      it('should validate valid URL', () => {
        const data = { url: 'https://example.com' }
        const result = validateSchema(apiSchemas.metaFetch, data)
        
        expect(result.success).toBe(true)
      })

      it('should reject invalid URL', () => {
        const data = { url: 'not-a-url' }
        const result = validateSchema(apiSchemas.metaFetch, data)
        
        expect(result.success).toBe(false)
      })
    })

    describe('upcomingEventCreate', () => {
      it('should validate complete event data', () => {
        const data = {
          title: 'Test Event',
          description: 'A test event',
          url: 'https://example.com',
          imageUrl: 'https://example.com/image.jpg',
          location: 'New York',
          startDate: '2024-01-01T12:00:00Z',
          endDate: '2024-01-01T14:00:00Z',
          status: 'definitely'
        }
        
        const result = validateSchema(apiSchemas.upcomingEventCreate, data)
        
        expect(result.success).toBe(true)
      })

      it('should validate minimal event data', () => {
        const data = {
          title: 'Test Event',
          startDate: '2024-01-01T12:00:00Z',
          endDate: '2024-01-01T14:00:00Z',
          status: 'maybe'
        }
        
        const result = validateSchema(apiSchemas.upcomingEventCreate, data)
        
        expect(result.success).toBe(true)
      })

      it('should reject invalid status', () => {
        const data = {
          title: 'Test Event',
          startDate: '2024-01-01T12:00:00Z',
          endDate: '2024-01-01T14:00:00Z',
          status: 'invalid-status'
        }
        
        const result = validateSchema(apiSchemas.upcomingEventCreate, data)
        
        expect(result.success).toBe(false)
      })

      it('should reject missing required fields', () => {
        const data = {
          title: 'Test Event'
          // Missing startDate, endDate, status
        }
        
        const result = validateSchema(apiSchemas.upcomingEventCreate, data)
        
        expect(result.success).toBe(false)
      })
    })
  })

  describe('common schemas', () => {
    describe('url validation', () => {
      it('should validate valid URLs', () => {
        const validUrls = [
          'https://example.com',
          'http://localhost:3000',
          'https://subdomain.example.co.uk/path?query=value#fragment'
        ]

        validUrls.forEach(url => {
          const result = validateSchema(commonSchemas.url, url)
          expect(result.success).toBe(true)
        })
      })

      it('should reject invalid URLs', () => {
        const invalidUrls = [
          'not-a-url',
          'javascript:alert(1)',
          '',
          'just text',
          'http://',
          'https://'
        ]

        invalidUrls.forEach(url => {
          const result = validateSchema(commonSchemas.url, url)
          expect(result.success).toBe(false)
        })
      })
    })

    describe('uuid validation', () => {
      it('should validate valid UUIDs', () => {
        const validUuids = [
          '123e4567-e89b-12d3-a456-426614174000',
          '00000000-0000-0000-0000-000000000000',
          'f47ac10b-58cc-4372-a567-0e02b2c3d479'
        ]

        validUuids.forEach(uuid => {
          const result = validateSchema(commonSchemas.uuid, uuid)
          expect(result.success).toBe(true)
        })
      })

      it('should reject invalid UUIDs', () => {
        const invalidUuids = [
          'not-a-uuid',
          '123e4567-e89b-12d3-a456', // Too short
          '123e4567-e89b-12d3-a456-426614174000-extra', // Too long
          ''
        ]

        invalidUuids.forEach(uuid => {
          const result = validateSchema(commonSchemas.uuid, uuid)
          expect(result.success).toBe(false)
        })
      })
    })

    describe('eventStatus validation', () => {
      it('should validate valid statuses', () => {
        const validStatuses = ['tickets', 'definitely', 'maybe']

        validStatuses.forEach(status => {
          const result = validateSchema(commonSchemas.eventStatus, status)
          expect(result.success).toBe(true)
        })
      })

      it('should reject invalid statuses', () => {
        const invalidStatuses = ['invalid', 'pending', 'confirmed', '']

        invalidStatuses.forEach(status => {
          const result = validateSchema(commonSchemas.eventStatus, status)
          expect(result.success).toBe(false)
        })
      })
    })
  })
})