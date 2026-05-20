import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function LoginForm() {
  const { signIn } = useAuth()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn({ email, password })
    if (error) setError(error.message === 'Invalid login credentials'
      ? 'Email o contraseña incorrectos.'
      : error.message)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.7rem', color: '#8888AA', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Email
        </label>
        <input
          type="email" required value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="tu@empresa.com"
          className="input-field"
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '0.7rem', color: '#8888AA', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Contraseña
        </label>
        <input
          type="password" required value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          className="input-field"
        />
      </div>
      {error && (
        <div style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
          <p style={{ color: '#FF3366', fontSize: '0.875rem' }}>{error}</p>
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
        {loading ? 'Entrando...' : 'Entrar ⚽'}
      </button>
    </form>
  )
}
