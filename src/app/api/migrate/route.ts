import { createClient } from '@/lib/supabase/server'
import { SHARED_LIST_ID } from '@/lib/constants'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient()

    // Update all url_items to use the shared list ID
    const { error: urlItemsError } = await supabase
      .from('url_items')
      .update({ list_id: SHARED_LIST_ID })
      .neq('list_id', SHARED_LIST_ID)

    if (urlItemsError) {
      console.error('Error updating url_items:', urlItemsError)
      return NextResponse.json({ error: urlItemsError.message }, { status: 500 })
    }

    // Update all tags to use the shared list ID
    const { error: tagsError } = await supabase
      .from('tags')
      .update({ list_id: SHARED_LIST_ID })
      .neq('list_id', SHARED_LIST_ID)

    if (tagsError) {
      console.error('Error updating tags:', tagsError)
      return NextResponse.json({ error: tagsError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Migration failed:', error)
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
} 