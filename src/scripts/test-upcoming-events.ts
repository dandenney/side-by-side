import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(__dirname, '../../.env.local') })

import { supabase } from '@/lib/supabase'

async function testUpcomingEvents() {
  try {
    // First, check if the table exists and has the correct columns
    const { data: tableInfo, error: tableError } = await supabase
      .from('upcoming_events')
      .select('*')
      .limit(0)

    if (tableError) {
      console.error('Error checking table structure:', tableError)
      return
    }

    console.log('Table structure check passed')

    // Try to insert a test record
    const { data, error } = await supabase
      .from('upcoming_events')
      .insert({
        title: 'Test Event',
        start_date: '2024-04-15',
        end_date: '2024-04-15',
        status: 'definitely'
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting test record:', error)
      return
    }

    console.log('Successfully inserted test record:', data)

    // Clean up
    const { error: deleteError } = await supabase
      .from('upcoming_events')
      .delete()
      .eq('id', data.id)

    if (deleteError) {
      console.error('Error deleting test record:', deleteError)
      return
    }

    console.log('Successfully deleted test record')
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testUpcomingEvents() 