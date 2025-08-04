import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import '../styles/Profile.css'
import SlotMachine from './SlotMachine'

interface ProfileData {
  id: string
  coins: number
  username: string
}

interface SpinResult {
  win: boolean
  payout: number
  coins: number
  spin: number[]
}

interface ProfileProps {
  user?: unknown
  profile?: ProfileData | null
  onLogout: () => void
}

export default function Profile({ user: initialUser, profile: initialProfile, onLogout }: ProfileProps) {
  const [profile, setProfile] = useState<ProfileData | null>(initialProfile || null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [username, setUsername] = useState('')
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null)
  const [spinLoading, setSpinLoading] = useState(false)
  const [wheels, setWheels] = useState<number[]>([0, 0, 0])

  useEffect(() => {
    async function loadProfile() {
      setErrorMsg(null)
      const currentUser = initialUser || (await supabase.auth.getUser()).data?.user
      if (!currentUser) {
        setErrorMsg('User not found.')
        return
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('No rows')) {
          setShowProfileForm(true)
        } else {
          setErrorMsg('Error loading profile: ' + error.message)
        }
      } else {
        setProfile(data)
      }
    }
    if (!profile) {
      loadProfile()
    }
  }, [initialUser, profile])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  const handleProfileCreate = async (e) => {
    e.preventDefault()
    setErrorMsg(null)
    // Get current session for auth
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setErrorMsg('Not authenticated.')
      return
    }
    try {
      const res = await fetch('/.netlify/functions/createProfile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ username }),
      })
      const { data, error } = await res.json()
      if (error) {
        setErrorMsg('Failed to create profile: ' + (error.message || error))
      } else {
        setShowProfileForm(false)
        setProfile({ id: data.id, coins: data.coins, username: data.username })
      }
    } catch (err) {
      setErrorMsg('Failed to create profile: ' + err.message)
    }
  }

  // Animate wheels before showing result
  const animateWheels = (finalSpin) => {
    let spins = 20
    let interval = 40
    let count = 0
    const spinInterval = setInterval(() => {
      setWheels([
        Math.floor(Math.random() * 6),
        Math.floor(Math.random() * 6),
        Math.floor(Math.random() * 6),
      ])
      count++
      if (count >= spins) {
        clearInterval(spinInterval)
        setWheels(finalSpin)
      }
    }, interval)
  }

  const handleSpin = async () => {
    if (!profile) return
    setSpinLoading(true)
    setSpinResult(null)
    setErrorMsg(null)
    profile.coins -= 10
    animateWheels([0, 0, 0])
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
        setTimeout(() => {
          setSpinResult(data)
          setWheels(data.spin)
          setProfile(prev => ({ ...prev, coins: data.coins }))
          setSpinLoading(false)
        }, 900)
        return
      }
    } catch (err) {
      setErrorMsg('Spin failed: ' + err.message)
    }
    setSpinLoading(false)
  }

  if (errorMsg) return <div className="centered"><p style={{ color: 'red' }}>{errorMsg}</p></div>
  if (showProfileForm) {
    return (
      <div className="centered">
        <form onSubmit={handleProfileCreate} className="profile-card">
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
      </div>
    )
  }
  if (!profile) return <div className="centered"><p>Loading profile...</p></div>

  return (
    <div className="centered">
      <div className="profile-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Welcome, {profile.username || 'Player'}!</h2>
          <button onClick={handleLogout} style={{ fontSize: '1rem' }}>Logout</button>
        </div>
        <SlotMachine
          coins={profile.coins}
          onSpin={handleSpin}
          spinLoading={spinLoading}
          spinResult={spinResult}
          wheels={wheels}
        />
      </div>
    </div>
  )
}
