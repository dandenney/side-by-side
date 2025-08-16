import { createClient } from './server'
import { Tables, TableName, TableRow, TableInsert, TableUpdate } from '@/types/supabase'

export async function getTable<T extends TableName>(
  table: T
): Promise<TableRow<T>[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from(table).select('*')
  
  if (error) throw error
  return data as TableRow<T>[]
}

export async function getById<T extends TableName>(
  table: T,
  id: string
): Promise<TableRow<T> | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data as TableRow<T>
}

export async function insert<T extends TableName>(
  table: T,
  values: TableInsert<T>
): Promise<TableRow<T>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(table)
    .insert(values)
    .select()
    .single()
  
  if (error) throw error
  return data as TableRow<T>
}

export async function update<T extends TableName>(
  table: T,
  id: string,
  values: TableUpdate<T>
): Promise<TableRow<T>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from(table)
    .update(values)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as TableRow<T>
}

export async function remove<T extends TableName>(
  table: T,
  id: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id)
  
  if (error) throw error
} 