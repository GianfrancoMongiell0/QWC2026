import { useState, useEffect } from 'react'
import Modal from '../ui/Modal'

const STORAGE_KEY = 'wc26_knockout_info_seen'

export default function KnockoutInfoModal({ userId }) {
  const [open, setOpen] = useState(false)
  const key = `${STORAGE_KEY}_${userId}`

  useEffect(() => {
    if (userId && !localStorage.getItem(key)) setOpen(true)
  }, [userId, key])

  const handleClose = () => {
    localStorage.setItem(key, 'true')
    setOpen(false)
  }

  return (
    <Modal open={open} onClose={handleClose} title="⚽ ¿Cómo se puntúa la eliminatoria?">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

        <div style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '0.875rem', padding: '1rem' }}>
          <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#00D4FF', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
            📊 Lo que cuenta es el MARCADOR
          </p>
          <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#8888AA', fontSize: '0.8rem', lineHeight: 1.6 }}>
            Tus puntos se calculan comparando el <strong style={{ color: '#F0F0FF' }}>marcador que predijiste</strong> para
            cada partido eliminatorio contra el <strong style={{ color: '#F0F0FF' }}>marcador real</strong> de ese partido.
          </p>
        </div>

        <div style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '0.875rem', padding: '1rem' }}>
          <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#8B5CF6', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
            🔮 Los equipos de tu bracket son tu visión
          </p>
          <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#8888AA', fontSize: '0.8rem', lineHeight: 1.6 }}>
            Los equipos que ves en tu eliminatoria vienen de <strong style={{ color: '#F0F0FF' }}>tus predicciones de grupos</strong>.
            Si en la realidad clasificaron otros equipos, no importa: tu predicción de marcador
            sigue compitiendo contra el resultado real del partido.
          </p>
        </div>

        <div style={{ background: '#12121A', border: '1px solid #1E1E2E', borderRadius: '0.875rem', padding: '1rem' }}>
          <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#FFD700', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
            💡 Ejemplo
          </p>
          <p style={{ fontFamily: 'DM Sans,sans-serif', color: '#8888AA', fontSize: '0.8rem', lineHeight: 1.6 }}>
            Tu bracket dice <strong style={{ color: '#F0F0FF' }}>Portugal vs Croacia</strong> y predijiste <strong style={{ color: '#F0F0FF' }}>2-1</strong>.
            El partido real fue <strong style={{ color: '#F0F0FF' }}>Francia vs Paraguay 2-1</strong>.
            Como el marcador coincide → <strong style={{ color: '#00FF87' }}>⭐ 3 puntos</strong>, sin importar los equipos.
          </p>
        </div>

        <button onClick={handleClose} className="btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.875rem' }}>
          Entendido ✓
        </button>
      </div>
    </Modal>
  )
}