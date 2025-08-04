import { FormEvent, useState } from 'react'

interface AuthFormProps {
  onAuth: (data: unknown) => void
}

export default function AuthForm({ onAuth }: AuthFormProps) {
  const [username, setUsername] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [isLogin, setIsLogin] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    try {
      const endpoint = isLogin ? '/.netlify/functions/signInWithPassword' : '/.netlify/functions/createProfile'
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })

      const { data, error } = await response.json()

      if (!response.ok) {
        setErrorMsg(error?.message ?? 'Сервер недоступен. Попробуйте позже.')
        return
      }

      if (error) {
        setErrorMsg(
          error.code === 'invalid_credentials'
            ? 'Неверный логин или пароль'
            : 'Ошибка при попытке аутентификации.'
        )
        return
      }

      setIsLogin(!isLogin)
      onAuth(data) // data contains user, session, and profile
    } catch {
      setErrorMsg('Ошибка сети. Проверьте подключение.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-form">
      <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
      <form onSubmit={handleSubmit}>
        {isLogin ? null : (
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} required />
        )}
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
