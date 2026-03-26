import { useEffect, useState } from 'react'
import { 
  Wrench, 
  Plus, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  ExternalLink,
  Code
} from 'lucide-react'
import { skillsApi } from '../services/api'
import type { Skill } from '../types'

export function Skills() {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null)
  const [hubUrl] = useState('https://clawhub.example.com')
  const [formData, setFormData] = useState({
    name: '',
    source: 'custom',
    sourceUrl: '',
    content: '',
  })

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      const res = await skillsApi.list()
      setSkills(res.data.skills)
    } catch (error) {
      console.error('Failed to load skills:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const res = await skillsApi.import(hubUrl)
      alert(`Imported ${res.data.imported} skills`)
      if (res.data.errors.length > 0) {
        console.error('Import errors:', res.data.errors)
      }
      loadSkills()
    } catch (error) {
      console.error('Failed to import skills:', error)
      alert('Failed to import skills')
    } finally {
      setImporting(false)
    }
  }

  const handleCreate = async () => {
    try {
      await skillsApi.create({
        name: formData.name,
        source: formData.source,
        sourceUrl: formData.sourceUrl || undefined,
        content: formData.content,
      })
      setShowModal(false)
      resetForm()
      loadSkills()
    } catch (error) {
      console.error('Failed to create skill:', error)
      alert('Failed to create skill')
    }
  }

  const handleUpdate = async () => {
    if (!editingSkill) return

    try {
      await skillsApi.update(editingSkill.id, {
        name: formData.name,
        sourceUrl: formData.sourceUrl,
        content: formData.content,
      })
      setShowModal(false)
      setEditingSkill(null)
      resetForm()
      loadSkills()
    } catch (error) {
      console.error('Failed to update skill:', error)
      alert('Failed to update skill')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this skill?')) return

    try {
      await skillsApi.delete(id)
      loadSkills()
    } catch (error) {
      console.error('Failed to delete skill:', error)
    }
  }

  const handleToggle = async (id: string) => {
    try {
      await skillsApi.toggle(id)
      loadSkills()
    } catch (error) {
      console.error('Failed to toggle skill:', error)
    }
  }

  const openEditModal = (skill: Skill) => {
    setEditingSkill(skill)
    setFormData({
      name: skill.name,
      source: skill.source || 'custom',
      sourceUrl: skill.sourceUrl || '',
      content: skill.content || '',
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      source: 'custom',
      sourceUrl: '',
      content: '',
    })
  }

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case 'clawhub': return <ExternalLink className="w-4 h-4 text-blue-500" />
      default: return <Code className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Wrench className="w-6 h-6 mr-2" />
          Skills
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 mr-2 ${importing ? 'animate-spin' : ''}`} />
            Import from ClawHub
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Skill
          </button>
        </div>
      </div>

      {/* Skills Grid */}
      {skills.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Skills</h3>
          <p className="text-gray-600 mt-2">Import skills from ClawHub or create custom ones.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <div 
              key={skill.id}
              className={`bg-white rounded-lg shadow p-4 border-2 transition-colors ${
                skill.enabled ? 'border-transparent' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getSourceIcon(skill.source)}
                  <h3 className="font-semibold text-gray-900">{skill.name}</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleToggle(skill.id)}
                    className={`p-1.5 rounded ${
                      skill.enabled 
                        ? 'text-green-600 hover:bg-green-50' 
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {skill.enabled ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => openEditModal(skill)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(skill.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {skill.source && (
                <p className="text-xs text-gray-500 mt-2">Source: {skill.source}</p>
              )}

              {skill.content && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono line-clamp-3">
                  {skill.content.slice(0, 100)}...
                </div>
              )}

              {skill.sourceUrl && (
                <a 
                  href={skill.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
                >
                  View Source <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                {editingSkill ? 'Edit Skill' : 'Add Skill'}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g., code-review"
                />
              </div>
              {!editingSkill && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="custom">Custom</option>
                    <option value="clawhub">ClawHub</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source URL</label>
                <input
                  type="url"
                  value={formData.sourceUrl}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-2 border rounded-lg h-32 font-mono text-sm"
                  placeholder="Skill definition or prompt..."
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingSkill(null)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={editingSkill ? handleUpdate : handleCreate}
                disabled={!formData.name}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {editingSkill ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
