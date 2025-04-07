import { supabase } from '../supabase'
import { Tag } from '@/types/url-list'

interface SupabaseTag {
  id: string
  name: string
  list_id: string
  list_type: 'local' | 'shared'
  created_at: string
}

interface SupabaseItemTag {
  tag: SupabaseTag
}

export async function getTags(listType: 'local' | 'shared', listId: string) {
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('list_id', listId)
    .eq('list_type', listType)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tags:', error)
    throw error
  }

  return data.map(tag => ({
    id: tag.id,
    name: tag.name,
    listId: tag.list_id,
    listType: tag.list_type,
    createdAt: new Date(tag.created_at)
  })) as Tag[]
}

export async function createTag(tag: Omit<Tag, 'id' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('tags')
    .insert({
      name: tag.name,
      list_id: tag.listId,
      list_type: tag.listType
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating tag:', error)
    throw error
  }

  return {
    id: data.id,
    name: data.name,
    listId: data.list_id,
    listType: data.list_type,
    createdAt: new Date(data.created_at)
  } as Tag
}

export async function deleteTag(id: string) {
  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting tag:', error)
    throw error
  }
}

export async function addTagToItem(itemId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('item_tags')
    .insert({ item_id: itemId, tag_id: tagId })
  
  if (error) throw error
}

export async function removeTagFromItem(itemId: string, tagId: string): Promise<void> {
  const { error } = await supabase
    .from('item_tags')
    .delete()
    .eq('item_id', itemId)
    .eq('tag_id', tagId)
  
  if (error) throw error
}

export async function getItemTags(itemId: string): Promise<Tag[]> {
  const { data, error } = await supabase
    .from('item_tags')
    .select(`
      tag:tags (
        id,
        name,
        list_id,
        list_type,
        created_at
      )
    `)
    .eq('item_id', itemId)
  
  if (error) throw error
  
  // Transform the data to match our Tag type
  const itemTags = data as unknown as SupabaseItemTag[]
  return itemTags.map(d => ({
    id: d.tag.id,
    name: d.tag.name,
    listId: d.tag.list_id,
    listType: d.tag.list_type,
    createdAt: new Date(d.tag.created_at)
  }))
} 