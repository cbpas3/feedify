import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock Worker global — JSDOM has no Worker implementation
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  postMessage(_data: unknown) {}
  terminate() {}
  addEventListener(_type: string, _handler: EventListenerOrEventListenerObject) {}
  removeEventListener(_type: string, _handler: EventListenerOrEventListenerObject) {}
  dispatchEvent(_event: Event): boolean { return true }
}
vi.stubGlobal('Worker', MockWorker)

// Mock navigator.storage (OPFS) — not available in JSDOM
const mockStorage = {
  getDirectory: vi.fn().mockResolvedValue({
    getDirectoryHandle: vi.fn().mockResolvedValue({
      getFileHandle: vi.fn().mockRejectedValue(new DOMException('Not found', 'NotFoundError')),
    }),
  }),
  estimate: vi.fn().mockResolvedValue({ quota: 1e10, usage: 0 }),
}
Object.defineProperty(navigator, 'storage', {
  value: mockStorage,
  writable: true,
  configurable: true,
})

// Suppress console.warn in tests (json-repair partial recovery logs)
vi.spyOn(console, 'warn').mockImplementation(() => {})
