import { PrismaClient } from "@prisma/client";
import { prisma } from "../index.js";
import { logger } from "../utils/logger.js";

export interface CreateBudgetInput {
  entityType: string;
  entityId: string;
  monthlyLimit?: number;
  alertThreshold?: number;
}

export interface UpdateBudgetInput {
  monthlyLimit?: number;
  alertThreshold?: number;
}

export interface CostBreakdown {
  model: string;
  amount: number;
  percentage: number;
}

export class BudgetService {
  async list(companyId: string) {
    const budgets = await prisma.budget.findMany({
      where: { companyId },
      orderBy: { updatedAt: "desc" },
    });
    return budgets.map(this.mapBudget);
  }

  async getById(id: string, companyId: string) {
    const budget = await prisma.budget.findFirst({
      where: { id, companyId },
    });
    return budget ? this.mapBudget(budget) : null;
  }

  async create(companyId: string, data: CreateBudgetInput) {
    const budget = await prisma.budget.create({
      data: {
        ...data,
        companyId,
        alertThreshold: data.alertThreshold ?? 80,
      },
    });
    return this.mapBudget(budget);
  }

  async update(id: string, companyId: string, data: UpdateBudgetInput) {
    const budget = await prisma.budget.findFirst({
      where: { id, companyId },
    });
    
    if (!budget) return null;
    
    // If budget was paused and limit increased, unpause
    const shouldUnpause = budget.pausedAt && data.monthlyLimit && 
      Number(budget.spentMonthly) < (data.monthlyLimit * 100); // Convert to cents
    
    const updated = await prisma.budget.update({
      where: { id },
      data: {
        ...data,
        ...(shouldUnpause ? { pausedAt: null } : {}),
        updatedAt: new Date(),
      },
    });
    
    return this.mapBudget(updated);
  }

  async delete(id: string, companyId: string) {
    await prisma.budget.deleteMany({
      where: { id, companyId },
    });
    return true;
  }

  // Track cost and check for alerts/auto-pause
  async trackCost(
    companyId: string, 
    entityType: string, 
    entityId: string, 
    amount: number, 
    model?: string
  ) {
    const budget = await prisma.budget.findFirst({
      where: { companyId, entityType, entityId },
    });

    if (!budget) {
      logger.warn(`No budget found for ${entityType}:${entityId}`);
      return null;
    }

    // Check if budget is paused
    if (budget.pausedAt) {
      throw new Error("Budget paused - spending limit reached");
    }

    // Update spent amounts
    const updated = await prisma.budget.update({
      where: { id: budget.id },
      data: {
        spentMonthly: { increment: amount },
        spentTotal: { increment: amount },
      },
    });

    // Check if we should auto-pause
    if (updated.monthlyLimit && updated.spentMonthly >= updated.monthlyLimit) {
      await this.pauseBudget(updated.id, companyId, "Limit reached");
      logger.warn(`Budget ${updated.id} auto-paused: limit reached`);
    }

    // Store cost breakdown if model provided
    if (model) {
      await this.storeCostBreakdown(updated.id, model, amount);
    }

    return this.mapBudget(updated);
  }

  // Pause budget
  async pauseBudget(id: string, companyId: string, reason?: string) {
    const budget = await prisma.budget.findFirst({
      where: { id, companyId },
    });
    
    if (!budget) return null;
    
    await prisma.budget.update({
      where: { id },
      data: {
        pausedAt: new Date(),
      },
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        companyId,
        entityType: "budget",
        entityId: id,
        action: "budget_paused",
        actorId: "system",
        data: { reason: reason || "Manual pause" },
      },
    });

