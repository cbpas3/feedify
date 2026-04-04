/**
 * Fetch a URL with streaming download progress callbacks.
 * Used to download the Gemma 4 model binary while showing progress to the user.
 */
export async function fetchWithProgress(
  url: string,
  onProgress: (percent: number, bytesLoaded: number, bytesTotal: number) => void,
  signal?: AbortSignal
): Promise<ReadableStream<Uint8Array>> {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Failed to fetch model: ${response.status} ${response.statusText}`)
  }

  if (!response.body) {
    throw new Error('Response body is null')
  }

  const contentLength = response.headers.get('Content-Length')
  const totalBytes = contentLength ? parseInt(contentLength, 10) : 0

  let loadedBytes = 0

  const progressStream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      loadedBytes += chunk.byteLength
      const percent = totalBytes > 0 ? Math.round((loadedBytes / totalBytes) * 100) : 0
      onProgress(percent, loadedBytes, totalBytes)
      controller.enqueue(chunk)
    },
  })

  return response.body.pipeThrough(progressStream)
}

/**
 * Estimate download progress when Content-Length is not available.
 * Uses a known model size constant as the denominator.
 */
export function estimateProgressFromSize(
  bytesLoaded: number,
  knownModelSizeBytes: number
): number {
  return Math.min(99, Math.round((bytesLoaded / knownModelSizeBytes) * 100))
}
