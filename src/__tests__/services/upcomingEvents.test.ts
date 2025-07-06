import { 
  getUpcomingEvents, 
  createUpcomingEvent, 
  updateUpcomingEvent, 
  deleteUpcomingEvent 
} from '@/services/upcomingEvents'
import { UpcomingItemForm } from '@/types/upcoming'

// Mock the Supabase client
const mockSupabase = {
  from: jest.fn()
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabase)
}))

describe('Upcoming Events Service', () => {
  const mockDbRow = {
    id: 'test-id-123',
    title: 'Test Event',
    description: 'Test Description',
    url: 'https://example.com',
    image_url: 'https://example.com/image.jpg',
    location: 'Test Location',
    start_date: '2024-01-01',
    end_date: '2024-01-02',
    status: 'definitely',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  const mockUpcomingEvent = {
    id: 'test-id-123',
    title: 'Test Event',
    description: 'Test Description',
    url: 'https://example.com',
    imageUrl: 'https://example.com/image.jpg',
    location: 'Test Location',
    startDate: '2024-01-01',
    endDate: '2024-01-02',
    status: 'definitely' as const,
    listId: '00000000-0000-0000-0000-000000000000', // Default value since table doesn't have list_id
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z')
  }

  const mockFormData: UpcomingItemForm = {
    title: 'Test Event',
    description: 'Test Description',
    url: 'https://example.com',
    imageUrl: 'https://example.com/image.jpg',
    location: 'Test Location',
    startDate: '2024-01-01',
    endDate: '2024-01-02',
    status: 'definitely'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the mock to default behavior
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      }),
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null })
      })
    })
  })

  describe('getUpcomingEvents', () => {
    it('should fetch upcoming events successfully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [mockDbRow], error: null })
        })
      })

      const result = await getUpcomingEvents()

      expect(result).toEqual([mockUpcomingEvent])
      expect(mockSupabase.from).toHaveBeenCalledWith('upcoming_events')
    })

    it('should handle errors when fetching events', async () => {
      const mockError = new Error('Database error')
      
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: null, error: mockError })
        })
      })

      await expect(getUpcomingEvents()).rejects.toThrow('Database error')
    })

    it('should return empty array when no events exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: [], error: null })
        })
      })

      const result = await getUpcomingEvents()

      expect(result).toEqual([])
    })
  })

  describe('createUpcomingEvent', () => {
    it('should create a new upcoming event successfully', async () => {
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockDbRow, error: null })
          })
        })
      })

      const result = await createUpcomingEvent(mockFormData)

      expect(result).toEqual(mockUpcomingEvent)
      expect(mockSupabase.from).toHaveBeenCalledWith('upcoming_events')
      expect(mockSupabase.from().insert).toHaveBeenCalledWith([{
        title: mockFormData.title,
        description: mockFormData.description,
        url: mockFormData.url,
        image_url: mockFormData.imageUrl,
        location: mockFormData.location,
        start_date: mockFormData.startDate,
        end_date: mockFormData.endDate,
        status: mockFormData.status
      }])
    })

    it('should handle errors when creating an event', async () => {
      const mockError = new Error('Creation failed')
      
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: mockError })
          })
        })
      })

      await expect(createUpcomingEvent(mockFormData)).rejects.toThrow('Creation failed')
    })

    it('should handle missing optional fields', async () => {
      const minimalFormData: UpcomingItemForm = {
        title: 'Minimal Event',
        startDate: '2024-01-01',
        endDate: '2024-01-02',
        status: 'definitely'
      }
      
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockDbRow, error: null })
          })
        })
      })

      await createUpcomingEvent(minimalFormData)

      expect(mockSupabase.from().insert).toHaveBeenCalledWith([{
        title: minimalFormData.title,
        description: undefined,
        url: undefined,
        image_url: undefined,
        location: undefined,
        start_date: minimalFormData.startDate,
        end_date: minimalFormData.endDate,
        status: minimalFormData.status
      }])
    })
  })

  describe('updateUpcomingEvent', () => {
    it('should update an existing upcoming event successfully', async () => {
      const updatedDbRow = { ...mockDbRow, title: 'Updated Event' }
      const updatedEvent = { ...mockUpcomingEvent, title: 'Updated Event' }
      
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: updatedDbRow, error: null })
            })
          })
        })
      })

      const result = await updateUpcomingEvent('test-id-123', mockFormData)

      expect(result).toEqual(updatedEvent)
      expect(mockSupabase.from).toHaveBeenCalledWith('upcoming_events')
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        title: mockFormData.title,
        description: mockFormData.description,
        url: mockFormData.url,
        image_url: mockFormData.imageUrl,
        location: mockFormData.location,
        start_date: mockFormData.startDate,
        end_date: mockFormData.endDate,
        status: mockFormData.status
      })
      expect(mockSupabase.from().update().eq).toHaveBeenCalledWith('id', 'test-id-123')
    })

    it('should handle errors when updating an event', async () => {
      const mockError = new Error('Update failed')
      
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: null, error: mockError })
            })
          })
        })
      })

      await expect(updateUpcomingEvent('test-id-123', mockFormData)).rejects.toThrow('Update failed')
    })
  })

  describe('deleteUpcomingEvent', () => {
    it('should delete an upcoming event successfully', async () => {
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      })

      await deleteUpcomingEvent('test-id-123')

      expect(mockSupabase.from).toHaveBeenCalledWith('upcoming_events')
      expect(mockSupabase.from().delete).toHaveBeenCalled()
      expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith('id', 'test-id-123')
    })

    it('should handle errors when deleting an event', async () => {
      const mockError = new Error('Delete failed')
      
      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: mockError })
        })
      })

      await expect(deleteUpcomingEvent('test-id-123')).rejects.toThrow('Delete failed')
    })
  })
}) 