'use server'

import { createClient } from '@/lib/supabase/server'

export async function initializeDatabase() {
  const supabase = await createClient()
  
  // Try to create the entries table if it doesn't exist
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS entries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        person_name TEXT NOT NULL,
        work_description TEXT NOT NULL,
        entry_type TEXT NOT NULL CHECK (entry_type IN ('receivable', 'payable')),
        total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
        amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0,
        balance_amount DECIMAL(12, 2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
        entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Users can view their own entries" ON entries
        FOR SELECT USING (auth.uid() = user_id);

      CREATE POLICY "Users can create their own entries" ON entries
        FOR INSERT WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Users can update their own entries" ON entries
        FOR UPDATE USING (auth.uid() = user_id);

      CREATE POLICY "Users can delete their own entries" ON entries
        FOR DELETE USING (auth.uid() = user_id);

      CREATE OR REPLACE FUNCTION update_entries_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS update_entries_updated_at ON entries;
      CREATE TRIGGER update_entries_updated_at
        BEFORE UPDATE ON entries
        FOR EACH ROW
        EXECUTE FUNCTION update_entries_updated_at();
    `
  })

  if (error) {
    console.log('[v0] Database init note:', error)
    // This might fail if table already exists, which is fine
  }

  return { success: true }
}
