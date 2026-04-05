/// <reference lib="webworker" />

import { expose } from 'comlink'
import { checkModelCache, writeModelToCache, readModelFromCache } from './opfs-cache'
import { buildPrompt, estimateCardCount } from './prompt-builder'
import { repairAndValidate } from './json-repair'
import { fetchWithProgress } from '@/lib/model-loader'
import type { ValidatedFeedItem } from '@/lib/schemas'

// Dynamic import — avoids bundling mediapipe into main chunk
// Will be initialized in loadModel()
let LlmInference: typeof import('@mediapipe/tasks-genai').LlmInference | null = null
let llmInstance: import('@mediapipe/tasks-genai').LlmInference | null = null

const MODEL_VERSION = process.env.NEXT_PUBLIC_GEMMA_MODEL_VERSION ?? 'gemma4-int4-v1'
const MODEL_URL = process.env.NEXT_PUBLIC_GEMMA_MODEL_URL ?? ''
const MODEL_SIZE_BYTES = parseInt(process.env.NEXT_PUBLIC_GEMMA_MODEL_SIZE_BYTES ?? '1400000000', 10)

class InferenceWorker {
  private modelReady = false

  /**
   * Load and initialize the Gemma 4 model.
   * Checks OPFS cache first; downloads and caches on miss.
   * @param onProgress - called with 0-100 during download, then 100 when init complete
   */
  async loadModel(onProgress: (percent: number) => void): Promise<void> {
    if (this.modelReady) {
      onProgress(100)
      return
    }

    try {
      // Dynamic import to avoid server-side bundling
      const mediapipe = await import('@mediapipe/tasks-genai')
      const { FilesetResolver, LlmInference: LlmInferenceClass } = mediapipe
      LlmInference = LlmInferenceClass

      // Resolve WASM fileset
      const genaiFileset = await FilesetResolver.forGenAiTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai/wasm'
      )

      // Check OPFS cache
      const cachedHandle = await checkModelCache(MODEL_VERSION, MODEL_SIZE_BYTES)

      if (cachedHandle) {
        // Fast path: model is cached — just initialize
        onProgress(95)
        const modelBuffer = await readModelFromCache(MODEL_VERSION)
        llmInstance = await LlmInference.createFromOptions(genaiFileset, {
          baseOptions: {
            modelAssetBuffer: new Uint8Array(modelBuffer),
          },
          maxTokens: 4096,
          topK: 40,
          temperature: 0.1, // Low temperature for more deterministic JSON output
          randomSeed: 42,
        })
      } else {
        // Slow path: download model and cache it
        if (!MODEL_URL) {
          throw new Error('NEXT_PUBLIC_GEMMA_MODEL_URL is not configured')
        }

        const stream = await fetchWithProgress(
          MODEL_URL,
          (percent, _loaded, _total) => {
            // Map download progress to 0-90%, leaving 90-100% for WASM init
            const mappedPercent = Math.round(percent * 0.9)
            onProgress(mappedPercent)
          }
        )

        // Write to OPFS while streaming (no full-buffer RAM spike)
        await writeModelToCache(MODEL_VERSION, stream)
        onProgress(90)

        // Read back from OPFS for initialization
        const modelBuffer = await readModelFromCache(MODEL_VERSION)
        onProgress(95)

        llmInstance = await LlmInference.createFromOptions(genaiFileset, {
          baseOptions: {
            modelAssetBuffer: new Uint8Array(modelBuffer),
          },
          maxTokens: 4096,
          topK: 40,
          temperature: 0.1,
          randomSeed: 42,
        })
      }

      this.modelReady = true
      onProgress(100)
    } catch (err) {
      this.modelReady = false
      llmInstance = null
      throw err
    }
  }

  /**
   * Run inference on raw text and return validated FeedItems.
   * @param rawText - the full article/document text
   * @param onToken - called with each generated token for streaming UI
   */
  async runInference(
    rawText: string,
    onToken: (token: string) => void
  ): Promise<ValidatedFeedItem[]> {
    if (!llmInstance) {
      throw new Error('Model not loaded. Call loadModel() first.')
    }

    const cardCount = estimateCardCount(rawText)
    const prompt = buildPrompt(rawText, cardCount)

    let fullOutput = ''

    // generateResponse streams tokens via the callback
    await llmInstance.generateResponse(prompt, (partialResult: string, _done: boolean) => {
      fullOutput += partialResult
      onToken(partialResult)
    })

    // Repair and validate the accumulated JSON output
    return repairAndValidate(fullOutput)
  }

  /**
   * Check if the model is loaded and ready for inference.
   */
  isReady(): boolean {
    return this.modelReady
  }
}

expose(new InferenceWorker())
