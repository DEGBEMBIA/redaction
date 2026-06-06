import { useState, useEffect } from 'react'
import { getExercises, createExercise, updateExercise, deleteExercise, getClasses } from '../services/api'
import type { Exercise, Classe } from '../types'

function Exercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Exercise | null>(null)
  const [form, setForm] = useState({ title: '', subject: '', description: '', class_id: 0, due_date: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [e, c] = await Promise.all([getExercises(), getClasses()])
      setExercises(e)
      setClasses(c)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', subject: '', description: '', class_id: 0, due_date: '' })
    setShowModal(true)
  }

  const openEdit = (ex: Exercise) => {
    setEditing(ex)
    setForm({ title: ex.title, subject: ex.subject, description: ex.description, class_id: ex.class_id, due_date: ex.due_date })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title) return
    try {
      if (editing) {
        await updateExercise(editing.id, { ...form, class_id: form.class_id || undefined })
      } else {
        await createExercise({ ...form, class_id: form.class_id || undefined })
      }
      setShowModal(false)
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet exercice ?')) return
    try {
      await deleteExercise(id)
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exercices</h1>
          <p className="text-gray-500 mt-1">{exercises.length} exercice(s)</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm">
          + Ajouter un exercice
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      ) : exercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exercises.map((ex) => (
            <div key={ex.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg text-gray-900">{ex.title}</h3>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => openEdit(ex)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Modifier</button>
                  <button onClick={() => handleDelete(ex.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Suppr.</button>
                </div>
              </div>
              {ex.subject && <p className="text-sm font-medium text-indigo-600 mb-2">Sujet : {ex.subject}</p>}
              {ex.description && <p className="text-sm text-gray-600 mb-3">{ex.description}</p>}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {ex.class_name && <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full font-medium">{ex.class_name}</span>}
                {ex.due_date && <span>📅 {new Date(ex.due_date).toLocaleDateString('fr-FR')}</span>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-gray-100">
          <p className="text-5xl mb-4">📝</p>
          <p className="text-lg">Aucun exercice pour le moment</p>
          <p className="text-sm mt-1">Créez votre premier exercice de rédaction</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editing ? "Modifier l'exercice" : 'Ajouter un exercice'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                <input type="text" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="ex: Rédiger un texte argumentatif sur l'importance de la lecture"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Classe cible</label>
                  <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option value={0}>Toutes les classes</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date limite</label>
                  <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
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

export default Exercises
