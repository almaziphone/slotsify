import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Profile({ onLogout }) {
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: userData } = await supabase.auth.getUser()
      const user = userData?.user
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) console.error(error)
      else setProfile(data)
    }

    loadProfile()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onLogout()
  }

  if (!profile) return <p>Loading profile...</p>

  return (
    <div>
      <h2>Welcome, {profile.username || 'Unnamed Player'}!</h2>
      <p>Coins: {profile.coins}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}
