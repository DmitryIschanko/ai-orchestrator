import { useEffect, useState } from 'react'
import { 
  Users, 
  Target, 
  TicketCheck, 
  Wallet, 
 
  CheckCircle,
  Clock,
  AlertTriangle,
  Zap,
  Server
} from 'lucide-react'
import { dashboardApi, gatewayApi } from '../services/api'
import type { DashboardStats, GatewayStatus } from '../types'

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [gatewayStatus, setGatewayStatus] = useState<GatewayStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, gatewayRes] = await Promise.all([
        dashboardApi.getStats(),
        gatewayApi.getStatus().catch(() => ({ data: null })),
      ])
      setStats(statsRes.data)
      if (gatewayRes.data) {
        setGatewayStatus(gatewayRes.data)
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const budgetUsed = stats?.budget.monthlyLimit 
    ? (stats.budget.spentMonthly / stats.budget.monthlyLimit) * 100 
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${gatewayStatus?.status?.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            Gateway {gatewayStatus?.status?.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Agents Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.agents.active || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <span className="text-yellow-600">{stats?.agents.idle || 0} idle</span>
            <span className="text-blue-600">{stats?.agents.busy || 0} busy</span>
            {stats?.agents.error ? (
              <span className="text-red-600">{stats.agents.error} error</span>
            ) : null}
          </div>
        </div>

        {/* Goals Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Goals</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.goals.active || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            {stats?.goals.completed || 0} completed this month
          </div>
        </div>

        {/* Tickets Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.tickets.open || 0}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TicketCheck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <span className="text-blue-600">{stats?.tickets.inProgress || 0} in progress</span>
            <span className="text-orange-600">{stats?.tickets.review || 0} in review</span>
          </div>
        </div>

        {/* Budget Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Budget Used</p>
              <p className="text-2xl font-bold text-gray-900">
                ${((stats?.budget.spentMonthly || 0) / 100).toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Wallet className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{budgetUsed.toFixed(1)}%</span>
              <span className="text-gray-400">
                of ${((stats?.budget.monthlyLimit || 0) / 100).toFixed(2)}
              </span>
            </div>
            <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  budgetUsed > 90 ? 'bg-red-500' : budgetUsed > 75 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(budgetUsed, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts & Heartbeats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
              Pending Approvals
            </h2>
            {stats?.approvals.pending ? (
              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                {stats.approvals.pending} pending
              </span>
            ) : null}
          </div>
          <div className="p-4">
            {stats?.approvals.pending ? (
              <div className="text-sm text-gray-600">
                You have {stats.approvals.pending} approvals waiting for your decision.
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No pending approvals
              </div>
            )}
          </div>
        </div>

        {/* Active Heartbeats */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Active Heartbeats
            </h2>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
              {stats?.heartbeats.active || 0} due
            </span>
          </div>
          <div className="p-4">
            {stats?.heartbeats.active ? (
              <div className="text-sm text-gray-600">
                {stats.heartbeats.active} heartbeats are scheduled to run soon.
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                No heartbeats due
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Budget Alerts */}
      {stats?.budget.alerts ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
          <AlertTriangle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-900">Budget Alert</h3>
            <p className="text-sm text-red-700 mt-1">
              {stats.budget.alerts} budgets have exceeded their alert threshold. 
              Review your spending to avoid service interruptions.
            </p>
          </div>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <a 
            href="/tickets/new" 
            className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <TicketCheck className="w-5 h-5 mr-3 text-blue-600" />
            <span className="text-sm font-medium">Create Ticket</span>
          </a>
          <a 
            href="/goals/new" 
            className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Target className="w-5 h-5 mr-3 text-green-600" />
            <span className="text-sm font-medium">Add Goal</span>
          </a>
          <a 
            href="/agents" 
            className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Zap className="w-5 h-5 mr-3 text-yellow-600" />
            <span className="text-sm font-medium">View Agents</span>
          </a>
          <a 
            href="/terminal" 
            className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Server className="w-5 h-5 mr-3 text-purple-600" />
            <span className="text-sm font-medium">Open Terminal</span>
          </a>
        </div>
      </div>
    </div>
  )
}
