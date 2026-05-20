import { useState } from 'react'

export default function ShareLeagueButton({ league }) {
  const [copied, setCopied] = useState(false)

  if (!league) return null

  const appUrl  = window.location.origin
  const message = `⚽ ¡Únete a mi Quiniela del Mundial 2026!\n\nLiga: *${league.name}*\nCódigo: *${league.code}*\n\nEntra en ${appUrl} y usa el código para unirte. 🏆`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(league.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback para Safari/iOS
      const el = document.createElement('textarea')
      el.value = league.code
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener')
  }

  const handleNativeShare = async () => {
    if (!navigator.share) { handleCopy(); return }
    try {
      await navigator.share({
        title: `Quiniela WC 2026 — ${league.name}`,
        text:  message,
        url:   appUrl,
      })
    } catch {
      // Usuario canceló, no hacer nada
    }
  }

  const canNativeShare = !!navigator.share

  return (
    <div style={{
      background: 'rgba(0,212,255,0.05)',
      border: '1px solid rgba(0,212,255,0.2)',
      borderRadius: '1rem',
      padding: '1rem',
    }}>
      <p style={{ fontFamily:'DM Sans,sans-serif', color:'#8888AA', fontSize:'0.75rem', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.1em' }}>
        Invitar a la liga
      </p>

      {/* Código con botón copiar */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'0.75rem' }}>
        <div style={{
          flex:1, display:'flex', alignItems:'center', justifyContent:'center',
          background:'#06060A', border:'1px solid #1E1E2E', borderRadius:'0.75rem',
          padding:'0.625rem 1rem',
        }}>
          <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'1.5rem', fontWeight:700, color:'#F0F0FF', letterSpacing:'0.25em' }}>
            {league.code}
          </span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            padding:'0.625rem 1rem', borderRadius:'0.75rem', border:'1px solid',
            fontFamily:'DM Sans,sans-serif', fontSize:'0.8rem', fontWeight:600,
            cursor:'pointer', transition:'all 0.15s', flexShrink:0,
            borderColor: copied ? '#00FF87' : 'rgba(0,212,255,0.4)',
            background:  copied ? 'rgba(0,255,135,0.12)' : 'rgba(0,212,255,0.08)',
            color:       copied ? '#00FF87' : '#00D4FF',
          }}
        >
          {copied ? '✓ Copiado' : '📋 Copiar'}
        </button>
      </div>

      {/* Botones de compartir */}
      <div style={{ display:'flex', gap:'0.5rem' }}>
        <button
          onClick={handleWhatsApp}
          style={{
            flex:1, padding:'0.625rem', borderRadius:'0.75rem',
            border:'1px solid rgba(37,211,102,0.4)',
            background:'rgba(37,211,102,0.08)', color:'#25D366',
            fontFamily:'DM Sans,sans-serif', fontSize:'0.8rem', fontWeight:600,
            cursor:'pointer', transition:'all 0.15s', display:'flex',
            alignItems:'center', justifyContent:'center', gap:6,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,211,102,0.16)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,211,102,0.08)'}
        >
          <WhatsAppIcon />
          WhatsApp
        </button>

        <button
          onClick={canNativeShare ? handleNativeShare : handleCopy}
          style={{
            flex:1, padding:'0.625rem', borderRadius:'0.75rem',
            border:'1px solid rgba(139,92,246,0.4)',
            background:'rgba(139,92,246,0.08)', color:'#8B5CF6',
            fontFamily:'DM Sans,sans-serif', fontSize:'0.8rem', fontWeight:600,
            cursor:'pointer', transition:'all 0.15s', display:'flex',
            alignItems:'center', justifyContent:'center', gap:6,
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.16)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.08)'}
        >
          {canNativeShare ? '↑ Compartir' : '📋 Copiar mensaje'}
        </button>
      </div>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}
