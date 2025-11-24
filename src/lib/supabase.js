import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Fetch shared Groq API key from backend
export async function getGroqKey() {
  try {
    const { data, error } = await supabase
      .from('shared_api_keys')
      .select('api_key')
      .eq('service', 'groq')
      .single()

    if (error) throw error
    return { apiKey: data.api_key, error: null }
  } catch (error) {
    console.error('Error fetching Groq key from backend:', error)
    return { apiKey: null, error }
  }
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
