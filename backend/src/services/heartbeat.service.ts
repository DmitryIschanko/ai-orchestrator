import { PrismaClient } from "@prisma/client";
import type { Heartbeat } from "../types/index.js";
import { scheduleHeartbeat, unscheduleHeartbeat, getQueueStats } from "./heartbeat.queue.js";
import { logger } from "../utils/logger.js";

const prisma = new PrismaClient();

export interface CreateHeartbeatInput {
  agentId: string;
  name?: string;
  schedule: string;
}

export interface UpdateHeartbeatInput {
  name?: string;
  schedule?: string;
  enabled?: boolean;
}

export class HeartbeatService {
  async list(companyId: string): Promise<Heartbeat[]> {
    const heartbeats = await prisma.heartbeat.findMany({
      where: { companyId },
      orderBy: { updatedAt: "desc" },
    });
    return heartbeats.map(this.mapHeartbeat);
  }

  async getById(id: string, companyId: string): Promise<Heartbeat | null> {
    const heartbeat = await prisma.heartbeat.findFirst({
      where: { id, companyId },
    });
    return heartbeat ? this.mapHeartbeat(heartbeat) : null;
  }

  async create(companyId: string, data: CreateHeartbeatInput): Promise<Heartbeat> {
    const nextRunAt = this.calculateNextRun(data.schedule);
    
    const heartbeat = await prisma.heartbeat.create({
      data: {
        ...data,
        companyId,
        nextRunAt,
      },
    });
    
    // Schedule in Bull queue
    try {
      await scheduleHeartbeat(heartbeat.id, companyId, data.agentId, data.schedule);
    } catch (error: any) {
      logger.error("Failed to schedule heartbeat:", error.message);
    }
    
    return this.mapHeartbeat(heartbeat);
  }

  async update(id: string, companyId: string, data: UpdateHeartbeatInput): Promise<Heartbeat | null> {
    const updateData: any = { updatedAt: new Date() };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.schedule !== undefined) {
      updateData.schedule = data.schedule;
      updateData.nextRunAt = this.calculateNextRun(data.schedule);
    }
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    
    const heartbeat = await prisma.heartbeat.findFirst({
      where: { id, companyId },
    });
    
    if (!heartbeat) return null;
    
    const updated = await prisma.heartbeat.update({
      where: { id },
      data: updateData,
    });
    
    // Reschedule if schedule changed or enabled/disabled
    if (data.schedule !== undefined || data.enabled !== undefined) {
      try {
        await unscheduleHeartbeat(id);
        if (data.enabled !== false) {
          await scheduleHeartbeat(id, companyId, heartbeat.agentId, data.schedule || heartbeat.schedule);
        }
      } catch (error: any) {
        logger.error("Failed to reschedule heartbeat:", error.message);
      }
    }
    
    return this.mapHeartbeat(updated);
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    const heartbeat = await prisma.heartbeat.findFirst({
      where: { id, companyId },
    });
    
    if (!heartbeat) return false;
    
    // Unschedule from Bull
    try {
      await unscheduleHeartbeat(id);
    } catch (error: any) {
      logger.error("Failed to unschedule heartbeat:", error.message);
    }
    
    await prisma.heartbeat.delete({
      where: { id },
    });
    
    return true;
  }

  async getStats(companyId: string) {
    const [total, active, enabled] = await Promise.all([
      prisma.heartbeat.count({ where: { companyId } }),
      prisma.heartbeat.count({
        where: {
          companyId,
          enabled: true,
          OR: [
            { nextRunAt: { lte: new Date() } },
            { nextRunAt: null },
          ],
        },
      }),
      prisma.heartbeat.count({ where: { companyId, enabled: true } }),
    ]);
    
    const queueStats = await getQueueStats();
    
    return {
      total,
      active,
      enabled,
      queue: queueStats,
    };
  }

  private calculateNextRun(schedule: string): Date {
    const parts = schedule.split(" ");
    const now = new Date();
    const next = new Date(now);
    
    if (parts.length === 5) {
      const [minute, hour] = parts;
      
      if (minute.startsWith("*/")) {
        const interval = parseInt(minute.slice(2));
        const currentMinute = now.getMinutes();
        const nextMinute = Math.ceil((currentMinute + 1) / interval) * interval;
        
        if (nextMinute < 60) {
          next.setMinutes(nextMinute);
        } else {
          next.setHours(next.getHours() + 1);
          next.setMinutes(0);
        }
      } else if (minute !== "*") {
        next.setMinutes(parseInt(minute));
        if (next <= now) {
          next.setHours(next.getHours() + 1);
        }
      }
      
      if (hour !== "*" && !hour.startsWith("*/")) {
        next.setHours(parseInt(hour));
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
      }
    }
    
    if (next <= now) {
      next.setMinutes(next.getMinutes() + 5);
    }
    
    return next;
  }

  private mapHeartbeat(hb: any): Heartbeat {
    return {
      id: hb.id,
      agentId: hb.agentId,
      name: hb.name ?? undefined,
      schedule: hb.schedule,
      enabled: hb.enabled,
      lastRunAt: hb.lastRunAt?.toISOString(),
      nextRunAt: hb.nextRunAt?.toISOString(),
      runCount: hb.runCount,
      failCount: hb.failCount,
      createdAt: hb.createdAt.toISOString(),
      updatedAt: hb.updatedAt.toISOString(),
    };
  }
}

export const heartbeatService = new HeartbeatService();
