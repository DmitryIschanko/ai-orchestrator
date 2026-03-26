import { useEffect, useState } from 'react'
import { 
  Users, 
  Plus, 
  Edit2,
  Trash2,
  Save,

  Move
} from 'lucide-react'
import { orgApi, gatewayApi } from '../services/api'
import type { OrgNode, Agent } from '../types'

export function OrgChart() {
  const [nodes, setNodes] = useState<OrgNode[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null)

  const [draggedNode, setDraggedNode] = useState<OrgNode | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    reportsToId: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [nodesRes, agentsRes] = await Promise.all([
        orgApi.getHierarchy(),
        gatewayApi.getAgents(),
      ])
      setNodes(nodesRes.data.nodes)
      setAgents(agentsRes.data.agents)
    } catch (error) {
      console.error('Failed to load org data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await orgApi.create({
        title: formData.title,
        department: formData.department,
        reportsToId: formData.reportsToId || undefined,
      })
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to create node:', error)
      alert('Failed to create org node')
    }
  }

  const handleUpdate = async () => {
    if (!editingNode) return

    try {
      await orgApi.update(editingNode.id, {
        title: formData.title,
        department: formData.department,
      })
      setShowModal(false)
      setEditingNode(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to update node:', error)
      alert('Failed to update org node')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this org node?')) return

    try {
      await orgApi.delete(id)
      loadData()
    } catch (error) {
      console.error('Failed to delete node:', error)
    }
  }

  const handleAssignAgent = async (nodeId: string, agentId: string) => {
    try {
      await orgApi.assignAgent(nodeId, agentId)
      loadData()
    } catch (error) {
      console.error('Failed to assign agent:', error)
    }
  }

  const openEditModal = (node: OrgNode) => {
    setEditingNode(node)
    setFormData({
      title: node.title,
      department: node.department || '',
      reportsToId: node.reportsToId || '',
    })
    setShowModal(true)
  }

  const openCreateModal = (reportsToId?: string) => {
    setEditingNode(null)
    resetForm()
    if (reportsToId) {
      setFormData(prev => ({ ...prev, reportsToId }))
    }
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      department: '',
      reportsToId: '',
    })
  }

  // Simple tree rendering
  const renderNode = (node: OrgNode, depth = 0) => {
    const assignedAgent = agents.find(a => a.id === node.agentId)
    
    return (
      <div key={node.id} className={depth > 0 ? 'ml-8 mt-4' : ''}>
        <div 
          className="bg-white rounded-lg shadow p-4 border-2 border-transparent hover:border-blue-300 transition-colors relative"
          draggable
          onDragStart={() => setDraggedNode(node)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (draggedNode && draggedNode.id !== node.id) {
              // In a real implementation, you'd update the reportsToId here
              setHasChanges(true)
            }
            setDraggedNode(null)
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{node.title}</h3>
                {node.department && (
                  <p className="text-sm text-gray-500">{node.department}</p>
                )}
                {assignedAgent && (
                  <p className="text-xs text-green-600 mt-1">
                    Agent: {assignedAgent.name}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => openCreateModal(node.id)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Add subordinate"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => openEditModal(node)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(node.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Agent Assignment */}
          <div className="mt-3 pt-3 border-t">
            <label className="text-xs text-gray-500">Assigned Agent:</label>
            <select
              value={node.agentId || ''}
              onChange={(e) => handleAssignAgent(node.id, e.target.value)}
              className="mt-1 w-full text-sm p-1.5 border rounded"
            >
              <option value="">None</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Children */}
        {node.children && node.children.length > 0 && (
          <div className="mt-4">
            {node.children.map(child => renderNode(child, depth + 1))}
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
          <Users className="w-6 h-6 mr-2" />
          Org Chart
        </h1>
        <div className="flex space-x-2">
          {hasChanges && (
            <button
              onClick={() => {
                // Save positions logic would go here
                setHasChanges(false)
              }}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </button>
          )}
          <button
            onClick={() => openCreateModal()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Node
          </button>
        </div>
      </div>

      {/* Org Chart */}
      <div className="bg-gray-50 rounded-lg p-6 min-h-[500px]">
        {nodes.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Org Structure</h3>
            <p className="text-gray-600 mt-2">Start building your organization chart.</p>
            <button
              onClick={() => openCreateModal()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add First Node
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {nodes.map(node => renderNode(node))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Legend</h3>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Has Agent</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-300 rounded-full mr-2"></div>
            <span>No Agent</span>
          </div>
          <div className="flex items-center text-gray-500">
            <Move className="w-4 h-4 mr-2" />
            <span>Drag to reorganize</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                {editingNode ? 'Edit Node' : 'Add Node'}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g., CEO, Engineering Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="e.g., Engineering, Sales"
                />
              </div>
              {!editingNode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reports To</label>
                  <select
                    value={formData.reportsToId}
                    onChange={(e) => setFormData({ ...formData, reportsToId: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">None (Top Level)</option>
                    {nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingNode(null)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={editingNode ? handleUpdate : handleCreate}
                disabled={!formData.title}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {editingNode ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
