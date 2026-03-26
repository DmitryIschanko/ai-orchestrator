import { useEffect, useState } from 'react'
import { 
  Target, 
  Plus, 
  ChevronRight, 
  ChevronDown,

  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  Clock
} from 'lucide-react'
import { goalsApi } from '../services/api'
import type { Goal } from '../types'

export function Goals() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [formData, setFormData] = useState({
    type: 'objective',
    title: '',
    description: '',
    parentId: '',
    dueDate: '',
  })

  useEffect(() => {
    loadGoals()
  }, [])

  const loadGoals = async () => {
    try {
      const res = await goalsApi.getHierarchy()
      setGoals(res.data.goals)
    } catch (error) {
      console.error('Failed to load goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleCreate = async () => {
    try {
      const data: any = {
        type: formData.type,
        title: formData.title,
        description: formData.description || undefined,
      }
      if (formData.parentId) {
        data.parentId = formData.parentId
      }
      if (formData.dueDate) {
        data.dueDate = new Date(formData.dueDate).toISOString()
      }

      await goalsApi.create(data)
      setShowModal(false)
      resetForm()
      loadGoals()
    } catch (error) {
      console.error('Failed to create goal:', error)
      alert('Failed to create goal')
    }
  }

  const handleUpdate = async () => {
    if (!editingGoal) return

    try {
      const data: any = {}
      if (formData.title) data.title = formData.title
      if (formData.description !== undefined) data.description = formData.description
      if (formData.dueDate) data.dueDate = new Date(formData.dueDate).toISOString()

      await goalsApi.update(editingGoal.id, data)
      setShowModal(false)
      setEditingGoal(null)
      resetForm()
      loadGoals()
    } catch (error) {
      console.error('Failed to update goal:', error)
      alert('Failed to update goal')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      await goalsApi.delete(id)
      loadGoals()
    } catch (error) {
      console.error('Failed to delete goal:', error)
      alert('Failed to delete goal')
    }
  }



  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal)
    setFormData({
      type: goal.type,
      title: goal.title,
      description: goal.description || '',
      parentId: goal.parentId || '',
      dueDate: goal.dueDate ? new Date(goal.dueDate).toISOString().split('T')[0] : '',
    })
    setShowModal(true)
  }

  const openCreateModal = (parentId?: string) => {
    setEditingGoal(null)
    resetForm()
    if (parentId) {
      setFormData(prev => ({ ...prev, parentId }))
    }
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      type: 'objective',
      title: '',
      description: '',
      parentId: '',
      dueDate: '',
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mission': return 'bg-purple-100 text-purple-700'
      case 'objective': return 'bg-blue-100 text-blue-700'
      case 'key_result': return 'bg-green-100 text-green-700'
      case 'task': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'active': return <Circle className="w-5 h-5 text-blue-500" />
      case 'on_hold': return <Clock className="w-5 h-5 text-yellow-500" />
      default: return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const renderGoal = (goal: Goal, depth = 0) => {
    const isExpanded = expanded.has(goal.id)
    const hasChildren = goal.children && goal.children.length > 0

    return (
      <div key={goal.id} className={depth > 0 ? 'ml-8' : ''}>
        <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow mb-2">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(goal.id)}
                    className="mt-1 text-gray-400 hover:text-gray-600"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                ) : (
                  <div className="w-5 mt-1"></div>
                )}
                
                {getStatusIcon(goal.status)}
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getTypeColor(goal.type)}`}>
                      {goal.type}
                    </span>
                  </div>
                  
                  {goal.description && (
                    <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    {goal.dueDate && (
                      <span>Due: {new Date(goal.dueDate).toLocaleDateString()}</span>
                    )}
                    <span>Progress: {goal.progress}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden w-48">
                    <div 
                      className={`h-full rounded-full ${
                        goal.progress >= 100 ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openCreateModal(goal.id)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  title="Add sub-goal"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEditModal(goal)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(goal.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-2">
            {goal.children!.map(child => renderGoal(child, depth + 1))}
          </div>
        )}
      </div>
    )
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
          <Target className="w-6 h-6 mr-2" />
          Goals
        </h1>
        <button
          onClick={() => openCreateModal()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Goal
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Goals Yet</h3>
            <p className="text-gray-600 mt-2">
              Start by creating your first goal to track progress.
            </p>
            <button
              onClick={() => openCreateModal()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create First Goal
            </button>
          </div>
        ) : (
          goals.map(goal => renderGoal(goal))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                {editingGoal ? 'Edit Goal' : 'Create Goal'}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  disabled={!!editingGoal}
                >
                  <option value="mission">Mission</option>
                  <option value="objective">Objective</option>
                  <option value="key_result">Key Result</option>
                  <option value="task">Task</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Enter goal title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded-lg h-24 resize-none"
                  placeholder="Enter description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingGoal(null)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={editingGoal ? handleUpdate : handleCreate}
                disabled={!formData.title}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {editingGoal ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
