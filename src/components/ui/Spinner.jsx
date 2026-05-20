export default function Spinner({ size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '2px solid #1E1E2E', borderTopColor: '#00FF87',
      animation: 'spin 0.8s linear infinite', flexShrink: 0,
    }} />
  )
}
