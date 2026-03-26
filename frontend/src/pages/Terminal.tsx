import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Terminal as TerminalIcon, Send, X } from 'lucide-react'
import { gatewayApi } from '../services/api'
import { socketService } from '../services/socket'
import type { Agent } from '../types'

export function Terminal() {
  const [searchParams] = useSearchParams()
  const agentId = searchParams.get('agent')
  
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [output, setOutput] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAgents()
    

    return () => {
      if (selectedAgent) {
        gatewayApi.disconnectTerminal(selectedAgent.id)
      }
    }
  }, [])

  useEffect(() => {
    if (agentId && agents.length > 0) {
      const agent = agents.find(a => a.id === agentId)
      if (agent) {
        connectToAgent(agent)
      }
    }
  }, [agentId, agents])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output])

  const loadAgents = async () => {
    try {
      const res = await gatewayApi.getAgents()
      setAgents(res.data.agents)
    } catch (error) {
      console.error('Failed to load agents:', error)
    }
  }

  const connectToAgent = async (agent: Agent) => {
    // Disconnect from previous agent
    if (selectedAgent) {
      await gatewayApi.disconnectTerminal(selectedAgent.id)
    }

    setSelectedAgent(agent)
    setOutput([`Connecting to ${agent.name}...`])
    setConnected(false)

    try {
      await gatewayApi.connectTerminal(agent.id)
      socketService.subscribeToTerminal(agent.id)
      
      const unsubscribe = socketService.on('terminal:output', (data) => {
        if (data.agentId === agent.id) {
          setOutput(prev => [...prev, data.output])
        }
      })

      setConnected(true)
      setOutput(prev => [...prev, `Connected to ${agent.name}`])

      return () => {
        unsubscribe()
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      setOutput(prev => [...prev, `Failed to connect: ${error}`])
    }
  }

  const handleSend = async () => {
    if (!selectedAgent || !input.trim()) return

    setOutput(prev => [...prev, `> ${input}`])
    
    try {
      await gatewayApi.sendTerminalInput(selectedAgent.id, input)
      setInput('')
    } catch (error) {
      console.error('Failed to send input:', error)
      setOutput(prev => [...prev, `Error: Failed to send input`])
    }
  }

  const handleDisconnect = async () => {
    if (!selectedAgent) return

    await gatewayApi.disconnectTerminal(selectedAgent.id)
    setConnected(false)
    setSelectedAgent(null)
    setOutput([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <TerminalIcon className="w-6 h-6 mr-2" />
          Terminal
        </h1>
        {selectedAgent && (
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Connected to: <span className="font-medium">{selectedAgent.name}</span>
            </span>
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <button
              onClick={handleDisconnect}
              className="flex items-center px-3 py-1 text-red-600 hover:bg-red-50 rounded"
            >
              <X className="w-4 h-4 mr-1" />
              Disconnect
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex gap-4 min-h-0">
        {/* Agents List */}
        <div className="w-64 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="font-medium text-gray-700">Agents</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => connectToAgent(agent)}
                className={`w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 transition-colors ${
                  selectedAgent?.id === agent.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    agent.status === 'active' ? 'bg-green-500' :
                    agent.status === 'busy' ? 'bg-blue-500' :
                    agent.status === 'idle' ? 'bg-yellow-500' :
                    'bg-gray-400'
                  }`}></div>
                  <span className="text-sm font-medium truncate">{agent.name}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate">{agent.role}</p>
              </button>
            ))}
            {agents.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No agents available
              </div>
            )}
          </div>
        </div>

        {/* Terminal */}
        <div className="flex-1 bg-gray-900 rounded-lg shadow overflow-hidden flex flex-col">
          {selectedAgent ? (
            <>
              {/* Output */}
              <div 
                ref={outputRef}
                className="flex-1 p-4 overflow-y-auto font-mono text-sm"
              >
                {output.map((line, i) => (
                  <div key={i} className="text-green-400 whitespace-pre-wrap">
                    {line}
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="p-3 bg-gray-800 border-t border-gray-700">
                <div className="flex space-x-2">
                  <span className="text-green-500 font-mono py-2">$</span>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter command..."
                    className="flex-1 bg-transparent text-white font-mono text-sm focus:outline-none py-2"
                    disabled={!connected}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!connected || !input.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <TerminalIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select an agent to start a terminal session</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
