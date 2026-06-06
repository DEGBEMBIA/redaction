import { useState, useEffect } from 'react'
import { getClasses, createClass, updateClass, deleteClass } from '../services/api'
import type { Classe } from '../types'

function Classes() {
  const [classes, setClasses] = useState<Classe[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Classe | null>(null)
  const [form, setForm] = useState({ name: '', level: '', description: '' })

  useEffect(() => { loadClasses() }, [])

  const loadClasses = async () => {
    try {
      setLoading(true)
      setClasses(await getClasses())
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', level: '', description: '' })
    setShowModal(true)
  }

  const openEdit = (c: Classe) => {
    setEditing(c)
    setForm({ name: c.name, level: c.level, description: c.description })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name) return
    try {
      if (editing) {
        await updateClass(editing.id, form)
      } else {
        await createClass(form)
      }
      setShowModal(false)
      loadClasses()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette classe ?')) return
    try {
      await deleteClass(id)
      loadClasses()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 mt-1">{classes.length} classe(s)</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm">
          + Ajouter une classe
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      ) : classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((c) => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{c.name}</h3>
                  {c.level && (
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">{c.level}</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(c)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Modifier</button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Suppr.</button>
                </div>
              </div>
              {c.description && <p className="text-sm text-gray-500">{c.description}</p>}
              <p className="text-xs text-gray-400 mt-3">Créée le {new Date(c.created_at).toLocaleDateString('fr-FR')}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-gray-100">
          <p className="text-5xl mb-4">🏫</p>
          <p className="text-lg">Aucune classe pour le moment</p>
          <p className="text-sm mt-1">Créez votre première classe</p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editing ? 'Modifier la classe' : 'Ajouter une classe'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Niveau</label>
                <input type="text" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                  placeholder="ex: Collège, Lycée, 6ème..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
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

export default Classes
