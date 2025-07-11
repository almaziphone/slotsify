import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import AuthForm from './components/AuthForm'
import Profile from './components/Profile'

function App() {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener?.subscription.unsubscribe()
  }, [])

  const handleAuth = async (data) => {
    setSession(data.session)
    setUser(data.user)
    setProfile(data.profile)
    // Set session in Supabase client so getSession() works
    if (data.session) {
      await supabase.auth.setSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      })
    }
  }

  return (
    <div className="app">
      {session ? (
        <Profile
          user={user}
          profile={profile}
          onLogout={() => setSession(null)}
        />
      ) : (
        <AuthForm onAuth={handleAuth} />
      )}
    </div>
  )
}

export default App
