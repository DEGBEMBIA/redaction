import { useState, useEffect } from 'react'
import { getSubmissions, getExercises, getStudents, createSubmission, deleteSubmission, getCriteria, saveGrades, generateAiFeedback } from '../services/api'
import type { Submission, Exercise, Student, EvaluationCriterion } from '../types'

function Submissions({ onGrade }: { onGrade: (id: number) => void }) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ exercise_id: 0, student_id: 0, content: '' })
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null)
  const [aiFeedback, setAiFeedback] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [filterExercise, setFilterExercise] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [subs, exs, sts] = await Promise.all([getSubmissions(), getExercises(), getStudents()])
      setSubmissions(subs)
      setExercises(exs)
      setStudents(sts)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setForm({ exercise_id: 0, student_id: 0, content: '' })
    setShowModal(true)
  }

  const handleCreate = async () => {
    if (!form.exercise_id || !form.student_id) return
    try {
      await createSubmission(form)
      setShowModal(false)
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette soumission ?')) return
    try {
      await deleteSubmission(id)
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleView = async (sub: Submission) => {
    try {
      // Fetch full submission details
      const res = await fetch(`/api/submissions/${sub.id}`)
      const fullSub = await res.json()
      setSelectedSub(fullSub)
      setAiFeedback('')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleAiFeedback = async (submissionId: number) => {
    setAiLoading(true)
    try {
      const result = await generateAiFeedback(submissionId)
      setAiFeedback(result.feedback)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const filtered = filterExercise
    ? submissions.filter((s) => s.exercise_id === Number(filterExercise))
    : submissions

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Soumissions</h1>
          <p className="text-gray-500 mt-1">{submissions.length} soumission(s)</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm">
          + Nouvelle soumission
        </button>
      </div>

      <div className="mb-4">
        <select value={filterExercise} onChange={(e) => setFilterExercise(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
          <option value="">Tous les exercices</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>{ex.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-500">Élève</th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">Exercice</th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">Date</th>
                <th className="text-right py-3 px-6 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sub) => (
                <tr key={sub.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900">{sub.student_name}</td>
                  <td className="py-4 px-6 text-gray-700">{sub.exercise_title}</td>
                  <td className="py-4 px-6 text-gray-500">{new Date(sub.submitted_at).toLocaleDateString('fr-FR')}</td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => handleView(sub)} className="text-indigo-600 hover:text-indigo-800 mr-3 font-medium">Détails</button>
                    <button onClick={() => onGrade(sub.id)} className="text-green-600 hover:text-green-800 mr-3 font-medium">Noter</button>
                    <button onClick={() => handleDelete(sub.id)} className="text-red-500 hover:text-red-700 font-medium">Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-gray-100">
          <p className="text-5xl mb-4">📤</p>
          <p className="text-lg">Aucune soumission</p>
          <p className="text-sm mt-1">Créez une soumission pour qu'un élève soumette son travail</p>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Nouvelle soumission</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exercice *</label>
                <select value={form.exercise_id} onChange={(e) => setForm({ ...form, exercise_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value={0}>Sélectionnez un exercice</option>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>{ex.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Élève *</label>
                <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value={0}>Sélectionnez un élève</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contenu de la rédaction</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={6} placeholder="Texte de l'élève..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Annuler</button>
              <button onClick={handleCreate} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">Créer</button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setSelectedSub(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Détails de la soumission</h2>
              <div className="flex gap-2">
                <button onClick={() => handleAiFeedback(selectedSub.id)} disabled={aiLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50">
                  {aiLoading ? 'Génération...' : '🤖 Feedback IA'}
                </button>
                <button onClick={() => { setSelectedSub(null); onGrade(selectedSub.id) }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                  Noter
                </button>
                <button onClick={() => setSelectedSub(null)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Fermer</button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-sm text-gray-500">Élève</span>
                  <p className="font-medium text-gray-900">{selectedSub.student_name}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <span className="text-sm text-gray-500">Exercice</span>
                  <p className="font-medium text-gray-900">{selectedSub.exercise_title}</p>
                </div>
              </div>

              {selectedSub.content && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Contenu de la rédaction</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">{selectedSub.content}</div>
                </div>
              )}

              {/* Grades */}
              {selectedSub.grades && selectedSub.grades.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Notes attribuées</h3>
                  <div className="space-y-2">
                    {selectedSub.grades.map((g) => (
                      <div key={g.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div>
                          <span className="font-medium text-gray-900">{g.criterion_name}</span>
                          {g.comment && <p className="text-xs text-gray-500">{g.comment}</p>}
                        </div>
                        <span className="font-bold text-indigo-600">{g.score}/{g.max_score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Feedback */}
              {(aiFeedback || (selectedSub.ai_feedback && selectedSub.ai_feedback.length > 0)) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Feedback IA</h3>
                  <div className="bg-purple-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                    {aiFeedback || selectedSub.ai_feedback?.[0]?.feedback}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Submissions
