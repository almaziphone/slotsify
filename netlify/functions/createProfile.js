import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

export async function handler(event) {
  const { username, email, password } = JSON.parse(event.body || '{}')

  if (!username || !email || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' }),
    }
  }

  // Create user with username stored in metadata
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username },
  })

  if (userError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: userError }),
    }
  }

  // Create profile with starting coins
  const userId = userData.user.id
  const { error: profileError } = await supabase
    .from('profiles')
    .insert([{ id: userId, coins: 1000, username }])

  if (profileError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: profileError }),
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ data: { user: userData.user } }),
  }
}