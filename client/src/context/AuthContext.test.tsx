import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import { type ReactNode } from 'react'

// Helper component to test the auth context
function TestComponent() {
  const { user, token, isAuthenticated, login, register, logout, loading } = useAuth()
  
  if (loading) return <div data-testid="loading">Chargement...</div>
  
  const handleLogin = async () => {
    try {
      await login('admin', 'admin123')
    } catch {
      // Error handled silently in test context
    }
  }
  
  const handleRegister = async () => {
    try {
      await register('new', 'new@test.com', 'pass123', 'New User')
    } catch {
      // Error handled silently
    }
  }
  
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Connecté' : 'Déconnecté'}</div>
      {user && <div data-testid="user-name">{user.full_name}</div>}
      {token && <div data-testid="has-token">Token présent</div>}
      <button data-testid="btn-login" onClick={handleLogin}>
        Login
      </button>
      <button data-testid="btn-register" onClick={handleRegister}>
        Register
      </button>
      <button data-testid="btn-logout" onClick={logout}>
        Logout
      </button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  )
}

const mockUser = { id: 1, username: 'admin', email: 'admin@test.com', full_name: 'Admin Test', role: 'admin' }
const mockToken = 'fake-jwt-token'

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('should start unauthenticated', async () => {
    renderWithProvider()
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Déconnecté')
    })
  })

  it('should login successfully', async () => {
    // Mock fetch to return successful login
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: mockToken, user: mockUser }),
    })

    renderWithProvider()
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Déconnecté')
    })

    await userEvent.click(screen.getByTestId('btn-login'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Connecté')
      expect(screen.getByTestId('user-name')).toHaveTextContent('Admin Test')
      expect(screen.getByTestId('has-token')).toHaveTextContent('Token présent')
    })

    // Check localStorage
    expect(localStorage.getItem('redaction_auth_token')).toBe(mockToken)
    expect(localStorage.getItem('redaction_auth_user')).toBe(JSON.stringify(mockUser))
  })

  it('should handle login failure', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Identifiants incorrects' }),
    })

    renderWithProvider()
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Déconnecté')
    })

    // Click login - the error is caught inside the component, so it shouldn't throw
    // Instead, verify the component stays disconnected
    await userEvent.click(screen.getByTestId('btn-login'))
    
    // Give time for the async operation to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Déconnecté')
    })
  })

  it('should logout successfully', async () => {
    // Setup: login first
    localStorage.setItem('redaction_auth_token', mockToken)
    localStorage.setItem('redaction_auth_user', JSON.stringify(mockUser))
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser),
    })

    renderWithProvider()
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Connecté')
    })

    // Logout
    await userEvent.click(screen.getByTestId('btn-logout'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Déconnecté')
    })

    // Check localStorage cleared
    expect(localStorage.getItem('redaction_auth_token')).toBeNull()
  })

  it('should restore session from localStorage', async () => {
    localStorage.setItem('redaction_auth_token', mockToken)
    localStorage.setItem('redaction_auth_user', JSON.stringify(mockUser))
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockUser),
    })

    renderWithProvider()
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Connecté')
      expect(screen.getByTestId('user-name')).toHaveTextContent('Admin Test')
    })
  })

  it('should clear session if token verification fails', async () => {
    localStorage.setItem('redaction_auth_token', 'expired-token')
    localStorage.setItem('redaction_auth_user', JSON.stringify(mockUser))
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Token invalide' }),
    })

    renderWithProvider()
    
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Déconnecté')
    })

    expect(localStorage.getItem('redaction_auth_token')).toBeNull()
  })

  it('should handle registration', async () => {
    const newUser = { id: 2, username: 'new', email: 'new@test.com', full_name: 'New User', role: 'teacher' }
    
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ token: 'new-token', user: newUser }),
    })

    renderWithProvider()
    
    await userEvent.click(screen.getByTestId('btn-register'))

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Connecté')
      expect(screen.getByTestId('user-name')).toHaveTextContent('New User')
    })
  })
})
