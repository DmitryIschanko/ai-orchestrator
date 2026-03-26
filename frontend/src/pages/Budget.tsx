import { useEffect, useState } from 'react'
import { 
  Wallet, 
  Plus, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Trash2,
  Edit2
} from 'lucide-react'
import { budgetsApi } from '../services/api'
import type { Budget, BudgetAlert } from '../types'

export function Budget() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [alerts, setAlerts] = useState<BudgetAlert[]>([])
  const [stats, setStats] = useState({ monthlyLimit: 0, spentMonthly: 0, remaining: 0, alerts: 0 })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [formData, setFormData] = useState({
    entityType: 'org_node',
    entityId: '',
    monthlyLimit: '',
    alertThreshold: 80,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [budgetsRes, alertsRes, statsRes] = await Promise.all([
        budgetsApi.list(),
        budgetsApi.getAlerts(),
        budgetsApi.getStats(),
      ])
      setBudgets(budgetsRes.data.budgets)
      setAlerts(alertsRes.data.alerts)
      setStats(statsRes.data.stats)
    } catch (error) {
      console.error('Failed to load budget data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await budgetsApi.create({
        entityType: formData.entityType,
        entityId: formData.entityId,
        monthlyLimit: parseFloat(formData.monthlyLimit) * 100, // Convert to cents
        alertThreshold: formData.alertThreshold,
      })
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to create budget:', error)
      alert('Failed to create budget')
    }
  }

  const handleUpdate = async () => {
    if (!editingBudget) return

    try {
      const data: any = {}
      if (formData.monthlyLimit) {
        data.monthlyLimit = parseFloat(formData.monthlyLimit) * 100
      }
      if (formData.alertThreshold) {
        data.alertThreshold = formData.alertThreshold
      }

      await budgetsApi.update(editingBudget.id, data)
      setShowModal(false)
      setEditingBudget(null)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to update budget:', error)
      alert('Failed to update budget')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return

    try {
      await budgetsApi.delete(id)
      loadData()
    } catch (error) {
      console.error('Failed to delete budget:', error)
    }
  }

  const openEditModal = (budget: Budget) => {
    setEditingBudget(budget)
    setFormData({
      entityType: budget.entityType,
      entityId: budget.entityId,
      monthlyLimit: budget.monthlyLimit ? (budget.monthlyLimit / 100).toString() : '',
      alertThreshold: budget.alertThreshold,
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      entityType: 'org_node',
      entityId: '',
      monthlyLimit: '',
      alertThreshold: 80,
    })
  }

  const getUtilization = (budget: Budget) => {
    if (!budget.monthlyLimit) return 0
    return (budget.spentMonthly / budget.monthlyLimit) * 100
  }

  const getStatusColor = (utilization: number) => {
    if (utilization >= 100) return 'bg-red-500'
    if (utilization >= 80) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
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
          <Wallet className="w-6 h-6 mr-2" />
          Budget
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Budget
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly Budget</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyLimit)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Spent This Month</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.spentMonthly)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Remaining</p>
              <p className={`text-2xl font-bold ${stats.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(stats.remaining)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              className={`p-4 rounded-lg flex items-start ${
                alert.type === 'limit' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
              }`}
            >
              <AlertTriangle className={`w-5 h-5 mr-3 flex-shrink-0 ${
                alert.type === 'limit' ? 'text-red-600' : 'text-yellow-600'
              }`} />
              <div>
                <h3 className={`font-medium ${alert.type === 'limit' ? 'text-red-900' : 'text-yellow-900'}`}>
                  {alert.type === 'limit' ? 'Budget Limit Reached' : 'Budget Alert'}
                </h3>
                <p className={`text-sm mt-1 ${alert.type === 'limit' ? 'text-red-700' : 'text-yellow-700'}`}>
                  {alert.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budgets List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Budget Allocations</h2>
        </div>
        
        {budgets.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Budgets Configured</h3>
            <p className="text-gray-600 mt-2">Set up budgets to track spending by entity.</p>
          </div>
        ) : (
          <div className="divide-y">
            {budgets.map((budget) => {
              const utilization = getUtilization(budget)
              
              return (
                <div key={budget.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">
                          {budget.entityType}: {budget.entityId.slice(0, 8)}...
                        </h3>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {budget.entityType}
                        </span>
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-6 text-sm">
                        <div>
                          <span className="text-gray-500">Limit:</span>{' '}
                          <span className="font-medium">
                            {budget.monthlyLimit ? formatCurrency(budget.monthlyLimit) : 'Unlimited'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Spent:</span>{' '}
                          <span className="font-medium">{formatCurrency(budget.spentMonthly)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Alert at:</span>{' '}
                          <span className="font-medium">{budget.alertThreshold}%</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">{utilization.toFixed(1)}% used</span>
                          {budget.pausedAt && (
                            <span className="text-red-600 font-medium">PAUSED</span>
                          )}
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getStatusColor(utilization)}`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => openEditModal(budget)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-900">
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              {!editingBudget && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
                    <select
                      value={formData.entityType}
                      onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="company">Company</option>
                      <option value="org_node">Org Node</option>
                      <option value="goal">Goal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entity ID</label>
                    <input
                      type="text"
                      value={formData.entityId}
                      onChange={(e) => setFormData({ ...formData, entityId: e.target.value })}
                      className="w-full p-2 border rounded-lg"
                      placeholder="Enter entity ID"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Limit ($)</label>
                <input
                  type="number"
                  value={formData.monthlyLimit}
                  onChange={(e) => setFormData({ ...formData, monthlyLimit: e.target.value })}
                  className="w-full p-2 border rounded-lg"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alert Threshold (%)</label>
                <input
                  type="number"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({ ...formData, alertThreshold: parseInt(e.target.value) })}
                  className="w-full p-2 border rounded-lg"
                  min="1"
                  max="100"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingBudget(null)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={editingBudget ? handleUpdate : handleCreate}
                disabled={!editingBudget && (!formData.entityId || !formData.monthlyLimit)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {editingBudget ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
