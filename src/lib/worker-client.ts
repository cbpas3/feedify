import { wrap, type Remote } from 'comlink'

// TypeScript interface matching the InferenceWorker class (avoid importing the worker directly)
interface IInferenceWorker {
  loadModel(onProgress: (percent: number) => void): Promise<void>
  runInference(rawText: string, onToken: (token: string) => void): Promise<import('@/lib/schemas').ValidatedFeedItem[]>
  isReady(): Promise<boolean>
}

let workerInstance: Worker | null = null
let workerProxy: Remote<IInferenceWorker> | null = null

/**
 * Get (or create) the singleton Comlink Worker proxy.
 * The Worker is lazily created on first call.
 */
export function getWorkerProxy(): Remote<IInferenceWorker> {
  if (!workerProxy) {
    // Static URL pattern — webpack detects this and emits a separate bundle
    workerInstance = new Worker(
      new URL('../workers/inference.worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerProxy = wrap<IInferenceWorker>(workerInstance)
  }
  return workerProxy
}

/**
 * Terminate the Worker and clean up references.
 * Call this in useEffect cleanup to avoid memory leaks.
 */
export function terminateWorker(): void {
  workerInstance?.terminate()
  workerInstance = null
  workerProxy = null
}
