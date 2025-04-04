import { Database } from './database'

export type Tables = Database['public']['Tables']
export type TableName = keyof Tables

export type TableRow<T extends TableName> = Tables[T]['Row']
export type TableInsert<T extends TableName> = Tables[T]['Insert']
export type TableUpdate<T extends TableName> = Tables[T]['Update']

// Helper types for specific tables
export type Profile = TableRow<'profiles'>
export type Category = TableRow<'categories'>
export type Link = TableRow<'links'>
export type LinkCategory = TableRow<'link_categories'>

// Types for creating new items
export type NewCategory = TableInsert<'categories'>
export type NewLink = TableInsert<'links'>
export type NewLinkCategory = TableInsert<'link_categories'>

// Types for updating items
export type UpdateCategory = TableUpdate<'categories'>
export type UpdateLink = TableUpdate<'links'>
export type UpdateLinkCategory = TableUpdate<'link_categories'> 