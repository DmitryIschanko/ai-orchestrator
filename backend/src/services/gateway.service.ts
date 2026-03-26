import WebSocket from 'ws';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';
import type { Agent } from '../types/index.js';

// Generate UUID v4 using crypto
function generateUUID(): string {
  return crypto.randomUUID();
}

// Message types
interface GatewayMessage {
  type: string;
  [key: string]: any;
}

interface ConnectChallengePayload {
  nonce: string;
  ts: number;
}

interface AgentStatus {
  id: string;
  name: string;
  status: string;
  role?: string;
  department?: string;
  currentTask?: string;
  lastSeen: string;
}

class GatewayService {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private eventHandlers: Map<string, ((data: any) => void)[]> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectNonce: string | null = null;
  private gatewayUrl: string;
  private gatewayPassword: string;
  private gatewayToken: string;
  private isAuthenticated: boolean = false;
  private agents: Map<string, AgentStatus> = new Map();
  private terminalOutputHandlers: Map<string, ((data: string) => void)[]> = new Map();

  constructor() {
    this.gatewayUrl = process.env.GATEWAY_URL || 'ws://172.17.0.1:18789';
    this.gatewayPassword = process.env.GATEWAY_PASSWORD || '';
    this.gatewayToken = process.env.GATEWAY_TOKEN || '';
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      logger.info(`Connecting to Gateway at ${this.gatewayUrl}`);
      
      this.ws = new WebSocket(this.gatewayUrl);
      
      this.ws.on('open', () => {
        logger.info('Gateway WebSocket connected, waiting for challenge...');
        this.isAuthenticated = false;
      });
      
      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const rawMessage = data.toString();
          logger.debug('Gateway message received:', rawMessage);
          
          const message: GatewayMessage = JSON.parse(rawMessage);
          this.handleMessage(message);
        } catch (error) {
          logger.error('Failed to parse gateway message:', error);
        }
      });
      
      this.ws.on('error', (error: Error) => {
        logger.error('Gateway WebSocket error:', error.message);
        this.scheduleReconnect();
      });
      
      this.ws.on('close', (code: number, reason: Buffer) => {
        const reasonStr = reason.toString() || 'unknown';
        logger.warn(`Gateway WebSocket closed: code=${code}, reason=${reasonStr}`);
        this.isAuthenticated = false;
        this.scheduleReconnect();
      });
      
    } catch (error) {
      logger.error('Failed to connect to Gateway:', error);
      this.scheduleReconnect();
    }
  }

  private handleMessage(message: GatewayMessage): void {
    // Log all events for debugging
    if (message.type === 'event' && message.event) {
      logger.info(`Gateway event received: ${message.event}`, message.payload);
    }
    
    // Handle connect challenge
    if (message.type === 'event' && message.event === 'connect.challenge') {
      const payload = message.payload as ConnectChallengePayload;
      logger.info('Received connect challenge');
      
      if (payload?.nonce) {
        this.connectNonce = payload.nonce;
        this.sendConnect();
      } else {
        logger.error('Challenge missing nonce');
        this.ws?.close(1008, 'challenge missing nonce');
      }
      return;
    }
    
    // Handle hello-ok response (successful connection)
    if (message.type === 'res' && message.ok === true && message.payload?.type === 'hello-ok') {
      logger.info('Gateway authentication successful');
      this.isAuthenticated = true;
      this.refreshAgents();
      return;
    }
    
    // Handle connection errors
    if (message.type === 'res' && message.ok === false) {
      logger.error('Gateway connection error:', message.error);
      return;
    }
    

    // Handle health events (contains agents info)
    if (message.type === "event" && message.event === "health") {
      const agents = message.payload?.agents;
      if (Array.isArray(agents)) {
        agents.forEach((agent: any) => {
          if (agent.agentId) {
            this.agents.set(agent.agentId, {
              id: agent.agentId,
              name: agent.agentId,
              status: agent.heartbeat?.enabled ? "active" : "idle",
              role: "agent",
              lastSeen: new Date().toISOString(),
            });
          }
        });
      }
    }
    // Handle agent status updates
    if (message.type === 'event' && message.event === 'agent.status') {
      this.handleAgentStatus(message.payload);
    }
    
    // Handle terminal output
    if (message.type === 'event' && message.event === 'terminal.output') {
      this.handleTerminalOutput(message.payload);
    }
    
    // Forward events to registered handlers
    if (message.type === 'event' && message.event) {
      const handlers = this.eventHandlers.get(message.event);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message.payload);
          } catch (error) {
            logger.error(`Error in event handler for ${message.event}:`, error);
          }
        });
      }
    }
    
    // Handle generic messages
    const handlers = this.messageHandlers.get('message');
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          logger.error('Error in message handler:', error);
        }
      });
    }
  }

  private sendConnect(): void {
    if (!this.connectNonce) {
      logger.error('Cannot send connect: missing nonce');
      return;
    }
    
    if (!this.gatewayToken && !this.gatewayPassword) {
      logger.error('Cannot send connect: missing GATEWAY_TOKEN or GATEWAY_PASSWORD env var');
      return;
    }

    const requestId = generateUUID();
    
    const connectMessage = {
      type: 'req',
      id: requestId,
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'gateway-client',
          version: '1.0.0',
          platform: 'linux',
          mode: 'backend'
        },
        role: 'operator',
        caps: [],
        commands: [],
        permissions: {},
        auth: this.gatewayToken 
          ? { token: this.gatewayToken }
          : { password: this.gatewayPassword },
        locale: 'en-US',
        userAgent: 'ai-orchestrator/1.0.0'
      }
    };

    logger.info('Sending connect request...');
    this.send(connectMessage);
  }

  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      logger.warn('Cannot send message: WebSocket not open');
    }
  }

  // Subscribe to Gateway events
  on(event: string, handler: (data: any) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
    
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }
  


  // Send message to agent via Gateway
  sendMessage(agentId: string, content: string): void {
    this.send({
      type: 'req',
      id: generateUUID(),
      method: 'chat.send',
      params: {
        agentId,
        message: content
      }
    });
  }

  // Subscribe to specific message types
  subscribe(eventType: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, []);
    }
    this.messageHandlers.get(eventType)!.push(handler);
    
    return () => {
      const handlers = this.messageHandlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    this.reconnectTimer = setTimeout(() => {
      logger.info('Attempting to reconnect to Gateway...');
      this.connect();
    }, 5000);
  }

  private handleAgentStatus(payload: any): void {
    if (payload?.agentId) {
      this.agents.set(payload.agentId, {
        id: payload.agentId,
        name: payload.name || payload.agentId,
        status: payload.status || 'unknown',
        role: payload.role,
        department: payload.department,
        currentTask: payload.currentTask,
        lastSeen: new Date().toISOString(),
      });
    }
  }

  private handleTerminalOutput(payload: any): void {
    if (payload?.agentId && payload?.output) {
      const handlers = this.terminalOutputHandlers.get(payload.agentId);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(payload.output);
          } catch (error) {
            logger.error('Error in terminal output handler:', error);
          }
        });
      }
    }
  }

  private refreshAgents(): void {
    // Request current agent list from gateway
    this.send({
      type: 'req',
      id: generateUUID(),
      method: 'agents.list',
      params: {}
    });
  }

  getStatus(): { connected: boolean; authenticated: boolean; url: string } {
    return {
      connected: this.ws?.readyState === WebSocket.OPEN,
      authenticated: this.isAuthenticated,
      url: this.gatewayUrl
    };
  }

  getAgents(): Agent[] {
    return Array.from(this.agents.values()).map(a => ({
      id: a.id,
      name: a.name,
      role: a.role || 'agent',
      status: this.mapAgentStatus(a.status),
      department: a.department,
      skills: [],
      currentTask: a.currentTask,
      lastSeen: a.lastSeen,
      costToday: 0,
      costMonth: 0,
      goalsCompleted: 0,
    }));
  }

  getAgent(agentId: string): Agent | undefined {
    const agent = this.agents.get(agentId);
    if (!agent) return undefined;
    
    return {
      id: agent.id,
      name: agent.name,
      role: agent.role || 'agent',
      status: this.mapAgentStatus(agent.status),
      department: agent.department,
      skills: [],
      currentTask: agent.currentTask,
      lastSeen: agent.lastSeen,
      costToday: 0,
      costMonth: 0,
      goalsCompleted: 0,
    };
  }

  // Terminal operations
  connectTerminal(agentId: string): void {
    this.send({
      type: 'req',
      id: generateUUID(),
      method: 'terminal.connect',
      params: { agentId }
    });
  }

  disconnectTerminal(agentId: string): void {
    this.send({
      type: 'req',
      id: generateUUID(),
      method: 'terminal.disconnect',
      params: { agentId }
    });
    this.terminalOutputHandlers.delete(agentId);
  }

  sendTerminalInput(agentId: string, input: string): void {
    this.send({
      type: 'req',
      id: generateUUID(),
      method: 'terminal.input',
      params: { agentId, input }
    });
  }

  onTerminalOutput(agentId: string, handler: (data: string) => void): () => void {
    if (!this.terminalOutputHandlers.has(agentId)) {
      this.terminalOutputHandlers.set(agentId, []);
    }
    this.terminalOutputHandlers.get(agentId)!.push(handler);
    
    return () => {
      const handlers = this.terminalOutputHandlers.get(agentId);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  private mapAgentStatus(status: string): 'active' | 'idle' | 'busy' | 'error' | 'offline' {
    switch (status.toLowerCase()) {
      case 'active':
      case 'online':
        return 'active';
      case 'idle':
        return 'idle';
      case 'busy':
      case 'working':
        return 'busy';
      case 'error':
        return 'error';
      case 'offline':
      default:
        return 'offline';
    }
  }

  onEvent(event: string, handler: (data: any) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
    
    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  async executeCommand(agentId: string, command: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const requestId = generateUUID();
      
      const timeout = setTimeout(() => {
        reject(new Error("Command execution timeout"));
      }, 30000);
      
      const handler = (message: any) => {
        if (message.type === "res" && message.id === requestId) {
          clearTimeout(timeout);
          if (message.ok) {
            resolve(message.payload);
          } else {
            reject(new Error(message.error?.message || "Command failed"));
          }
        }
      };
      
      this.ws?.once("message", (data: any) => {
        try {
          const message = JSON.parse(data.toString());
          handler(message);
        } catch (e) {
          // ignore
        }
      });
      
      this.send({
        type: "req",
        id: requestId,
        method: "agent.execute",
        params: { agentId, command }
      });
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isAuthenticated = false;
    this.agents.clear();
    this.terminalOutputHandlers.clear();
  }
}

export const gatewayService = new GatewayService();
export default gatewayService;
