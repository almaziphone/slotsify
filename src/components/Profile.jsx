import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Profile({ onLogout }) {
  const [profile, setProfile] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [username, setUsername] = useState('')
  const [spinResult, setSpinResult] = useState(null)
  const [spinLoading, setSpinLoading] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      setErrorMsg(null)
      const { data: userData, error: userError } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) {
        setErrorMsg('User not found.')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('No rows')) {
          // Profile missing
          setShowProfileForm(true)
        } else {
          setErrorMsg('Error loading profile: ' + error.message)
        }
      } else {
        setProfile(data)
      }
    }

    loadProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  const handleProfileCreate = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) {
      setErrorMsg('User not found.')
      return
    }
    const { error } = await supabase
      .from('profiles')
      .insert([{ id: user.id, coins: 100, username }])
    if (error) {
      setErrorMsg('Failed to create profile: ' + error.message)
    } else {
      setShowProfileForm(false)
      setProfile({ id: user.id, coins: 100, username })
    }
  }

  const handleSpin = async () => {
    setSpinLoading(true)
    setSpinResult(null)
    setErrorMsg(null)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setErrorMsg('Not authenticated')
      setSpinLoading(false)
      return
    }
    try {
      const res = await fetch('/.netlify/functions/spin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      const body = await res.text()
      let data
      try {
        data = JSON.parse(body)
      } catch {
        data = { error: body }
      }
      if (!res.ok) {
        setErrorMsg(data.error || body)
      } else {
        setSpinResult(data)
        setProfile(prev => ({ ...prev, coins: data.coins }))
      }
    } catch (err) {
      setErrorMsg('Spin failed: ' + err.message)
    }
    setSpinLoading(false)
  }

  if (errorMsg) return <p style={{ color: 'red' }}>{errorMsg}</p>
  if (showProfileForm) {
    return (
      <form onSubmit={handleProfileCreate}>
        <h2>Create your profile</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <button type="submit">Create Profile</button>
        {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      </form>
    )
  }
  if (!profile) return <p>Loading profile...</p>

  return (
    <div>
      <h2>Welcome, {profile.username || 'Unnamed Player'}!</h2>
      <p>Coins: {profile.coins}</p>
      <button onClick={handleSpin} disabled={spinLoading || profile.coins < 10}>
        {spinLoading ? 'Spinning...' : 'Spin (10 coins)'}
      </button>
      {spinResult && (
        <div>
          <p>
            Result: {spinResult.spin?.join(' ')}<br />
            {spinResult.win ? `🎉 You won ${spinResult.payout} coins!` : 'No win this time.'}
          </p>
        </div>
      )}
      <button onClick={handleLogout}>Logout</button>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
    </div>
  )
}
