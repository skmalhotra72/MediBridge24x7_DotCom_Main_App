import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Export types
export type { Database }
export type Tables = Database['public']['Tables']
export type Patient = Tables['patients']['Row']
export type Prescription = Tables['prescriptions']['Row']
export type ChatSession = Tables['chat_sessions']['Row']
export type Message = Tables['messages']['Row']
