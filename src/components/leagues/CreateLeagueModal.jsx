import { useState } from 'react'
import { useCreateLeague } from '../../hooks/useLeague'
import Modal from '../ui/Modal'

export default function CreateLeagueModal({ open, onClose, onCreated }) {
  const { createLeague, loading, error } = useCreateLeague()
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const lg = await createLeague({ name, description: desc })
    if (lg) { setName(''); setDesc(''); onCreated(lg) }
  }

  return (
    <Modal open={open} onClose={onClose} title="🏆 Crear Nueva Liga">
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
        <div>
          <label style={{ display:'block', fontSize:'0.7rem', color:'#8888AA', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.1em' }}>Nombre *</label>
          <input required minLength={3} value={name} onChange={e=>setName(e.target.value)} placeholder="Los Cracks del Depto." className="input-field" />
        </div>
        <div>
          <label style={{ display:'block', fontSize:'0.7rem', color:'#8888AA', marginBottom:5, textTransform:'uppercase', letterSpacing:'0.1em' }}>Descripción (opcional)</label>
          <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Descripción breve..." className="input-field" />
        </div>
        <div style={{ background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', borderRadius:'0.75rem', padding:'0.75rem' }}>
          <p style={{ fontSize:'0.75rem', color:'#00D4FF', fontFamily:'DM Sans, sans-serif' }}>
            💡 Se generará un código de 6 letras para que otros se unan.
          </p>
        </div>
        {error && <p style={{ color:'#FF3366', fontSize:'0.875rem' }}>{error}</p>}
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ flex:1 }}>Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary" style={{ flex:1 }}>
            {loading ? 'Creando...' : 'Crear Liga'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
