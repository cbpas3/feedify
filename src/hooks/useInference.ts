'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { proxy } from 'comlink'
import { getWorkerProxy, terminateWorker } from '@/lib/worker-client'
import type { ValidatedFeedItem } from '@/lib/schemas'

export type InferenceStatus =
  | 'idle'
  | 'loading-model'
  | 'model-ready'
  | 'inferring'
  | 'done'
  | 'error'

interface InferenceState {
  status: InferenceStatus
  modelProgress: number       // 0–100 during model download/init
  inferenceProgress: number   // 0–100 pseudo-progress during generation (token-driven)
  inferenceTokens: string     // accumulated streaming tokens
  tokenCount: number          // number of tokens generated so far
  error: string | null
  result: ValidatedFeedItem[] | null
  isCached: boolean           // true if model was loaded from OPFS cache
}

interface UseInferenceReturn extends InferenceState {
  run: (rawText: string, sourceId: string) => Promise<ValidatedFeedItem[] | null>
  reset: () => void
}

// Gemma 4 E2B generates roughly 500–2000 tokens for a 10-card response.
// We use 1500 as the denominator for the pseudo-progress bar.
const ESTIMATED_MAX_TOKENS = 1500

const INITIAL_STATE: InferenceState = {
  status: 'idle',
  modelProgress: 0,
  inferenceProgress: 0,
  inferenceTokens: '',
  tokenCount: 0,
  error: null,
  result: null,
  isCached: false,
}

export function useInference(): UseInferenceReturn {
  const [state, setState] = useState<InferenceState>(INITIAL_STATE)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      terminateWorker()
    }
  }, [])

  const safeSet = useCallback(
    (updater: Partial<InferenceState> | ((prev: InferenceState) => InferenceState)) => {
      if (!mountedRef.current) return
      setState((prev) =>
        typeof updater === 'function' ? updater(prev) : { ...prev, ...updater }
      )
    },
    []
  )

  const run = useCallback(
    async (rawText: string, _sourceId: string): Promise<ValidatedFeedItem[] | null> => {
      try {
        const workerProxy = getWorkerProxy()

        // Phase 1: load / init model if not already ready
        const isReady = await workerProxy.isReady()

        if (!isReady) {
          safeSet({ status: 'loading-model', modelProgress: 0, isCached: false })

          // Track whether the cached fast-path fired:
          // The worker calls onProgress(95) immediately when the model is cached,
          // before any download progress is reported. We detect this by watching
          // for a jump straight to 95 while modelProgress is still near 0.
          let firstProgressValue: number | null = null

          await workerProxy.loadModel(
            proxy((percent: number) => {
              if (!mountedRef.current) return
              // Detect cached path: first reported value is 95 (no download phase)
              if (firstProgressValue === null) {
                firstProgressValue = percent
              }
              const isCached = firstProgressValue === 95
              safeSet({ modelProgress: percent, isCached })
            })
          )
        }

        safeSet({ status: 'model-ready', modelProgress: 100 })

        // Phase 2: run inference with streaming tokens
        safeSet({ status: 'inferring', inferenceTokens: '', tokenCount: 0, inferenceProgress: 0 })

        const items = await workerProxy.runInference(
          rawText,
          proxy((token: string) => {
            if (!mountedRef.current) return
            setState((prev) => {
              const newCount = prev.tokenCount + 1
              const inferenceProgress = Math.min(99, Math.round((newCount / ESTIMATED_MAX_TOKENS) * 100))
              return {
                ...prev,
                inferenceTokens: prev.inferenceTokens + token,
                tokenCount: newCount,
                inferenceProgress,
              }
            })
          })
        )

        safeSet({ status: 'done', result: items })
        return items
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        safeSet({ status: 'error', error: message })
        return null
      }
    },
    [safeSet]
  )

  const reset = useCallback(() => {
    safeSet(INITIAL_STATE)
  }, [safeSet])

  return { ...state, run, reset }
}
