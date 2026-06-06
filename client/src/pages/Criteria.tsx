import { useState, useEffect } from 'react'
import { getCriteria, createCriterion, updateCriterion, deleteCriterion } from '../services/api'
import type { EvaluationCriterion } from '../types'

function Criteria() {
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<EvaluationCriterion | null>(null)
  const [form, setForm] = useState({ name: '', description: '', max_score: 10, weight: 1 })

  useEffect(() => { loadCriteria() }, [])

  const loadCriteria = async () => {
    try {
      setLoading(true)
      setCriteria(await getCriteria())
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', max_score: 10, weight: 1 })
    setShowModal(true)
  }

  const openEdit = (c: EvaluationCriterion) => {
    setEditing(c)
    setForm({ name: c.name, description: c.description, max_score: c.max_score, weight: c.weight })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name) return
    try {
      if (editing) {
        await updateCriterion(editing.id, form)
      } else {
        await createCriterion(form)
      }
      setShowModal(false)
      loadCriteria()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce critère ?')) return
    try {
      await deleteCriterion(id)
      loadCriteria()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Grille d'évaluation</h1>
          <p className="text-gray-500 mt-1">Définissez les critères pour évaluer les rédactions</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm">
          + Ajouter un critère
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      ) : criteria.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-500">Critère</th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">Description</th>
                <th className="text-center py-3 px-6 font-medium text-gray-500">Note max</th>
                <th className="text-center py-3 px-6 font-medium text-gray-500">Coefficient</th>
                <th className="text-right py-3 px-6 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((c) => (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900">{c.name}</td>
                  <td className="py-4 px-6 text-gray-500 max-w-xs truncate">{c.description || '-'}</td>
                  <td className="py-4 px-6 text-center font-medium text-gray-700">{c.max_score}</td>
                  <td className="py-4 px-6 text-center">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      x{c.weight}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => openEdit(c)} className="text-indigo-600 hover:text-indigo-800 mr-3 font-medium">Modifier</button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 font-medium">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-gray-100">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-lg">Aucun critère d'évaluation défini</p>
          <p className="text-sm mt-1">Créez des critères comme Orthographe, Grammaire, Style...</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editing ? 'Modifier le critère' : 'Ajouter un critère'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ex: Orthographe"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="ex: Correction orthographique du texte"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note maximale</label>
                  <input type="number" value={form.max_score} onChange={(e) => setForm({ ...form, max_score: Number(e.target.value) })}
                    min={1} max={100}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coefficient (poids)</label>
                  <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })}
                    min={0.1} step={0.1}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">Annuler</button>
              <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                {editing ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Criteria
