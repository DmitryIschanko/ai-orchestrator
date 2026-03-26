import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();

  connect(token: string) {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket?.id);
    });

    this.socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    // Listen for real-time events
    this.socket.on("agent.status", (data) => {
      this.emit("agent.status", data);
    });

    this.socket.on("terminal.output", (data) => {
      this.emit("terminal.output", data);
    });

    this.socket.on("ticket.updated", (data) => {
      this.emit("ticket.updated", data);
    });

    this.socket.on("goal.updated", (data) => {
      this.emit("goal.updated", data);
    });

    this.socket.on("notification", (data) => {
      this.emit("notification", data);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  subscribeToGateway() {
    this.socket?.emit("gateway:subscribe");
  }

  subscribeToTerminal(agentId: string) {
    this.socket?.emit("terminal:subscribe", agentId);
  }

  unsubscribeFromTerminal(agentId: string) {
    this.socket?.emit("terminal:unsubscribe", agentId);
  }
  subscribeToAgent(agentId: string) {
    this.socket?.emit("agent:subscribe", agentId);
  }

  unsubscribeFromAgent(agentId: string) {
    this.socket?.emit("agent:unsubscribe", agentId);
  }

  sendTerminalData(agentId: string, data: string) {
    this.socket?.emit("terminal:data", { agentId, data });
  }

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  off(event: string, callback: (data: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in listener for ${event}:`, error);
      }
    });
  }
}

export const socketService = new SocketService();
export default socketService;
