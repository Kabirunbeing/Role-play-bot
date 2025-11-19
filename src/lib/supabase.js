import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Save Groq API key for current user
export async function saveGroqKey(apiKey) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: new Error('User not authenticated') }
  }

  const { error } = await supabase
    .from('user_api_keys')
    .upsert({ 
      user_id: user.id, 
      groq_api_key: apiKey,
      updated_at: new Date().toISOString()
    })
  
  return { error }
}

// Get Groq API key for current user
export async function getGroqKey() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { apiKey: null, error: new Error('User not authenticated') }
  }

  const { data, error } = await supabase
    .from('user_api_keys')
    .select('groq_api_key')
    .eq('user_id', user.id)
    .single()
  
  return { apiKey: data?.groq_api_key, error }
}

// Delete Groq API key for current user
export async function deleteGroqKey() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: new Error('User not authenticated') }
  }

  const { error } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('user_id', user.id)
  
  return { error }
}
