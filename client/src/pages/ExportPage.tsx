import { useState, useEffect } from 'react'
import { getStudents, getClasses, getExercises, getSubmissions, getDashboardStats } from '../services/api'
import type { Student, Classe, Exercise, Submission, DashboardStats } from '../types'

function ExportPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Classe[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [exportType, setExportType] = useState<'students' | 'classes' | 'exercises' | 'grades' | 'stats'>('students')

  useEffect(() => {
    Promise.all([
      getStudents(),
      getClasses(),
      getExercises(),
      getSubmissions(),
      getDashboardStats().catch(() => null),
    ]).then(([s, c, e, _subs, st]) => {
      setStudents(s)
      setClasses(c)
      setExercises(e)
      setStats(st)
      setLoading(false)
    })
  }, [])

  const getData = () => {
    switch (exportType) {
      case 'students':
        return {
          title: 'Liste des élèves',
          headers: ['Nom', 'Prénom', 'Email', 'Classe', 'Date d\'inscription'],
          rows: students.map((s) => [
            s.last_name,
            s.first_name,
            s.email || '-',
            s.class_name || '-',
            new Date(s.created_at).toLocaleDateString('fr-FR'),
          ]),
        }
      case 'classes':
        return {
          title: 'Liste des classes',
          headers: ['Nom', 'Niveau', 'Description', 'Date de création'],
          rows: classes.map((c) => [
            c.name,
            c.level || '-',
            c.description || '-',
            new Date(c.created_at).toLocaleDateString('fr-FR'),
          ]),
        }
      case 'exercises':
        return {
          title: 'Liste des exercices',
          headers: ['Titre', 'Sujet', 'Classe', 'Date limite', 'Date de création'],
          rows: exercises.map((e) => [
            e.title,
            e.subject || '-',
            e.class_name || '-',
            e.due_date ? new Date(e.due_date).toLocaleDateString('fr-FR') : '-',
            new Date(e.created_at).toLocaleDateString('fr-FR'),
          ]),
        }
      case 'grades':
        return {
          title: 'Résultats des élèves',
          headers: ['Élève', 'Exercice', 'Score', 'Date'],
          rows: (stats?.recent_submissions || []).map((sub: any) => [
            sub.student_name || '-',
            sub.exercise_title || '-',
            `${Math.round(sub.overall_score || 0)}%`,
            new Date(sub.submitted_at).toLocaleDateString('fr-FR'),
          ]),
        }
      case 'stats':
        return {
          title: 'Statistiques générales',
          headers: ['Métrique', 'Valeur'],
          rows: [
            ['Nombre d\'élèves', String(stats?.total_students || 0)],
            ['Nombre de classes', String(stats?.total_classes || 0)],
            ['Nombre d\'exercices', String(stats?.total_exercises || 0)],
            ['Nombre de soumissions', String(stats?.total_submissions || 0)],
            ['Score moyen', `${Math.round(stats?.average_score || 0)}%`],
            ...(stats?.top_students || []).map((s) => [
              `Meilleur élève: ${s.name}`,
              `${Math.round(s.avg_score)}%`,
            ]),
          ],
        }
    }
  }

  const exportCSV = () => {
    const data = getData()
    const csvContent = [
      data.headers.join(';'),
      ...data.rows.map((row) => row.join(';')),
    ].join('\n')

    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${exportType}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPDF = async () => {
    const data = getData()
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text(data.title, 14, 20)
    doc.setFontSize(10)
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 28)

    autoTable(doc, {
      head: [data.headers],
      body: data.rows,
      startY: 35,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241] },
    })

    doc.save(`${exportType}_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const exportTypes = [
    { id: 'students' as const, label: 'Élèves', icon: '👨‍🎓' },
    { id: 'classes' as const, label: 'Classes', icon: '🏫' },
    { id: 'exercises' as const, label: 'Exercices', icon: '📝' },
    { id: 'grades' as const, label: 'Notes', icon: '✏️' },
    { id: 'stats' as const, label: 'Statistiques', icon: '📊' },
  ]

  const data = getData()

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Export</h1>
      <p className="text-gray-500 mb-6">Exportez les données au format CSV ou PDF</p>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Type d'export</h2>
            <div className="space-y-2">
              {exportTypes.map((et) => (
                <button
                  key={et.id}
                  onClick={() => setExportType(et.id)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    exportType === et.id
                      ? 'bg-indigo-50 border border-indigo-200'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <span className="text-lg mr-2">{et.icon}</span>
                  <span className="font-medium text-sm text-gray-900">{et.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              <button onClick={exportCSV}
                className="w-full py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm">
                📥 Exporter en CSV
              </button>
              <button onClick={exportPDF}
                className="w-full py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm">
                📕 Exporter en PDF
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{data.title}</h2>
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-100 rounded"></div>)}
              </div>
            ) : data.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      {data.headers.map((h, i) => (
                        <th key={i} className="text-left py-3 px-4 font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        {row.map((cell, j) => (
                          <td key={j} className="py-3 px-4 text-gray-700">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-sm text-gray-400 mt-4">{data.rows.length} ligne(s)</p>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Aucune donnée à exporter</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExportPage
