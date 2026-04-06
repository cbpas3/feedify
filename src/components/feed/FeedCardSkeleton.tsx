export function FeedCardSkeleton() {
  return (
    <div
      className="feed-item flex flex-col px-6 pt-16 pb-5"
      style={{ background: 'var(--color-card-bg)' }}
    >
      {/* Type label */}
      <div
        className="mb-4 w-16 h-3 rounded-full"
        style={{ background: 'oklch(20% 0.008 260)', animation: 'pulse 1.8s ease-in-out infinite' }}
      />

      {/* Headline */}
      <div className="space-y-2.5 mb-6">
        <div className="h-8 w-full rounded-lg" style={{ background: 'oklch(18% 0.008 260)', animation: 'pulse 1.8s ease-in-out infinite 0.1s' }} />
        <div className="h-8 w-3/4 rounded-lg" style={{ background: 'oklch(18% 0.008 260)', animation: 'pulse 1.8s ease-in-out infinite 0.2s' }} />
      </div>

      {/* Visual block */}
      <div className="flex-1 flex flex-col justify-center gap-4">
        <div className="h-28 w-full rounded-xl" style={{ background: 'oklch(16% 0.008 260)', animation: 'pulse 1.8s ease-in-out infinite 0.15s' }} />
        <div className="space-y-2">
          <div className="h-3.5 w-full rounded-full" style={{ background: 'oklch(18% 0.008 260)', animation: 'pulse 1.8s ease-in-out infinite 0.25s' }} />
          <div className="h-3.5 w-2/3 rounded-full" style={{ background: 'oklch(18% 0.008 260)', animation: 'pulse 1.8s ease-in-out infinite 0.35s' }} />
        </div>
      </div>

      {/* Actions */}
      <div className="pt-5 space-y-4">
        <div className="h-px w-full" style={{ background: 'oklch(18% 0.008 260)' }} />
        <div className="flex gap-3">
          <div className="flex-1 h-11 rounded-full" style={{ background: 'oklch(16% 0.008 260)', animation: 'pulse 1.8s ease-in-out infinite 0.3s' }} />
          <div className="flex-1 h-11 rounded-full" style={{ background: 'oklch(16% 0.008 260)', animation: 'pulse 1.8s ease-in-out infinite 0.4s' }} />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>
    </div>
  )
}
