import { useState } from 'react'
import { useJoinLeague } from '../../hooks/useLeague'
import Modal from '../ui/Modal'

export default function JoinLeagueModal({ open, onClose, onJoined }) {
  const { joinLeague, loading, error } = useJoinLeague()
  const [code, setCode] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const lg = await joinLeague(code)
    if (lg) { setCode(''); onJoined(lg) }
  }

  return (
    <Modal open={open} onClose={onClose} title="🔗 Unirme a una Liga">
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
        <div>
          <label style={{ display:'block', fontSize:'0.7rem', color:'#8888AA', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.1em' }}>Código de invitación</label>
          <input
            required minLength={6} maxLength={6}
            value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="WC7X2K"
            className="input-field"
            style={{ textAlign:'center', fontSize:'1.5rem', letterSpacing:'0.3em', fontFamily:'JetBrains Mono, monospace' }}
          />
        </div>
        {error && <p style={{ color:'#FF3366', fontSize:'0.875rem' }}>{error}</p>}
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancelar</button>
          <button type="submit" disabled={loading || code.length < 6} className="btn-primary" style={{ flex:1 }}>
            {loading ? 'Buscando...' : 'Unirme ⚡'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
