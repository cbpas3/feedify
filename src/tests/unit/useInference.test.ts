import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useInference } from '@/hooks/useInference'

// Mock the worker-client module
vi.mock('@/lib/worker-client', () => ({
  getWorkerProxy: vi.fn(),
  terminateWorker: vi.fn(),
}))

import { getWorkerProxy, terminateWorker } from '@/lib/worker-client'

const mockValidItems = [
  {
    hook: 'Test hook',
    body: 'Test body text',
    visual_type: 'TIP' as const,
    visual_code: null,
    order_index: 0,
  },
]

function createMockProxy(overrides: Partial<{
  isReady: () => Promise<boolean>
  loadModel: (cb: (p: number) => void) => Promise<void>
  runInference: (text: string, cb: (t: string) => void) => Promise<typeof mockValidItems>
}> = {}) {
  return {
    isReady: vi.fn().mockResolvedValue(false),
    loadModel: vi.fn().mockImplementation(async (cb: (p: number) => void) => {
      cb(50)
      cb(100)
    }),
    runInference: vi.fn().mockImplementation(async (_text: string, _cb: (t: string) => void) => {
      return mockValidItems
    }),
    ...overrides,
  }
}

describe('useInference', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in idle state', () => {
    vi.mocked(getWorkerProxy).mockReturnValue(createMockProxy() as any)
    const { result } = renderHook(() => useInference())
    expect(result.current.status).toBe('idle')
    expect(result.current.error).toBeNull()
    expect(result.current.result).toBeNull()
  })

  it('transitions through loading-model → model-ready → inferring → done', async () => {
    const proxy = createMockProxy()
    vi.mocked(getWorkerProxy).mockReturnValue(proxy as any)

    const { result } = renderHook(() => useInference())

    let inferenceResult: typeof mockValidItems | null = null
    await act(async () => {
      inferenceResult = await result.current.run('Some text about TypeScript', 'source-1')
    })

    expect(result.current.status).toBe('done')
    expect(inferenceResult).toEqual(mockValidItems)
    expect(result.current.result).toEqual(mockValidItems)
    expect(proxy.loadModel).toHaveBeenCalled()
    expect(proxy.runInference).toHaveBeenCalledWith('Some text about TypeScript', expect.any(Function))
  })

  it('skips loadModel when model is already ready', async () => {
    const proxy = createMockProxy({ isReady: vi.fn().mockResolvedValue(true) })
    vi.mocked(getWorkerProxy).mockReturnValue(proxy as any)

    const { result } = renderHook(() => useInference())

    await act(async () => {
      await result.current.run('text', 'source-1')
    })

    expect(proxy.loadModel).not.toHaveBeenCalled()
    expect(result.current.status).toBe('done')
  })

  it('sets error status when worker throws', async () => {
    const proxy = createMockProxy({
      isReady: vi.fn().mockResolvedValue(false),
      loadModel: vi.fn().mockRejectedValue(new Error('WASM failed to load')),
    })
    vi.mocked(getWorkerProxy).mockReturnValue(proxy as any)

    const { result } = renderHook(() => useInference())

    await act(async () => {
      await result.current.run('text', 'source-1')
    })

    expect(result.current.status).toBe('error')
    expect(result.current.error).toBe('WASM failed to load')
  })

  it('reset() returns to idle state', async () => {
    const proxy = createMockProxy({ isReady: vi.fn().mockResolvedValue(true) })
    vi.mocked(getWorkerProxy).mockReturnValue(proxy as any)

    const { result } = renderHook(() => useInference())

    await act(async () => {
      await result.current.run('text', 'source-1')
    })

    expect(result.current.status).toBe('done')

    act(() => {
      result.current.reset()
    })

    expect(result.current.status).toBe('idle')
    expect(result.current.result).toBeNull()
  })

  it('calls terminateWorker on unmount', () => {
    vi.mocked(getWorkerProxy).mockReturnValue(createMockProxy() as any)
    const { unmount } = renderHook(() => useInference())
    unmount()
    expect(terminateWorker).toHaveBeenCalled()
  })
})
