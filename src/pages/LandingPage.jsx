import { useState } from 'react'
import LoginForm    from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'

export default function LandingPage() {
  const [tab, setTab] = useState('login')

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* BG glows */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position:'absolute', top:'-10%', left:'-5%', width:400, height:400, background:'rgba(0,212,255,0.08)', borderRadius:'50%', filter:'blur(80px)' }} />
        <div style={{ position:'absolute', bottom:'-10%', right:'-5%', width:400, height:400, background:'rgba(0,255,135,0.07)', borderRadius:'50%', filter:'blur(80px)' }} />
      </div>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: '#12121A', border: '1px solid #1E1E2E',
          borderRadius: 9999, padding: '0.25rem 1rem', marginBottom: '1rem',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FF87', display: 'inline-block', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.7rem', color: '#8888AA', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'DM Sans, sans-serif' }}>
            USA · CAN · MEX · 2026
          </span>
        </div>
        <h1 className="font-display neon-green" style={{ fontSize: 'clamp(3rem, 10vw, 5rem)', lineHeight: 1, color: '#00FF87', letterSpacing: '0.05em' }}>
          QUINIELA<br />WC 2026
        </h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif', color: '#8888AA', fontSize: '0.9rem', marginTop: '0.75rem' }}>
          Predice · Compite · Gana
        </p>
      </div>

      {/* Auth card */}
      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div className="glass-card" style={{ padding: 4 }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: '#06060A', borderRadius: '0.875rem', padding: 4, gap: 4, marginBottom: 4 }}>
            {[['login','Iniciar Sesión'],['register','Crear Cuenta']].map(([k, label]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                flex: 1, padding: '0.625rem', borderRadius: '0.75rem', border: 'none',
                fontFamily: 'DM Sans, sans-serif', fontSize: '0.875rem', fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
                background: tab === k ? '#12121A' : 'transparent',
                color: tab === k ? '#00FF87' : '#555570',
              }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ padding: '1.25rem' }}>
            {tab === 'login'
              ? <LoginForm />
              : <RegisterForm onSuccess={() => setTab('login')} />
            }
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.7rem', color: '#555570', marginTop: '1rem', fontFamily: 'DM Sans, sans-serif' }}>
          Powered by Supabase · Deployado en Vercel
        </p>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
