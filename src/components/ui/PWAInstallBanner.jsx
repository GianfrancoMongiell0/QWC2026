import { useState } from 'react'
import { usePWAInstall } from '../../hooks/usePWAInstall'

export default function PWAInstallBanner() {
  const { canInstall, isIOS, install } = usePWAInstall()
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa_banner_dismissed') === 'true'
  )

  if (!canInstall || dismissed) return null

  const handleDismiss = () => {
    localStorage.setItem('pwa_banner_dismissed', 'true')
    setDismissed(true)
  }

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      width: 'calc(100% - 2rem)', maxWidth: 480,
      background: '#12121A', border: '1px solid rgba(0,255,135,0.3)',
      borderRadius: '1rem', padding: '0.875rem 1rem',
      boxShadow: '0 0 30px rgba(0,255,135,0.15)',
      zIndex: 100, animation: 'slideUp 0.3s ease-out',
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
    }}>
      {/* Icono */}
      <div style={{
        width: 44, height: 44, borderRadius: '0.625rem', flexShrink: 0,
        background: 'rgba(0,255,135,0.1)', border: '1px solid rgba(0,255,135,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.375rem',
      }}>
        ⚽
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily:'DM Sans,sans-serif', fontWeight:600, color:'#F0F0FF', fontSize:'0.875rem' }}>
          Instalar Quiniela WC 2026
        </p>
        {isIOS ? (
          <p style={{ fontFamily:'DM Sans,sans-serif', color:'#8888AA', fontSize:'0.75rem', marginTop:3, lineHeight:1.4 }}>
            Toca <strong style={{color:'#00D4FF'}}>Compartir</strong> y luego{' '}
            <strong style={{color:'#00D4FF'}}>"Agregar a pantalla de inicio"</strong> para instalar la app.
          </p>
        ) : (
          <p style={{ fontFamily:'DM Sans,sans-serif', color:'#8888AA', fontSize:'0.75rem', marginTop:3 }}>
            Accede rápido desde tu pantalla de inicio, sin abrir el navegador.
          </p>
        )}

        {!isIOS && (
          <button
            onClick={install}
            style={{
              marginTop: '0.5rem', padding:'0.4rem 1rem',
              borderRadius:'0.625rem', border:'none',
              background:'#00FF87', color:'#0A0A0F',
              fontFamily:'DM Sans,sans-serif', fontWeight:600, fontSize:'0.8rem',
              cursor:'pointer', transition:'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Instalar app
          </button>
        )}
      </div>

      {/* Cerrar */}
      <button
        onClick={handleDismiss}
        style={{
          background:'none', border:'none', cursor:'pointer',
          color:'#555570', fontSize:'1rem', padding:'0.1rem',
          flexShrink:0, lineHeight:1,
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#F0F0FF'}
        onMouseLeave={e => e.currentTarget.style.color = '#555570'}
      >
        ✕
      </button>
    </div>
  )
}
