import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'x-company-id': 'default',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const userId = localStorage.getItem('userId')
    if (userId) {
      config.headers['x-user-id'] = userId
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        })

        localStorage.setItem('accessToken', data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`

        return api(originalRequest)
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
  getHealth: () => api.get('/health'),
}

// Goals
export const goalsApi = {
  list: () => api.get('/goals'),
  getHierarchy: () => api.get('/goals/hierarchy'),
  get: (id: string) => api.get(`/goals/${id}`),
  create: (data: any) => api.post('/goals', data),
  update: (id: string, data: any) => api.patch(`/goals/${id}`, data),
  updateProgress: (id: string, progress: number) => 
    api.patch(`/goals/${id}/progress`, { progress }),
  delete: (id: string) => api.delete(`/goals/${id}`),
}

// Tickets
export const ticketsApi = {
  list: (filters?: { status?: string; goalId?: string }) => 
    api.get('/tickets', { params: filters }),
  getStats: () => api.get('/tickets/stats'),
  get: (id: string) => api.get(`/tickets/${id}`),
  create: (data: any) => api.post('/tickets', data),
  update: (id: string, data: any) => api.patch(`/tickets/${id}`, data),
  addEvent: (id: string, type: string, data: any) => 
    api.post(`/tickets/${id}/events`, { type, data }),
  delete: (id: string) => api.delete(`/tickets/${id}`),
}

// Budgets
export const budgetsApi = {
  list: () => api.get('/budgets'),
  getStats: () => api.get('/budgets/stats'),
  getAlerts: () => api.get('/budgets/alerts'),
  get: (id: string) => api.get(`/budgets/${id}`),
  getByEntity: (type: string, id: string) => 
    api.get(`/budgets/entity/${type}/${id}`),
  create: (data: any) => api.post('/budgets', data),
  update: (id: string, data: any) => api.patch(`/budgets/${id}`, data),
  trackCost: (id: string, amount: number, model?: string) => 
    api.post(`/budgets/${id}/track`, { amount, model }),
  resetMonthly: () => api.post('/budgets/reset-monthly'),
  delete: (id: string) => api.delete(`/budgets/${id}`),
}

// Org
export const orgApi = {
  list: () => api.get('/org'),
  getHierarchy: () => api.get('/org/hierarchy'),
  get: (id: string) => api.get(`/org/${id}`),
  create: (data: any) => api.post('/org', data),
  update: (id: string, data: any) => api.patch(`/org/${id}`, data),
  updatePositions: (positions: { id: string; x: number; y: number }[]) => 
    api.post('/org/positions', { positions }),
  assignAgent: (id: string, agentId: string | null) => 
    api.post(`/org/${id}/assign-agent`, { agentId }),
  delete: (id: string) => api.delete(`/org/${id}`),
}

// Heartbeats
export const heartbeatsApi = {
  list: () => api.get('/heartbeats'),
  getStats: () => api.get('/heartbeats/stats'),
  getDue: () => api.get('/heartbeats/due'),
  get: (id: string) => api.get(`/heartbeats/${id}`),
  create: (data: any) => api.post('/heartbeats', data),
  update: (id: string, data: any) => api.patch(`/heartbeats/${id}`, data),
  recordRun: (id: string, success: boolean) => 
    api.post(`/heartbeats/${id}/run`, { success }),
  delete: (id: string) => api.delete(`/heartbeats/${id}`),
}

// Approvals
export const approvalsApi = {
  list: (filters?: { status?: string }) => api.get('/approvals', { params: filters }),
  getStats: () => api.get('/approvals/stats'),
  getPending: () => api.get('/approvals/pending'),
  get: (id: string) => api.get(`/approvals/${id}`),
  create: (data: any) => api.post('/approvals', data),
  decide: (id: string, decision: 'approved' | 'rejected') => 
    api.post(`/approvals/${id}/decide`, { decision }),
  cancel: (id: string) => api.delete(`/approvals/${id}`),
}

// Skills
export const skillsApi = {
  list: (filters?: { enabled?: boolean }) => api.get('/skills', { params: filters }),
  getStats: () => api.get('/skills/stats'),
  import: (hubUrl: string) => api.post('/skills/import', { hubUrl }),
  get: (id: string) => api.get(`/skills/${id}`),
  create: (data: any) => api.post('/skills', data),
  update: (id: string, data: any) => api.patch(`/skills/${id}`, data),
  toggle: (id: string) => api.post(`/skills/${id}/toggle`),
  delete: (id: string) => api.delete(`/skills/${id}`),
}

// Gateway (Agents)
export const gatewayApi = {
  getStatus: () => api.get('/gateway/status'),
  getAgents: () => api.get('/gateway/agents'),
  getAgent: (id: string) => api.get(`/gateway/agents/${id}`),
  sendMessage: (id: string, message: string) => 
    api.post(`/gateway/agents/${id}/message`, { message }),
  connectTerminal: (id: string) => 
    api.post(`/gateway/agents/${id}/terminal/connect`),
  disconnectTerminal: (id: string) => 
    api.post(`/gateway/agents/${id}/terminal/disconnect`),
  sendTerminalInput: (id: string, input: string) => 
    api.post(`/gateway/agents/${id}/terminal/input`, { input }),
  reconnect: () => api.post('/gateway/reconnect'),
}
