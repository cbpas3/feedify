export default function FeedLoading() {
  return (
    <main style={{ height: '100dvh', overflow: 'hidden', background: '#0a0514' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}>
        <div style={{
          width: '2rem',
          height: '2rem',
          borderRadius: '50%',
          border: '2px solid oklch(58% 0.24 270)',
          borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    </main>
  )
}
