import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import AuthForm from './components/AuthForm'
import Profile from './components/Profile'

function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => listener?.subscription.unsubscribe()
  }, [])

  return (
    <div className="app">
      <h1>🎰 Welcome to Slotsify 🎰</h1>
      {session ? (
        <Profile onLogout={() => setSession(null)} />
      ) : (
        <AuthForm onAuth={(data) => setSession(data.session)} />
      )}
    </div>
  )
}

export default App
