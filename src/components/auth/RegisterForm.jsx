import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function RegisterForm({ onSuccess }) {
  const { signUp } = useAuth()
  const [form, setForm] = useState({ username: '', fullName: '', email: '', password: '', confirm: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.username.trim().length < 3) return setError('El usuario debe tener al menos 3 caracteres.')
    if (form.password.length < 6)        return setError('La contraseña debe tener al menos 6 caracteres.')
    if (form.password !== form.confirm)  return setError('Las contraseñas no coinciden.')

    setLoading(true)
    const { error } = await signUp({
      email:    form.email,
      password: form.password,
      username: form.username,
      fullName: form.fullName,
    })

    if (error) {
      const msg = error.message.includes('already registered')
        ? 'Este email ya está registrado.'
        : error.message
      setError(msg)
      setLoading(false)
      return
    }

    // Sin mensaje de verificación — ir directo al login o dashboard
    onSuccess?.()
    setLoading(false)
  }

  const fields = [
    { key: 'username',  label: 'Usuario',             type: 'text',     ph: 'pepe_futbolero' },
    { key: 'fullName',  label: 'Nombre completo',      type: 'text',     ph: 'José García' },
    { key: 'email',     label: 'Email',                type: 'email',    ph: 'tu@empresa.com' },
    { key: 'password',  label: 'Contraseña',           type: 'password', ph: '••••••••' },
    { key: 'confirm',   label: 'Confirmar contraseña', type: 'password', ph: '••••••••' },
  ]

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {fields.map(f => (
        <div key={f.key}>
          <label style={{ display: 'block', fontSize: '0.7rem', color: '#8888AA', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {f.label}
          </label>
          <input
            type={f.type} required value={form[f.key]}
            onChange={set(f.key)} placeholder={f.ph}
            className="input-field"
          />
        </div>
      ))}
      {error && (
        <div style={{ background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', borderRadius: '0.75rem', padding: '0.75rem 1rem' }}>
          <p style={{ color: '#FF3366', fontSize: '0.875rem' }}>{error}</p>
        </div>
      )}
      <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 4 }}>
        {loading ? 'Creando cuenta...' : 'Registrarme 🚀'}
      </button>
    </form>
  )
}
