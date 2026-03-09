import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Client = {
  id: string
  name: string
  phone: string
  email: string
  property: string
  notes: string
  created_at: string
}

export type Payment = {
  id: string
  client_id: string
  amount: number
  payment_date: string
  method: 'Cash' | 'Bank Transfer' | 'Mobile Money'
  status: 'Deposit' | 'Partial' | 'Full'
  notes: string
  created_at: string
  clients?: Client
}

export type Document = {
  id: string
  client_id: string
  payment_id: string | null
  name: string
  type: 'Receipt' | 'Agreement' | 'Identification' | 'Property' | 'Other'
  file_path: string
  file_size: number
  mime_type: string
  created_at: string
  clients?: Client
}
