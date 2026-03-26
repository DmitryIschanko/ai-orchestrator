import { prisma } from "../index.js";
import { logger } from "../utils/logger.js";

export interface AuditLogEntry {
  id: string;
  companyId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  data?: any;
  createdAt: Date;
}

export class AuditService {
  /**
   * Log an action
   */
  async log(
    companyId: string,
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    data?: any
  ): Promise<AuditLogEntry> {
    try {
      const entry = await prisma.auditLog.create({
        data: {
          companyId,
          actorId,
          action,
          entityType,
          entityId,
          data: data || {},
        },
      });

      logger.info(`[AUDIT] ${action} on ${entityType}:${entityId} by ${actorId}`);

      return {
        id: entry.id,
        companyId: entry.companyId,
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        data: entry.data,
        createdAt: entry.createdAt,
      };
    } catch (error) {
      logger.error("[AUDIT] Failed to log action:", error);
      throw error;
    }
  }

  /**
   * Get audit logs for a company
   */
  async getLogs(
    companyId: string,
    options: {
      actorId?: string;
      entityType?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ logs: AuditLogEntry[]; total: number }> {
    const {
      actorId,
      entityType,
      action,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = options;

    const where: any = { companyId };

    if (actorId) where.actorId = actorId;
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs: logs.map((entry) => ({
        id: entry.id,
        companyId: entry.companyId,
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        data: entry.data,
        createdAt: entry.createdAt,
      })),
      total,
    };
  }

  /**
   * Get recent activity for a user
   */
  async getUserActivity(
    companyId: string,
    actorId: string,
    limit: number = 10
  ): Promise<AuditLogEntry[]> {
    const logs = await prisma.auditLog.findMany({
      where: { companyId, actorId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return logs.map((entry) => ({
      id: entry.id,
      companyId: entry.companyId,
      actorId: entry.actorId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      data: entry.data,
      createdAt: entry.createdAt,
    }));
  }
}

export const auditService = new AuditService();
