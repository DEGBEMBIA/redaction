import { useState, useEffect } from 'react'
import { getStudents, getClasses, getStudentProgress, getClassPerformance } from '../services/api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function Progress() {
  const [students, setStudents] = useState<any[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [selectedClass, setSelectedClass] = useState<number | null>(null)
  const [progress, setProgress] = useState<any[]>([])
  const [performance, setPerformance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStudents(), getClasses()]).then(([s, c]) => {
      setStudents(s)
      setClasses(c)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (selectedStudent) {
      getStudentProgress(selectedStudent).then(setProgress).catch(console.error)
    } else {
      setProgress([])
    }
  }, [selectedStudent])

  useEffect(() => {
    if (selectedClass) {
      getClassPerformance(selectedClass).then(setPerformance).catch(console.error)
    } else {
      setPerformance([])
    }
  }, [selectedClass])

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Progression</h1>
      <p className="text-gray-500 mb-6">Suivez l'évolution des élèves au fil du temps</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Élève</label>
          <select value={selectedStudent || ''} onChange={(e) => setSelectedStudent(Number(e.target.value) || null)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">Sélectionnez un élève</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Classe</label>
          <select value={selectedClass || ''} onChange={(e) => setSelectedClass(Number(e.target.value) || null)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">Sélectionnez une classe</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-72 bg-gray-100 rounded-xl"></div>
          <div className="h-72 bg-gray-100 rounded-xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Progression de l'élève</h2>
            {progress.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={progress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="exercise_title" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="overall_score" stroke="#6366f1" strokeWidth={2}
                      dot={{ fill: '#6366f1', strokeWidth: 2 }} name="Score global" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {progress.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="text-sm">
                        <span className="font-medium text-gray-900">{p.exercise_title}</span>
                        <span className="text-gray-400 ml-2">{new Date(p.submitted_at).toLocaleDateString('fr-FR')}</span>
                      </div>
                      <span className="text-sm font-bold text-indigo-600">{Math.round(p.overall_score)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-12">
                {selectedStudent ? "Aucune donnée de progression pour cet élève" : "Sélectionnez un élève"}
              </p>
            )}
          </div>

          {/* Class Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance de la classe</h2>
            {performance.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={performance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="student_name" width={150} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="avg_score" fill="#6366f1" radius={[0, 6, 6, 0]} name="Score moyen" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-center py-12">
                {selectedClass ? "Aucune donnée de performance pour cette classe" : "Sélectionnez une classe"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Criteria Breakdown for selected student */}
      {progress.length > 0 && progress[0].criteria_breakdown && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Détail par critère</h2>
          <div className="space-y-3">
            {progress.map((p: any, i: number) => {
              const breakdown = (p.criteria_breakdown || '').split('|').map((item: string) => {
                const [name, score, max] = item.split(/[:/]/)
                return { name, score: Number(score), max: Number(max) }
              })
              return (
                <div key={i} className="border border-gray-100 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{p.exercise_title}</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {breakdown.map((b: any, j: number) => (
                      <div key={j} className="flex items-center justify-between bg-gray-50 rounded px-3 py-1.5">
                        <span className="text-xs text-gray-500">{b.name}</span>
                        <span className="text-xs font-medium text-indigo-600">{b.score}/{b.max}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default Progress
