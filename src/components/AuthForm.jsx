import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function AuthForm({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const method = isLogin ? 'signInWithPassword' : 'signUp'
    const { data, error } = await supabase.auth[method]({ email, password })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
      return
    }

    // On signup, create a profile
    if (!isLogin && data?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ id: data.user.id, coins: 100, username: '' }])

      if (profileError) {
        setErrorMsg('Signup succeeded, but profile creation failed: ' + profileError.message)
        setLoading(false)
        return
      }
    }

    setLoading(false)
    onAuth(data)
  }

  return (
    <div className="auth-form">
      <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>
          {loading ? 'Loading...' : isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: 'pointer', color: 'blue' }}>
        {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
      </p>
    </div>
  )
}
