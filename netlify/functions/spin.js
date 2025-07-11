import { createClient } from '@supabase/supabase-js'
import { WIN_TABLE } from "./winTable";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Keep this secret!
)

const SYMBOLS = [0, 1, 2, 3, 4, 5, 6, 7, 8] // Representing symbols as numbers for simplicity


// Helper to check win and payout
function getPayout(spin) {
  const key = spin.join(',')
  // Check for three-of-a-kind
  if (WIN_TABLE[key] !== undefined) return { win: true, payout: WIN_TABLE[key] }
  // Check for two-of-a-kind
  const twoKey = `${spin[0]},${spin[1]},*`
  if (WIN_TABLE[twoKey] !== undefined && spin[0] === spin[1]) {
    return { win: true, payout: WIN_TABLE[twoKey] }
  }
  // Check for one-of-a-kind
  const oneKey = `${spin[0]},*,*`
  if (WIN_TABLE[oneKey] !== undefined) {
    return { win: true, payout: WIN_TABLE[oneKey] }
  }
  return { win: false, payout: 0 }
}

export async function handler(event) {
  const token = event.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return { statusCode: 401, body: 'Unauthorized' }
  }

  // Validate token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return { statusCode: 403, body: 'Invalid token' }
  }

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { statusCode: 404, body: 'Profile not found' }
  }

  // Check if user has enough coins
  const spinCost = 10
  if (profile.coins < spinCost) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Not enough coins' }),
    }
  }

  // RNG: simulate a basic slot outcome with the right amount of symbols
  const spin = Array.from({ length: 3 }, () =>
    SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  )

  // Check win and payout
  const { win, payout } = getPayout(spin)
  const newCoins = profile.coins - spinCost + payout

  // Update coins
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ coins: newCoins })
    .eq('id', user.id)

  if (updateError) {
    return { statusCode: 500, body: 'Could not update coins' }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      spin, // array of numbers, e.g. [0,2,5]
      win,
      payout,
      coins: newCoins,
    }),
  }
}
