import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock window.location.reload using spy
const reloadMock = vi.fn()
Object.defineProperty(window, 'location', {
  value: { reload: reloadMock },
  writable: true,
})

describe('API Service', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.restoreAllMocks()
  })

  it('should include auth token in request headers when token exists', async () => {
    localStorageMock.setItem('redaction_auth_token', 'test-token-123')

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([{ id: 1, name: 'Test Class' }]),
    })

    // Dynamic import to get fresh module
    const api = await import('./api')
    await api.getClasses()

    expect(global.fetch).toHaveBeenCalledWith('/api/classes', expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-token-123',
        'Content-Type': 'application/json',
      }),
    }))
  })

  it('should not include auth header when no token', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    })

    const api = await import('./api')
    await api.getClasses()

    const callHeaders = (global.fetch as any).mock.calls[0][1].headers
    expect(callHeaders['Authorization']).toBeUndefined()
    expect(callHeaders['Content-Type']).toBe('application/json')
  })

  it('should throw error on failed request', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Bad request' }),
    })

    const api = await import('./api')
    await expect(api.getClasses()).rejects.toThrow('Bad request')
  })

  it('should clear auth and reload on 401', async () => {
    localStorageMock.setItem('redaction_auth_token', 'expired-token')
    localStorageMock.setItem('redaction_auth_user', JSON.stringify({ id: 1 }))

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Token invalide' }),
    })

    const api = await import('./api')
    await expect(api.getClasses()).rejects.toThrow('Token invalide')

    expect(localStorageMock.getItem('redaction_auth_token')).toBeNull()
    expect(window.location.reload).toHaveBeenCalled()
  })

  it('should make POST request with body', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 1, name: 'New Class' }),
    })

    const api = await import('./api')
    await api.createClass({ name: 'New Class', level: 'Collège' })

    expect(global.fetch).toHaveBeenCalledWith('/api/classes', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ name: 'New Class', level: 'Collège' }),
    }))
  })

  it('should make DELETE request', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })

    const api = await import('./api')
    await api.deleteClass(1)

    expect(global.fetch).toHaveBeenCalledWith('/api/classes/1', expect.objectContaining({
      method: 'DELETE',
    }))
  })
})
