import { PrismaClient } from '@prisma/client';
import type { Approval } from '../types/index.js';

const prisma = new PrismaClient();

export interface CreateApprovalInput {
  type: string;
  title: string;
  description?: string;
  requesterId: string;
  reason?: string;
  data?: any;
}

export interface DecideApprovalInput {
  decision: 'approved' | 'rejected';
  approverId: string;
  reason?: string;
}

export class ApprovalService {
  async list(companyId: string, filters?: { status?: string }): Promise<Approval[]> {
    const where: any = { companyId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    
    const approvals = await prisma.approval.findMany({
      where,
      include: {
        requester: true,
        approver: {
          select: { id: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return approvals.map(this.mapApproval);
  }

  async getById(id: string, companyId: string): Promise<Approval | null> {
    const approval = await prisma.approval.findFirst({
      where: { id, companyId },
      include: {
        requester: true,
        approver: {
          select: { id: true, email: true },
        },
      },
    });
    
    return approval ? this.mapApproval(approval) : null;
  }

  async create(companyId: string, data: CreateApprovalInput): Promise<Approval> {
    const approval = await prisma.approval.create({
      data: {
        ...data,
        companyId,
        data: data.data ?? {},
      },
      include: {
        requester: true,
        approver: {
          select: { id: true, email: true },
        },
      },
    });
    
    return this.mapApproval(approval);
  }

  async decide(id: string, companyId: string, data: DecideApprovalInput): Promise<Approval | null> {
    const approval = await prisma.approval.findFirst({
      where: { id, companyId, status: 'pending' },
    });
    
    if (!approval) return null;
    
    const updated = await prisma.approval.update({
      where: { id },
      data: {
        status: data.decision,
        approverId: data.approverId,
        decidedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        requester: true,
        approver: {
          select: { id: true, email: true },
        },
      },
    });
    
    return this.mapApproval(updated);
  }

  async cancel(id: string, companyId: string): Promise<boolean> {
    const result = await prisma.approval.deleteMany({
      where: { id, companyId, status: 'pending' },
    });
    return result.count > 0;
  }

  async getStats(companyId: string) {
    const [
      total,
      pending,
      approved,
      rejected,
    ] = await Promise.all([
      prisma.approval.count({ where: { companyId } }),
      prisma.approval.count({ where: { companyId, status: 'pending' } }),
      prisma.approval.count({ where: { companyId, status: 'approved' } }),
      prisma.approval.count({ where: { companyId, status: 'rejected' } }),
    ]);
    
    return {
      total,
      pending,
      approved,
      rejected,
    };
  }

  async getPendingForApprover(companyId: string, _approverId: string): Promise<Approval[]> {
    // This could be extended to check permissions
    // For now, return all pending approvals
    return this.list(companyId, { status: 'pending' });
  }


  async approve(
    id: string,
    companyId: string,
    actorId: string,
    comment?: string
  ): Promise<Approval | null> {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!actor || (actor.role !== "admin" && actor.role !== "manager")) {
      throw new Error("Insufficient permissions");
    }

    const approval = await prisma.approval.findFirst({
      where: { id, companyId, status: "pending" },
    });

    if (!approval) return null;
    if (approval.requesterId === actorId) {
      throw new Error("Cannot approve own request");
    }

    const updated = await prisma.approval.update({
      where: { id },
      data: {
        status: "approved",
        approverId: actorId,
        decidedAt: new Date(),
        data: comment ? { comment } : {},
      },
    });

    return this.mapApproval(updated);
  }

  async reject(
    id: string,
    companyId: string,
    actorId: string,
    comment?: string
  ): Promise<Approval | null> {
    const actor = await prisma.user.findUnique({ where: { id: actorId } });
    if (!actor || (actor.role !== "admin" && actor.role !== "manager")) {
      throw new Error("Insufficient permissions");
    }

    const approval = await prisma.approval.findFirst({
      where: { id, companyId, status: "pending" },
    });

    if (!approval) return null;
    if (approval.requesterId === actorId) {
      throw new Error("Cannot reject own request");
    }

    const updated = await prisma.approval.update({
      where: { id },
      data: {
        status: "rejected",
        approverId: actorId,
        decidedAt: new Date(),
        data: comment ? { comment } : {},
      },
    });

    return this.mapApproval(updated);
  }

  private mapApproval(approval: any): Approval {
    return {
      id: approval.id,
      type: approval.type,
      title: approval.title,
      description: approval.description ?? undefined,
      requesterId: approval.requesterId,
      data: approval.data ?? {},
      status: approval.status,
      approverId: approval.approverId ?? undefined,
      decidedAt: approval.decidedAt?.toISOString(),
      createdAt: approval.createdAt.toISOString(),
      updatedAt: approval.updatedAt.toISOString(),
    };
  }
}

export const approvalService = new ApprovalService();
