import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { SYMBOLS_MAP, WIN_TABLE_DISPLAY, formatCombo } from './winTable'
import '../styles/Profile.css' // Assuming you have some styles for the profile

export default function Profile({ onLogout }) {
  const [profile, setProfile] = useState(null)
  const [errorMsg, setErrorMsg] = useState(null)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [username, setUsername] = useState('')
  const [spinResult, setSpinResult] = useState(null)
  const [spinLoading, setSpinLoading] = useState(false)
  const [wheels, setWheels] = useState([0, 0, 0])

  useEffect(() => {
    async function loadProfile() {
      setErrorMsg(null)
      const { data: userData } = await supabase.auth.getUser()
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
    setSpinLoading(true)
    setSpinResult(null)
    setErrorMsg(null)
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
        <p style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Coins: <span style={{ color: '#f39c12' }}>{profile.coins}</span></p>
        {/* Slot machine wheels */}
        <div className="slot-wheels">
          {wheels.map((n, i) => (
            <span className={`slot-wheel${spinLoading ? ' spinning' : ''}`} key={i}>{SYMBOLS_MAP[n]}</span>
          ))}
        </div>
        <button
          className="spin-btn"
          onClick={handleSpin}
          disabled={spinLoading || profile.coins < 10}
        >
          {spinLoading ? 'Spinning...' : 'Spin (10 coins)'}
        </button>
        {spinResult && (
          <div style={{ margin: '1rem 0' }}>
            <p style={{
              color: spinResult.win ? '#27ae60' : '#c0392b',
              fontWeight: 'bold',
              fontSize: '1.2rem'
            }}>
              {spinResult.win
                ? `🎉 You won ${spinResult.payout} coins!`
                : 'No win this time.'}
            </p>
          </div>
        )}
        {/* Winner table */}
        <h3 style={{ marginTop: '2rem' }}>Winner Table</h3>
        <table className="winner-table">
          <thead>
            <tr>
              <th>Combo</th>
              <th>Payout</th>
            </tr>
          </thead>
          <tbody>
            {WIN_TABLE_DISPLAY.map(row => (
              <tr key={row.combo.join('-')}>
                <td>{formatCombo(row.combo)}</td>
                <td>{row.payout}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
