import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '../context/AuthContext'

// Mock the auth context with controlled login/register
const mockLogin = vi.fn()
const mockRegister = vi.fn()
const mockLogout = vi.fn()

vi.mock('../context/AuthContext', async () => {
  const actual = await vi.importActual('../context/AuthContext')
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      token: null,
      loading: false,
      login: mockLogin,
      register: mockRegister,
      logout: mockLogout,
      isAuthenticated: false,
    }),
  }
})

// Re-import LoginPage after mocking
import LoginPage from './LoginPage'

function renderLoginPage() {
  return render(<LoginPage />)
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render the login form by default', () => {
    renderLoginPage()

    expect(screen.getByText('Suivi Rédaction')).toBeInTheDocument()
    expect(screen.getByText('Connexion')).toBeInTheDocument()
    expect(screen.getByText('Inscription')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ex: admin')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument()
  })

  it('should show default credentials hint', () => {
    renderLoginPage()

    expect(screen.getByText(/Compte par défaut/)).toBeInTheDocument()
    expect(screen.getByText('admin')).toBeInTheDocument()
    expect(screen.getByText('admin123')).toBeInTheDocument()
  })

  it('should switch to register mode when clicking Inscription tab', async () => {
    renderLoginPage()

    await userEvent.click(screen.getByText('Inscription'))

    expect(screen.getByPlaceholderText('ex: professeur1')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ex: professeur@ecole.fr')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('ex: Jean Dupont')).toBeInTheDocument()
    expect(screen.getByText('Créer un compte')).toBeInTheDocument()
    // Default credentials hint should not appear in register mode
    expect(screen.queryByText(/admin123/)).not.toBeInTheDocument()
  })

  it('should call login on form submission', async () => {
    mockLogin.mockResolvedValueOnce(undefined)
    renderLoginPage()

    await userEvent.type(screen.getByPlaceholderText('ex: admin'), 'testuser')
    await userEvent.type(screen.getByPlaceholderText('••••••'), 'password123')
    await userEvent.click(screen.getByText('Se connecter'))

    expect(mockLogin).toHaveBeenCalledWith('testuser', 'password123')
  })

  it('should show error message on login failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Identifiants incorrects'))
    renderLoginPage()

    await userEvent.type(screen.getByPlaceholderText('ex: admin'), 'testuser')
    await userEvent.type(screen.getByPlaceholderText('••••••'), 'wrongpass')
    await userEvent.click(screen.getByText('Se connecter'))

    await waitFor(() => {
      expect(screen.getByText('Identifiants incorrects')).toBeInTheDocument()
    })
  })

  it('should disable submit button while loading', async () => {
    // Don't resolve the promise immediately
    mockLogin.mockImplementationOnce(() => new Promise(() => {}))
    renderLoginPage()

    await userEvent.type(screen.getByPlaceholderText('ex: admin'), 'testuser')
    await userEvent.type(screen.getByPlaceholderText('••••••'), 'password123')
    await userEvent.click(screen.getByText('Se connecter'))

    expect(screen.getByText('Chargement...')).toBeDisabled()
  })

  it('should call register in register mode', async () => {
    mockRegister.mockResolvedValueOnce(undefined)
    renderLoginPage()

    // Switch to register
    await userEvent.click(screen.getByText('Inscription'))

    await userEvent.type(screen.getByPlaceholderText('ex: professeur1'), 'newteacher')
    await userEvent.type(screen.getByPlaceholderText('ex: professeur@ecole.fr'), 'teacher@school.fr')
    await userEvent.type(screen.getByPlaceholderText('ex: Jean Dupont'), 'Jean Dupont')
    await userEvent.type(screen.getByPlaceholderText('••••••'), 'securepass')
    await userEvent.click(screen.getByText('Créer un compte'))

    expect(mockRegister).toHaveBeenCalledWith('newteacher', 'teacher@school.fr', 'securepass', 'Jean Dupont')
  })

  it('should clear error when switching tabs', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Erreur test'))
    renderLoginPage()

    // Trigger error
    await userEvent.type(screen.getByPlaceholderText('ex: admin'), 'testuser')
    await userEvent.type(screen.getByPlaceholderText('••••••'), 'wrongpass')
    await userEvent.click(screen.getByText('Se connecter'))

    await waitFor(() => {
      expect(screen.getByText('Erreur test')).toBeInTheDocument()
    })

    // Switch tab - error should disappear
    await userEvent.click(screen.getByText('Inscription'))

    expect(screen.queryByText('Erreur test')).not.toBeInTheDocument()
  })
})
