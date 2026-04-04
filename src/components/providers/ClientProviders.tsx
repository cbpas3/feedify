'use client'

// This component exists solely to hold client-side overlay state at the root level.
// It receives children (the server-rendered page tree) and wraps them.
// Individual pages manage their own ModelLoadingOverlay instances; this slot
// is reserved for any future root-level client providers (e.g. theme, toast).
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
