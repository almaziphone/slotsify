import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

export async function handler(event) {
  const { email, password } = JSON.parse(event.body)

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error }),
    }
  }

  const user = data.user
  // Check if profile exists
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // If not, create it with default values
  if (profileError && profileError.code === 'PGRST116') {
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([{ id: user.id, username: '', coins: 100 }])
      .select()
      .single()
    if (insertError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: insertError }),
      }
    }
    return {
      statusCode: 200,
      body: JSON.stringify({ data: { ...data, profile: newProfile } }),
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ data: { ...data, profile } }),
  }
}