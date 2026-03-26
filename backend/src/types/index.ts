// API Types for AI Orchestrator

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'busy' | 'error' | 'offline';
  department?: string;
  skills: string[];
  currentTask?: string;
  lastSeen: string;
  costToday: number;
  costMonth: number;
  goalsCompleted: number;
}

export interface Ticket {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'review' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  goalId?: string;
  ownerId?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  events: TicketEvent[];
}

export interface TicketEvent {
  id: string;
  type: string;
  data: any;
  createdById?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  type: 'mission' | 'objective' | 'key_result' | 'task';
  title: string;
  description?: string;
  status: 'active' | 'completed' | 'cancelled' | 'on_hold';
  progress: number;
  parentId?: string;
  assignedToId?: string;
  dueDate?: string;
  children?: Goal[];
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  entityType: 'company' | 'org_node' | 'goal';
  entityId: string;
  monthlyLimit?: number;
  spentMonthly: number;
  spentTotal: number;
  alertThreshold: number;
  pausedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'threshold' | 'limit';
  message: string;
  triggeredAt: string;
  acknowledged: boolean;
}

export interface OrgNode {
  id: string;
  title: string;
  department?: string;
  agentId?: string;
  reportsToId?: string;
  level: number;
  positionX?: number;
  positionY?: number;
  metadata: any;
  children?: OrgNode[];
  createdAt: string;
  updatedAt: string;
}

export interface Heartbeat {
  id: string;
  agentId: string;
  name?: string;
  schedule: string;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  runCount: number;
  failCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Approval {
  id: string;
  type: string;
  title: string;
  description?: string;
  requesterId: string;
  data: any;
  status: 'pending' | 'approved' | 'rejected';
  approverId?: string;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  source?: string;
  sourceUrl?: string;
  content?: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  provider: string;
  name?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  agents: {
    total: number;
    active: number;
    idle: number;
    busy: number;
    error: number;
  };
  goals: {
    total: number;
    active: number;
    completed: number;
  };
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    review: number;
  };
  budget: {
    monthlyLimit: number;
    spentMonthly: number;
    remaining: number;
    alerts: number;
  };
  heartbeats: {
    total: number;
    active: number;
  };
  approvals: {
    pending: number;
  };
}

export interface GatewayStatus {
  connected: boolean;
  authenticated: boolean;
  url: string;
  agents: Agent[];
}

export interface TerminalSession {
  id: string;
  agentId: string;
  status: 'connected' | 'disconnected';
  lastActivity: string;
}
