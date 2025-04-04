import { createClient } from './server'
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

export async function getTagsByList(listId: string, listType: 'local' | 'shared'): Promise<Tag[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('list_id', listId)
    .eq('list_type', listType)
    .order('name')
  
  if (error) throw error
  return data as Tag[]
}

export async function createTag(name: string, listId: string, listType: 'local' | 'shared'): Promise<Tag> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('tags')
    .insert({ name, list_id: listId, list_type: listType })
    .select()
    .single()
  
  if (error) throw error
  return data as Tag
}

export async function addTagToItem(itemId: string, tagId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('item_tags')
    .insert({ item_id: itemId, tag_id: tagId })
  
  if (error) throw error
}

export async function removeTagFromItem(itemId: string, tagId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('item_tags')
    .delete()
    .eq('item_id', itemId)
    .eq('tag_id', tagId)
  
  if (error) throw error
}

export async function getItemTags(itemId: string): Promise<Tag[]> {
  const supabase = createClient()
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