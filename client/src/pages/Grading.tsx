import { useState, useEffect, useCallback } from 'react'
import { getSubmissions, getSubmission, getCriteria, saveGrades, generateAiFeedback } from '../services/api'
import type { Submission, EvaluationCriterion, Grade } from '../types'

function Grading({ submissionId }: { submissionId?: number | null }) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([])
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null)
  const [grades, setGrades] = useState<Record<number, { score: number; comment: string }>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [aiFeedback, setAiFeedback] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { loadData() }, [])

  // Auto-select submission when submissionId prop changes
  useEffect(() => {
    if (submissionId && submissions.length > 0) {
      const found = submissions.find((s) => s.id === submissionId)
      if (found) {
        selectSubmission(found)
      }
    }
  }, [submissionId, submissions])

  const loadData = async () => {
    try {
      setLoading(true)
      const [subs, crits] = await Promise.all([getSubmissions(), getCriteria()])
      setSubmissions(subs)
      setCriteria(crits)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectSubmission = async (sub: Submission) => {
    try {
      const full = await getSubmission(sub.id)
      setSelectedSub(full)
      setAiFeedback('')

      // Initialize grades from existing ones
      const gradesMap: Record<number, { score: number; comment: string }> = {}
      if (full.grades) {
        full.grades.forEach((g: Grade) => {
          gradesMap[g.criterion_id] = { score: g.score, comment: g.comment }
        })
      }
      // Initialize missing criteria
      criteria.forEach((c) => {
        if (!gradesMap[c.id]) {
          gradesMap[c.id] = { score: 0, comment: '' }
        }
      })
      setGrades(gradesMap)
    } catch (err: any) {
      console.error(err)
    }
  }

  const handleSaveGrades = async () => {
    if (!selectedSub) return
    setSaving(true)
    try {
      const gradesArray = Object.entries(grades).map(([criterionId, g]) => ({
        criterion_id: Number(criterionId),
        score: g.score,
        comment: g.comment,
      }))
      await saveGrades(selectedSub.id, gradesArray)
      alert('Notes enregistrées !')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleAiFeedback = async () => {
    if (!selectedSub) return
    setAiLoading(true)
    try {
      const result = await generateAiFeedback(selectedSub.id)
      setAiFeedback(result.feedback)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const calculateTotal = () => {
    let totalScore = 0
    let totalWeight = 0
    criteria.forEach((c) => {
      const g = grades[c.id]
      if (g) {
        totalScore += (g.score / c.max_score) * c.weight
        totalWeight += c.weight
      }
    })
    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Notation</h1>
      <p className="text-gray-500 mb-6">Évaluez les rédactions des élèves selon les critères définis</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submissions list */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Soumissions ({submissions.length})</h2>
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-lg"></div>)}
              </div>
            ) : submissions.length > 0 ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {submissions.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => selectSubmission(sub)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedSub?.id === sub.id
                        ? 'bg-indigo-50 border border-indigo-200'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <p className="font-medium text-sm text-gray-900">{sub.student_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{sub.exercise_title}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Aucune soumission</p>
            )}
          </div>
        </div>

        {/* Grading area */}
        <div className="lg:col-span-2">
          {selectedSub ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedSub.student_name}</h2>
                  <p className="text-sm text-gray-500">{selectedSub.exercise_title}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-indigo-600">{calculateTotal()}%</div>
                  <p className="text-xs text-gray-400">Score total</p>
                </div>
              </div>

              {selectedSub.content && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedSub.content}</p>
                </div>
              )}

              <div className="space-y-4 mb-6">
                {criteria.map((c) => (
                  <div key={c.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <label className="font-medium text-gray-900">{c.name}</label>
                        <span className="text-xs text-gray-400 ml-2">/ {c.max_score} (×{c.weight})</span>
                      </div>
                      <span className={`text-sm font-bold ${
                        (grades[c.id]?.score || 0) >= c.max_score * 0.8 ? 'text-green-600' :
                        (grades[c.id]?.score || 0) >= c.max_score * 0.5 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {grades[c.id]?.score || 0}/{c.max_score}
                      </span>
                    </div>
                    {c.description && <p className="text-xs text-gray-500 mb-2">{c.description}</p>}
                    <div className="flex gap-3">
                      <input
                        type="range"
                        min={0}
                        max={c.max_score}
                        step={0.5}
                        value={grades[c.id]?.score || 0}
                        onChange={(e) => setGrades({ ...grades, [c.id]: { ...grades[c.id], score: Number(e.target.value) } })}
                        className="flex-1 accent-indigo-600"
                      />
                      <input
                        type="number"
                        min={0}
                        max={c.max_score}
                        step={0.5}
                        value={grades[c.id]?.score || 0}
                        onChange={(e) => setGrades({ ...grades, [c.id]: { ...grades[c.id], score: Math.min(Number(e.target.value), c.max_score) } })}
                        className="w-16 px-2 py-1 border border-gray-200 rounded text-center text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Commentaire (optionnel)"
                      value={grades[c.id]?.comment || ''}
                      onChange={(e) => setGrades({ ...grades, [c.id]: { ...grades[c.id], comment: e.target.value } })}
                      className="w-full mt-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <button onClick={handleAiFeedback} disabled={aiLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50">
                  {aiLoading ? '🤖 Génération...' : '🤖 Feedback IA'}
                </button>
                <button onClick={handleSaveGrades} disabled={saving}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 shadow-sm">
                  {saving ? 'Enregistrement...' : '💾 Enregistrer les notes'}
                </button>
              </div>

              {aiFeedback && (
                <div className="mt-6 bg-purple-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                  <h3 className="font-semibold text-gray-900 mb-2">Feedback IA</h3>
                  {aiFeedback}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-5xl mb-4">✏️</p>
              <p className="text-lg text-gray-400">Sélectionnez une soumission à noter</p>
              <p className="text-sm text-gray-300 mt-1">Choisissez un élève dans la liste de gauche</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Grading
