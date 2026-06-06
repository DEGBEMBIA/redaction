import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Classes from './pages/Classes'
import Exercises from './pages/Exercises'
import Criteria from './pages/Criteria'
import Submissions from './pages/Submissions'
import Grading from './pages/Grading'
import Progress from './pages/Progress'
import ExportPage from './pages/ExportPage'
import LoginPage from './pages/LoginPage'

type Page = 'dashboard' | 'students' | 'classes' | 'exercises' | 'criteria' | 'submissions' | 'grading' | 'progress' | 'export'

const navigation = [
  { id: 'dashboard' as Page, label: 'Tableau de bord', icon: '📊' },
  { id: 'students' as Page, label: 'Élèves', icon: '👨‍🎓' },
  { id: 'classes' as Page, label: 'Classes', icon: '🏫' },
  { id: 'exercises' as Page, label: 'Exercices', icon: '📝' },
  { id: 'criteria' as Page, label: "Grille d'évaluation", icon: '📋' },
  { id: 'submissions' as Page, label: 'Soumissions', icon: '📤' },
  { id: 'grading' as Page, label: 'Notation', icon: '✏️' },
  { id: 'progress' as Page, label: 'Progression', icon: '📈' },
  { id: 'export' as Page, label: 'Export', icon: '📥' },
]

function AppContent() {
  const { isAuthenticated, loading, user, logout } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📝</div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />
      case 'students': return <Students />
      case 'classes': return <Classes />
      case 'exercises': return <Exercises />
      case 'criteria': return <Criteria />
      case 'submissions': return <Submissions onGrade={(id) => { setGradingSubmissionId(id); setCurrentPage('grading'); }} />
      case 'grading': return <Grading submissionId={gradingSubmissionId} />
      case 'progress': return <Progress />
      case 'export': return <ExportPage />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-5 border-b border-gray-200">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <span>📝</span> Suivi Rédaction
          </h1>
          <p className="text-xs text-gray-500 mt-1">Accompagnement des élèves</p>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentPage === item.id
                  ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        {/* User info & Logout */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-sm">
              {user?.full_name?.charAt(0) || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name || 'Professeur'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <span>🚪</span> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
