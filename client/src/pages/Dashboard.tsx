import { useState, useEffect } from 'react'
import { getDashboardStats } from '../services/api'
import type { DashboardStats } from '../types'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']

function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await getDashboardStats()
      setStats(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-80 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-2">Erreur de connexion</h2>
          <p>{error}</p>
          <p className="mt-2 text-sm">Assurez-vous que le serveur backend est démarré (npm run dev dans /server).</p>
          <button onClick={loadStats} className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    { label: 'Élèves', value: stats.total_students, icon: '👨‍🎓', color: 'bg-blue-50 text-blue-600' },
    { label: 'Classes', value: stats.total_classes, icon: '🏫', color: 'bg-green-50 text-green-600' },
    { label: 'Exercices', value: stats.total_exercises, icon: '📝', color: 'bg-purple-50 text-purple-600' },
    { label: 'Soumissions', value: stats.total_submissions, icon: '📤', color: 'bg-orange-50 text-orange-600' },
  ]

  const pieData = stats.class_distribution.map((c) => ({ name: c.name, value: c.count }))
  const topStudentsData = stats.top_students.map((s, i) => ({ name: s.name, score: s.avg_score, rank: i + 1 }))

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500 mt-1">Vue d'ensemble de l'accompagnement en rédaction</p>
        </div>
        <button onClick={loadStats} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
          ↻ Actualiser
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${card.color}`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Score moyen */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Score moyen général</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#6366f1" strokeWidth="3"
                  strokeDasharray={`${stats.average_score}, 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{Math.round(stats.average_score)}%</span>
              </div>
            </div>
            <div className="text-gray-500 text-sm">
              <p>Basé sur l'ensemble des notes attribuées</p>
              <p className="mt-1">Score pondéré selon les critères</p>
            </div>
          </div>
        </div>

        {/* Répartition des classes (Pie Chart) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Répartition des élèves</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">Aucune donnée disponible</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Meilleurs élèves */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Meilleurs élèves</h2>
          {topStudentsData.length > 0 ? (
            <div className="space-y-3">
              {topStudentsData.map((s, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-indigo-400'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-900">{s.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-indigo-600">{Math.round(s.score)}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">Aucune note attribuée</p>
          )}
        </div>

        {/* Bar chart - Top students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Classement des scores</h2>
          {topStudentsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topStudentsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">Aucune donnée</p>
          )}
        </div>
      </div>

      {/* Soumissions récentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Soumissions récentes</h2>
        {stats.recent_submissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Élève</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Exercice</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_submissions.map((sub) => (
                  <tr key={sub.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{sub.student_name}</td>
                    <td className="py-3 px-4 text-gray-600">{sub.exercise_title}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(sub.submitted_at).toLocaleDateString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p>Aucune soumission pour le moment</p>
            <p className="text-sm mt-1">Créez des exercices et invitez les élèves à soumettre leurs travaux</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
