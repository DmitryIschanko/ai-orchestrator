import { PrismaClient } from "@prisma/client";
import type { Goal } from "../types/index.js";

const prisma = new PrismaClient();

export interface CreateGoalInput {
  type: string;
  title: string;
  description?: string;
  parentId?: string;
  assignedToId?: string;
  dueDate?: Date;
}

export interface UpdateGoalInput {
  type?: string;
  title?: string;
  description?: string;
  status?: string;
  progress?: number;
  parentId?: string;
  assignedToId?: string;
  dueDate?: Date;
}

export class GoalService {
  async list(companyId: string): Promise<Goal[]> {
    const goals = await prisma.goal.findMany({
      where: { companyId },
      include: {
        parent: true,
        children: true,
        assignedTo: true,
      },
      orderBy: { createdAt: "desc" },
    });
    
    return goals.map((g: any) => this.mapGoal(g));
  }

  async getById(id: string, companyId: string): Promise<Goal | null> {
    const goal = await prisma.goal.findFirst({
      where: { id, companyId },
      include: {
        parent: true,
        children: true,
        assignedTo: true,
      },
    });
    
    return goal ? this.mapGoal(goal) : null;
  }

  async create(companyId: string, data: CreateGoalInput): Promise<Goal> {
    const goal = await prisma.goal.create({
      data: {
        ...data,
        companyId,
      },
      include: {
        parent: true,
        children: true,
        assignedTo: true,
      },
    });
    
    return this.mapGoal(goal);
  }

  async update(id: string, companyId: string, data: UpdateGoalInput): Promise<Goal | null> {
    const goal = await prisma.goal.updateMany({
      where: { id, companyId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
    
    if (goal.count === 0) return null;
    
    const updated = await prisma.goal.findFirst({
      where: { id },
      include: {
        parent: true,
        children: true,
        assignedTo: true,
      },
    });
    
    return updated ? this.mapGoal(updated) : null;
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    const result = await prisma.goal.deleteMany({
      where: { id, companyId },
    });
    return result.count > 0;
  }

  async getHierarchy(companyId: string, rootId?: string): Promise<Goal[]> {
    const where = rootId 
      ? { id: rootId, companyId }
      : { companyId, parentId: null };
      
    const goals = await prisma.goal.findMany({
      where,
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,
              },
            },
          },
        },
        assignedTo: true,
      },
      orderBy: { createdAt: "asc" },
    });
    
    return goals.map((g: any) => this.mapGoal(g));
  }

  async updateProgress(id: string, companyId: string, progress: number): Promise<Goal | null> {
    const status = progress >= 100 ? "completed" : progress > 0 ? "active" : "active";
    
    return this.update(id, companyId, { 
      progress: Math.min(100, Math.max(0, progress)),
      status
    });
  }

  private mapGoal(goal: any): Goal {
    return {
      id: goal.id,
      type: goal.type,
      title: goal.title,
      description: goal.description ?? undefined,
      status: goal.status,
      progress: goal.progress,
      parentId: goal.parentId ?? undefined,
      assignedToId: goal.assignedToId ?? undefined,
      dueDate: goal.dueDate?.toISOString(),
      children: goal.children?.map((c: any) => this.mapGoal(c)),
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
    };
  }
}

export const goalService = new GoalService();
