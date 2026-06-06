import { useState, useEffect } from 'react'
import { getStudents, createStudent, updateStudent, deleteStudent, getClasses } from '../services/api'
import type { Student, Classe } from '../types'

function Students() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', class_id: 0 })
  const [search, setSearch] = useState('')

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [s, c] = await Promise.all([getStudents(), getClasses()])
      setStudents(s)
      setClasses(c)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ first_name: '', last_name: '', email: '', class_id: 0 })
    setShowModal(true)
  }

  const openEdit = (s: Student) => {
    setEditing(s)
    setForm({ first_name: s.first_name, last_name: s.last_name, email: s.email, class_id: s.class_id })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.first_name || !form.last_name) return
    try {
      if (editing) {
        await updateStudent(editing.id, { ...form, class_id: form.class_id || undefined })
      } else {
        await createStudent({ ...form, class_id: form.class_id || undefined })
      }
      setShowModal(false)
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet élève ?')) return
    try {
      await deleteStudent(id)
      loadData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filtered = students.filter((s) =>
    `${s.first_name} ${s.last_name} ${s.class_name || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Élèves</h1>
          <p className="text-gray-500 mt-1">{students.length} élève(s) inscrit(s)</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm">
          + Ajouter un élève
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher un élève..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
        />
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
                <th className="text-left py-3 px-6 font-medium text-gray-500">Nom</th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">Prénom</th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">Email</th>
                <th className="text-left py-3 px-6 font-medium text-gray-500">Classe</th>
                <th className="text-right py-3 px-6 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6 font-medium text-gray-900">{s.last_name}</td>
                  <td className="py-4 px-6 text-gray-700">{s.first_name}</td>
                  <td className="py-4 px-6 text-gray-500">{s.email || '-'}</td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">
                      {s.class_name || 'Aucune'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button onClick={() => openEdit(s)} className="text-indigo-600 hover:text-indigo-800 mr-3 font-medium">Modifier</button>
                    <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:text-red-700 font-medium">Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 bg-white rounded-xl border border-gray-100">
          <p className="text-5xl mb-4">👨‍🎓</p>
          <p className="text-lg">{search ? 'Aucun résultat' : 'Aucun élève pour le moment'}</p>
          {!search && <p className="text-sm mt-1">Cliquez sur "Ajouter un élève" pour commencer</p>}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editing ? 'Modifier l\'élève' : 'Ajouter un élève'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom *</label>
                <input type="text" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                <input type="text" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                <select value={form.class_id} onChange={(e) => setForm({ ...form, class_id: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value={0}>Aucune classe</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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

export default Students