    return true;
  }

  // Unpause budget
  async unpauseBudget(id: string, companyId: string) {
    const budget = await prisma.budget.findFirst({
      where: { id, companyId },
    });
    
    if (!budget) return null;
    
    await prisma.budget.update({
      where: { id },
      data: {
        pausedAt: null,
        updatedAt: new Date(),
      },
    });

    return true;
  }

  // Get cost breakdown by model
  async getCostBreakdown(id: string, companyId: string): Promise<CostBreakdown[]> {
    const budget = await prisma.budget.findFirst({
      where: { id, companyId },
    });

    if (!budget) return [];

    // Aggregate cost breakdown from audit logs
    const entries = await prisma.auditLog.findMany({
      where: {
        companyId,
        entityType: "budget",
        entityId: id,
        action: "cost_tracked",
      },
    });

    const breakdown: Record<string, number> = {};
    let total = 0;

    for (const entry of entries) {
      const model = (entry.data as any)?.model || "unknown";
      const amount = (entry.data as any)?.amount || 0;
      breakdown[model] = (breakdown[model] || 0) + amount;
      total += amount;
    }

    return Object.entries(breakdown)
      .map(([model, amount]) => ({
        model,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  // Get alerts for budgets over threshold
  async getAlerts(companyId: string) {
    const budgets = await prisma.budget.findMany({
      where: { companyId },
    });

    const alerts = [];
    
    for (const budget of budgets) {
      if (!budget.monthlyLimit) continue;
      
      const utilization = (Number(budget.spentMonthly) / Number(budget.monthlyLimit)) * 100;
      
      if (budget.pausedAt) {
        alerts.push({
          id: `budget-${budget.id}-paused`,
          type: "limit",
          severity: "error",
          message: `Budget for ${budget.entityType} paused: spending limit reached`,
          budgetId: budget.id,
          utilization: 100,
        });
      } else if (utilization >= 100) {
        alerts.push({
          id: `budget-${budget.id}-limit`,
          type: "limit",
          severity: "error",
          message: `Budget limit reached for ${budget.entityType}`,
          budgetId: budget.id,
          utilization,
        });
      } else if (utilization >= budget.alertThreshold) {
        alerts.push({
          id: `budget-${budget.id}-alert`,
          type: "threshold",
          severity: "warning",
          message: `Budget at ${utilization.toFixed(1)}% of limit for ${budget.entityType}`,
          budgetId: budget.id,
          utilization,
        });
      }
    }

    return alerts;
  }

  async getStats(companyId: string) {
    const budgets = await prisma.budget.findMany({
      where: { companyId },
    });

    const totalLimit = budgets.reduce((sum, b) => sum + Number(b.monthlyLimit || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + Number(b.spentMonthly), 0);
    const alerts = await this.getAlerts(companyId);

    return {
      monthlyLimit: totalLimit,
      spentMonthly: totalSpent,
      remaining: totalLimit - totalSpent,
      alerts: alerts.length,
      paused: budgets.filter(b => b.pausedAt).length,
      total: budgets.length,
    };
  }

  private async storeCostBreakdown(budgetId: string, model: string, amount: number) {
    // Store in audit log for now
    // In production, use a separate table
    await prisma.auditLog.create({
      data: {
        companyId: "system",
        entityType: "budget",
        entityId: budgetId,
        action: "cost_tracked",
        actorId: "system",
        data: { model, amount, timestamp: new Date().toISOString() },
      },
    });
  }

  private mapBudget(b: any) {
    return {
      id: b.id,
      entityType: b.entityType,
      entityId: b.entityId,
      monthlyLimit: b.monthlyLimit?.toNumber?.() || b.monthlyLimit,
      spentMonthly: b.spentMonthly?.toNumber?.() || b.spentMonthly,
      spentTotal: b.spentTotal?.toNumber?.() || b.spentTotal,
      alertThreshold: b.alertThreshold,
      pausedAt: b.pausedAt?.toISOString?.() || b.pausedAt,
      createdAt: b.createdAt?.toISOString?.() || b.createdAt,
      updatedAt: b.updatedAt?.toISOString?.() || b.updatedAt,
    };
  }
}

export const budgetService = new BudgetService();
