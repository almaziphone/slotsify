const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Keep this secret!
)

exports.handler = async (event, context) => {
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

  // RNG: simulate a basic slot outcome
  const symbols = ['🍒', '🍋', '🔔', '💎', '7']
  const spin = Array.from({ length: 3 }, () =>
    symbols[Math.floor(Math.random() * symbols.length)]
  )

  // Simple win condition: all 3 match
  const win = spin.every(s => s === spin[0])
  const payout = win ? 50 : 0
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
      spin,
      win,
      payout,
      coins: newCoins,
    }),
  }
}
