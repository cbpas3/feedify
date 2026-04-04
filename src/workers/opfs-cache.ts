/// <reference lib="webworker" />

const MODEL_DIR_NAME = 'feedify-models'

async function getModelDir(): Promise<FileSystemDirectoryHandle> {
  const root = await navigator.storage.getDirectory()
  return root.getDirectoryHandle(MODEL_DIR_NAME, { create: true })
}

function modelFileName(version: string): string {
  return `gemma4-${version}.task`
}

/**
 * Check if a model version is cached and has the expected byte size.
 * Returns the file handle if valid, null otherwise.
 */
export async function checkModelCache(
  version: string,
  expectedBytes?: number
): Promise<FileSystemFileHandle | null> {
  try {
    const dir = await getModelDir()
    const fileHandle = await dir.getFileHandle(modelFileName(version))
    if (expectedBytes !== undefined) {
      const file = await fileHandle.getFile()
      if (file.size !== expectedBytes) {
        console.warn(`[OPFS] Cache size mismatch: expected ${expectedBytes}, got ${file.size}. Evicting.`)
        await dir.removeEntry(modelFileName(version))
        return null
      }
    }
    return fileHandle
  } catch {
    return null
  }
}

/**
 * Stream-write a model file to OPFS from a ReadableStream.
 * Never materializes the full buffer in memory.
 */
export async function writeModelToCache(
  version: string,
  stream: ReadableStream<Uint8Array>
): Promise<void> {
  const dir = await getModelDir()
  const fileHandle = await dir.getFileHandle(modelFileName(version), { create: true })
  const writable = await fileHandle.createWritable()
  try {
    const reader = stream.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      await writable.write(value)
    }
    await writable.close()
  } catch (err) {
    await writable.abort()
    // Clean up partial write
    try { await (await getModelDir()).removeEntry(modelFileName(version)) } catch {}
    throw err
  }
}

/**
 * Read the cached model as an ArrayBuffer.
 */
export async function readModelFromCache(version: string): Promise<ArrayBuffer> {
  const dir = await getModelDir()
  const fileHandle = await dir.getFileHandle(modelFileName(version))
  const file = await fileHandle.getFile()
  return file.arrayBuffer()
}

/**
 * Delete a cached model version (e.g. for cache eviction on version upgrade).
 */
export async function evictModelCache(version: string): Promise<void> {
  try {
    const dir = await getModelDir()
    await dir.removeEntry(modelFileName(version))
  } catch {
    // Ignore if already gone
  }
}
