import { prisma } from "../index.js";
import { logger } from "../utils/logger.js";

export class AgentService {
  async getAgents(companyId: string) {
    try {
      // Get agents from heartbeats for now
      const heartbeats = await prisma.heartbeat.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
      });

      return heartbeats.map(hb => ({
        id: hb.agentId,
        name: hb.name,
        status: hb.enabled ? (hb.failCount > 0 ? "error" : "idle") : "offline",
        lastHeartbeat: hb.updatedAt,
        schedule: hb.schedule,
        runCount: hb.runCount,
        failCount: hb.failCount,
      }));
    } catch (error: any) {
      logger.error("[AgentService] Get agents error:", error);
      throw error;
    }
  }

  async createAgent(companyId: string, data: any) {
    try {
      const heartbeat = await prisma.heartbeat.create({
        data: {
          companyId,
          agentId: data.agentId || `agent-${Date.now()}`,
          name: data.name,
          schedule: data.schedule || "*/5 * * * *",
          enabled: true,
        },
      });

      return {
        id: heartbeat.agentId,
        name: heartbeat.name,
        status: "idle",
        lastHeartbeat: heartbeat.updatedAt,
        schedule: heartbeat.schedule,
      };
    } catch (error: any) {
      logger.error("[AgentService] Create agent error:", error);
      throw error;
    }
  }

  async updateAgent(companyId: string, agentId: string, data: any) {
    try {
      const heartbeat = await prisma.heartbeat.updateMany({
        where: { companyId, agentId },
        data: {
          name: data.name,
          schedule: data.schedule,
          enabled: data.enabled,
        },
      });

      return heartbeat;
    } catch (error: any) {
      logger.error("[AgentService] Update agent error:", error);
      throw error;
    }
  }

  async deleteAgent(companyId: string, agentId: string) {
    try {
      await prisma.heartbeat.deleteMany({
        where: { companyId, agentId },
      });

      return { success: true };
    } catch (error: any) {
      logger.error("[AgentService] Delete agent error:", error);
      throw error;
    }
  }
}

export const agentService = new AgentService();
