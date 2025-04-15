import { Metadata } from 'next'
import UpcomingList from '@/components/UpcomingList'

export const metadata: Metadata = {
  title: 'Upcoming Events',
  description: 'Manage your upcoming events and activities',
}

export default function UpcomingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Upcoming Events</h1>
      <UpcomingList />
    </div>
  )
} 