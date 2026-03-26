import { useEffect, useState } from 'react'
import { 
  Users, 
  MessageSquare, 
  Terminal, 

  Power,
  PowerOff,
  AlertCircle
} from 'lucide-react'
import { gatewayApi } from '../services/api'
import { socketService } from '../services/socket'
import type { Agent } from '../types'

export function Agents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [status, setStatus] = useState<{ connected: boolean; authenticated: boolean } | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
    
    socketService.subscribeToGateway()

    const unsubscribe = socketService.on('gateway:agent.status', (_data) => {
      // Refresh agents when status updates come in
      loadData()
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const loadData = async () => {
    try {
      const [agentsRes, statusRes] = await Promise.all([
        gatewayApi.getAgents(),
        gatewayApi.getStatus(),
      ])
      setAgents(agentsRes.data.agents)
      setStatus(statusRes.data.status)
    } catch (error) {
      console.error('Failed to load agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!selectedAgent || !message.trim()) return
    
    try {
      await gatewayApi.sendMessage(selectedAgent.id, message)
      setMessage('')
      alert('Message sent!')
    } catch (error) {
      console.error('Failed to send message:', error)
      alert('Failed to send message')
    }
  }

  const handleReconnect = async () => {
    try {
      await gatewayApi.reconnect()
      alert('Reconnection requested')
      setTimeout(loadData, 2000)
    } catch (error) {
      console.error('Failed to reconnect:', error)
      alert('Failed to reconnect')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'idle': return 'bg-yellow-500'
      case 'busy': return 'bg-blue-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-400'
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
        <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {status?.connected ? (
              <Power className="w-5 h-5 text-green-600" />
            ) : (
              <PowerOff className="w-5 h-5 text-red-600" />
            )}
            <span className="text-sm text-gray-600">
              Gateway {status?.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          {!status?.connected && (
            <button
              onClick={handleReconnect}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Agents Grid */}
      {agents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No Agents Connected</h3>
          <p className="text-gray-600 mt-2">
            Agents will appear here once they connect to the OpenClaw Gateway.
          </p>
          <button
            onClick={handleReconnect}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Connection
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <div 
              key={agent.id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`}></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-500">{agent.role}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {agent.department && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Department:</span> {agent.department}
                    </div>
                  )}
                  {agent.currentTask && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Current Task:</span> {agent.currentTask}
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Last Seen:</span>{' '}
                    {new Date(agent.lastSeen).toLocaleString()}
                  </div>
                </div>

                {agent.skills.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-1">
                      {agent.skills.map((skill) => (
                        <span 
                          key={skill}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t flex space-x-2">
                  <button
                    onClick={() => setSelectedAgent(agent)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors text-sm"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Message
                  </button>
                  <a
                    href={`/terminal?agent=${agent.id}`}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors text-sm"
                  >
                    <Terminal className="w-4 h-4 mr-2" />
                    Terminal
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message Modal */}
      {selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Send Message to {selectedAgent.name}
              </h3>
              <button
                onClick={() => setSelectedAgent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                className="w-full h-32 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!message.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Troubleshooting */}
      {!status?.connected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-yellow-900">Gateway Disconnected</h3>
            <p className="text-sm text-yellow-700 mt-1">
              The connection to OpenClaw Gateway is currently unavailable. 
              Agents cannot be managed until the connection is restored.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
