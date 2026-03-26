import { useEffect, useState } from 'react'
import { 
  TicketCheck, 
  Plus, 
  Filter,

  Trash2,
  MessageSquare,



  X
} from 'lucide-react'
import { ticketsApi } from '../services/api'
import type { Ticket } from '../types'

export function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    goalId: '',
  })
  const [newEvent, setNewEvent] = useState('')

  useEffect(() => {
    loadTickets()
  }, [filter])

  const loadTickets = async () => {
    try {
      const filters: any = {}
      if (filter !== 'all') {
        filters.status = filter
      }
      const res = await ticketsApi.list(filters)
      setTickets(res.data.tickets)
    } catch (error) {
      console.error('Failed to load tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await ticketsApi.create({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        goalId: formData.goalId || undefined,
      })
      setShowModal(false)
      resetForm()
      loadTickets()
    } catch (error) {
      console.error('Failed to create ticket:', error)
      alert('Failed to create ticket')
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await ticketsApi.update(id, { status })
      loadTickets()
    } catch (error) {
      console.error('Failed to update ticket:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return

    try {
      await ticketsApi.delete(id)
      loadTickets()
    } catch (error) {
      console.error('Failed to delete ticket:', error)
    }
  }

  const handleAddEvent = async () => {
    if (!selectedTicket || !newEvent.trim()) return

    try {
      await ticketsApi.addEvent(selectedTicket.id, 'comment', { text: newEvent })
      setNewEvent('')
      // Reload the ticket to get updated events
      const res = await ticketsApi.get(selectedTicket.id)
      setSelectedTicket(res.data.ticket)
    } catch (error) {
      console.error('Failed to add event:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      goalId: '',
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700'
      case 'high': return 'bg-orange-100 text-orange-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-gray-100 text-gray-700'
      case 'in_progress': return 'bg-blue-100 text-blue-700'
      case 'review': return 'bg-purple-100 text-purple-700'
      case 'done': return 'bg-green-100 text-green-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
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
          <TicketCheck className="w-6 h-6 mr-2" />
          Tickets
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2">
        <Filter className="w-5 h-5 text-gray-500" />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="p-2 border rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
      </div>

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <TicketCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Tickets</h3>
          <p className="text-gray-600 mt-2">Create your first ticket to get started.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Title</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Priority</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Created</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="text-left font-medium text-gray-900 hover:text-blue-600"
                    >
                      {ticket.title}
                    </button>
                    {ticket.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">{ticket.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={ticket.status}
                      onChange={(e) => handleUpdateStatus(ticket.id, e.target.value)}
                      className={`text-sm border-0 rounded px-2 py-1 ${getStatusColor(ticket.status)}`}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(ticket.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">Create Ticket</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded-lg h-24"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!formData.title}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{selectedTicket.title}</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center space-x-4 mb-4">
                <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedTicket.status)}`}>
                  {selectedTicket.status}
                </span>
              </div>
              
              {selectedTicket.description && (
                <p className="text-gray-700 mb-6">{selectedTicket.description}</p>
              )}

              {/* Events */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Activity</h4>
                {selectedTicket.events?.length === 0 ? (
                  <p className="text-gray-500 text-sm">No activity yet</p>
                ) : (
                  selectedTicket.events?.map((event) => (
                    <div key={event.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded">
                      <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-700">{event.type}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(event.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Event */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddEvent()}
                  placeholder="Add a comment..."
                  className="flex-1 p-2 border rounded-lg"
                />
                <button
                  onClick={handleAddEvent}
                  disabled={!newEvent.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
