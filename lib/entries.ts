import { createClient } from '@/lib/supabase/client'

export interface Entry {
  id: string
  person_name: string
  work_description: string
  entry_type: 'receivable' | 'payable'
  total_amount: number
  amount_paid: number
  balance_amount: number
  entry_date: string
  created_at: string
  updated_at: string
}

export async function createEntry(entry: Omit<Entry, 'id' | 'created_at' | 'updated_at' | 'balance_amount'>) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('entries')
    .insert({
      user_id: user.id,
      ...entry,
    })
    .select()

  if (error) throw error
  return data?.[0]
}

export async function getEntries() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateEntry(id: string, updates: Partial<Omit<Entry, 'id' | 'created_at' | 'updated_at' | 'balance_amount' | 'user_id'>>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('entries')
    .update(updates)
    .eq('id', id)
    .select()

  if (error) throw error
  return data?.[0]
}

export async function deleteEntry(id: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', id)

  if (error) throw error
}
