import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UpcomingList from '@/components/UpcomingList'
import { UpcomingItem } from '@/types/upcoming'

// Mock the services
jest.mock('@/services/upcomingEvents', () => ({
  getUpcomingEvents: jest.fn(),
  createUpcomingEvent: jest.fn(),
  updateUpcomingEvent: jest.fn(),
  deleteUpcomingEvent: jest.fn(),
}))

// Mock the AuthContext
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id' },
    signIn: jest.fn(),
    signOut: jest.fn(),
  }),
}))

// Mock the AppDrawer component
jest.mock('@/components/AppDrawer', () => {
  return function MockAppDrawer() {
    return <div data-testid="app-drawer">App Drawer</div>
  }
})

const mockUpcomingEvent: UpcomingItem = {
  id: 'test-id-123',
  title: 'Test Event',
  description: 'Test Description',
  url: 'https://example.com',
  imageUrl: 'https://example.com/image.jpg',
  location: 'Test Location',
  startDate: '2024-01-01',
  endDate: '2024-01-02',
  status: 'definitely',
  listId: '00000000-0000-0000-0000-000000000000',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z')
}

describe('UpcomingList Component', () => {
  const mockServices = require('@/services/upcomingEvents')

  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock implementation
    mockServices.getUpcomingEvents.mockResolvedValue([])
    mockServices.createUpcomingEvent.mockResolvedValue(mockUpcomingEvent)
    mockServices.updateUpcomingEvent.mockResolvedValue(mockUpcomingEvent)
    mockServices.deleteUpcomingEvent.mockResolvedValue(undefined)
  })

  describe('Initial Load', () => {
    it('should load and display upcoming events on mount', async () => {
      mockServices.getUpcomingEvents.mockResolvedValue([mockUpcomingEvent])

      render(<UpcomingList />)

      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument()
      })
      expect(mockServices.getUpcomingEvents).toHaveBeenCalledTimes(1)
    })

    it('should show loading state initially', () => {
      mockServices.getUpcomingEvents.mockImplementation(() => new Promise(() => {}))

      render(<UpcomingList />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should show empty state when no events exist', async () => {
      mockServices.getUpcomingEvents.mockResolvedValue([])

      render(<UpcomingList />)

      await waitFor(() => {
        expect(screen.getByText('No upcoming events found. Add your first event!')).toBeInTheDocument()
      })
    })

    it('should handle errors when loading events', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockServices.getUpcomingEvents.mockRejectedValue(new Error('Failed to load'))

      render(<UpcomingList />)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading upcoming events:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Creating Events', () => {
    it('should open add event modal when plus button is clicked', async () => {
      render(<UpcomingList />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      const addButton = screen.getByRole('button', { name: /add new event/i })
      fireEvent.click(addButton)

      expect(screen.getByRole('heading', { name: 'Add Event' })).toBeInTheDocument()
      expect(screen.getByLabelText('Title *')).toBeInTheDocument()
    })

    it('should create a new event when form is submitted', async () => {
      render(<UpcomingList />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      // Open modal
      const addButton = screen.getByRole('button', { name: /add new event/i })
      fireEvent.click(addButton)

      // Fill form
      const titleInput = screen.getByLabelText('Title *')
      const descriptionInput = screen.getByLabelText('Description')
      const urlInput = screen.getByLabelText('URL')
      const locationInput = screen.getByLabelText('Location')

      await userEvent.type(titleInput, 'New Event')
      await userEvent.type(descriptionInput, 'New Description')
      await userEvent.type(urlInput, 'https://newevent.com')
      await userEvent.type(locationInput, 'New Location')

      // Submit form
      const submitButton = screen.getByRole('button', { name: /add event/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockServices.createUpcomingEvent).toHaveBeenCalledWith({
          title: 'New Event',
          description: 'New Description',
          url: 'https://newevent.com',
          imageUrl: '',
          location: 'New Location',
          startDate: expect.any(String),
          endDate: expect.any(String),
          status: 'definitely'
        })
      })
    })

    it('should close modal after successful creation', async () => {
      render(<UpcomingList />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      // Open modal
      const addButton = screen.getByRole('button', { name: /add new event/i })
      fireEvent.click(addButton)

      // Fill and submit form
      const titleInput = screen.getByLabelText('Title *')
      await userEvent.type(titleInput, 'New Event')

      const submitButton = screen.getByRole('button', { name: /add event/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText('Add Event')).not.toBeInTheDocument()
      })
    })

    it('should handle creation errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      mockServices.createUpcomingEvent.mockRejectedValue(new Error('Creation failed'))

      render(<UpcomingList />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      // Open modal and submit
      const addButton = screen.getByRole('button', { name: /add new event/i })
      fireEvent.click(addButton)

      const titleInput = screen.getByLabelText('Title *')
      await userEvent.type(titleInput, 'New Event')

      const submitButton = screen.getByRole('button', { name: /add event/i })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error saving event:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('should require title field', async () => {
      render(<UpcomingList />)

      // Wait for component to load
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })

      // Open modal
      const addButton = screen.getByRole('button', { name: /add new event/i })
      fireEvent.click(addButton)

      // Try to submit without title
      const submitButton = screen.getByRole('button', { name: /add event/i })
      fireEvent.click(submitButton)

      // Form should not submit and modal should remain open
      expect(screen.getByRole('heading', { name: 'Add Event' })).toBeInTheDocument()
      expect(mockServices.createUpcomingEvent).not.toHaveBeenCalled()
    })
  })

  describe('Editing Events', () => {
    beforeEach(() => {
      mockServices.getUpcomingEvents.mockResolvedValue([mockUpcomingEvent])
    })

    it('should open edit modal when edit button is clicked in detail view', async () => {
      render(<UpcomingList />)

      // Wait for event to load
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument()
      })

      // Click on event to open detail modal
      const eventCard = screen.getByText('Test Event')
      fireEvent.click(eventCard)

      // Click edit button
      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      // Should show edit form
      expect(screen.getByText('Edit Event')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument()
    })

    it('should update event when edit form is submitted', async () => {
      render(<UpcomingList />)

      // Wait for event to load and open edit modal
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument()
      })

      const eventCard = screen.getByText('Test Event')
      fireEvent.click(eventCard)

      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      // Update title
      const titleInput = screen.getByDisplayValue('Test Event')
      await userEvent.clear(titleInput)
      await userEvent.type(titleInput, 'Updated Event')

      // Submit
      const updateButton = screen.getByRole('button', { name: /update event/i })
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(mockServices.updateUpcomingEvent).toHaveBeenCalledWith('test-id-123', {
          title: 'Updated Event',
          description: 'Test Description',
          url: 'https://example.com',
          imageUrl: 'https://example.com/image.jpg',
          location: 'Test Location',
          startDate: '2024-01-01',
          endDate: '2024-01-02',
          status: 'definitely'
        })
      })
    })

    it('should close edit modal after successful update', async () => {
      render(<UpcomingList />)

      // Open edit modal
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument()
      })

      const eventCard = screen.getByText('Test Event')
      fireEvent.click(eventCard)

      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      // Submit without changes
      const updateButton = screen.getByRole('button', { name: /update event/i })
      fireEvent.click(updateButton)

      await waitFor(() => {
        expect(screen.queryByText('Edit Event')).not.toBeInTheDocument()
      })
    })
  })

  describe('Deleting Events', () => {
    beforeEach(() => {
      mockServices.getUpcomingEvents.mockResolvedValue([mockUpcomingEvent])
    })

    it('should delete event when delete button is clicked in detail view', async () => {
      render(<UpcomingList />)

      // Wait for event to load
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument()
      })

      // Click on event to open detail modal
      const eventCard = screen.getByText('Test Event')
      fireEvent.click(eventCard)

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockServices.deleteUpcomingEvent).toHaveBeenCalledWith('test-id-123')
      })
    })

    it('should close detail modal after deletion', async () => {
      render(<UpcomingList />)

      // Open detail modal
      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument()
      })

      const eventCard = screen.getByText('Test Event')
      fireEvent.click(eventCard)

      // Delete event
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(screen.queryByText('Test Event')).not.toBeInTheDocument()
      })
    })
  })

  describe('Event Display', () => {
    it('should display event information correctly', async () => {
      mockServices.getUpcomingEvents.mockResolvedValue([mockUpcomingEvent])

      render(<UpcomingList />)

      await waitFor(() => {
        expect(screen.getByText('Test Event')).toBeInTheDocument()
        expect(screen.getByText('Test Location')).toBeInTheDocument()
        expect(screen.getByText('Definitely')).toBeInTheDocument()
      })
    })

    it('should format dates correctly', async () => {
      mockServices.getUpcomingEvents.mockResolvedValue([mockUpcomingEvent])

      render(<UpcomingList />)

      await waitFor(() => {
        expect(screen.getByText('January 1, 2024')).toBeInTheDocument()
      })
    })

    it('should show status badges with correct styling', async () => {
      mockServices.getUpcomingEvents.mockResolvedValue([mockUpcomingEvent])

      render(<UpcomingList />)

      await waitFor(() => {
        const statusBadge = screen.getByText('Definitely')
        expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800')
      })
    })
  })
}) 