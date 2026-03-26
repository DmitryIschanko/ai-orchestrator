import { PrismaClient } from "@prisma/client";
import type { OrgNode } from "../types/index.js";

const prisma = new PrismaClient();

export interface CreateOrgNodeInput {
  title: string;
  department?: string;
  agentId?: string;
  reportsToId?: string;
  level?: number;
  positionX?: number;
  positionY?: number;
  metadata?: any;
}

export interface UpdateOrgNodeInput {
  title?: string;
  department?: string;
  agentId?: string;
  reportsToId?: string;
  level?: number;
  positionX?: number;
  positionY?: number;
  metadata?: any;
}

export class OrgService {
  async list(companyId: string): Promise<OrgNode[]> {
    const nodes = await prisma.orgNode.findMany({
      where: { companyId },
      include: {
        reportsTo: true,
        children: true,
      },
      orderBy: { level: "asc" },
    });
    
    return nodes.map((n: any) => this.mapNode(n));
  }

  async getById(id: string, companyId: string): Promise<OrgNode | null> {
    const node = await prisma.orgNode.findFirst({
      where: { id, companyId },
      include: {
        reportsTo: true,
        children: {
          include: {
            children: {
              include: {
                children: true,
              },
            },
          },
        },
      },
    });
    
    return node ? this.mapNode(node) : null;
  }

  async create(companyId: string, data: CreateOrgNodeInput): Promise<OrgNode> {
    let level = data.level ?? 0;
    if (data.reportsToId) {
      const parent = await prisma.orgNode.findFirst({
        where: { id: data.reportsToId, companyId },
      });
      if (parent) {
        level = parent.level + 1;
      }
    }
    
    const node = await prisma.orgNode.create({
      data: {
        ...data,
        level,
        companyId,
      },
      include: {
        reportsTo: true,
        children: true,
      },
    });
    
    return this.mapNode(node);
  }

  async update(id: string, companyId: string, data: UpdateOrgNodeInput): Promise<OrgNode | null> {
    const updateData: any = { updatedAt: new Date() };
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.agentId !== undefined) updateData.agentId = data.agentId;
    if (data.positionX !== undefined) updateData.positionX = data.positionX;
    if (data.positionY !== undefined) updateData.positionY = data.positionY;
    if (data.metadata !== undefined) updateData.metadata = data.metadata;
    
    if (data.reportsToId !== undefined) {
      updateData.reportsToId = data.reportsToId;
      
      if (data.reportsToId) {
        const parent = await prisma.orgNode.findFirst({
          where: { id: data.reportsToId, companyId },
        });
        if (parent) {
          updateData.level = parent.level + 1;
        }
      } else {
        updateData.level = 0;
      }
    }
    
    if (data.level !== undefined && data.reportsToId === undefined) {
      updateData.level = data.level;
    }
    
    const node = await prisma.orgNode.updateMany({
      where: { id, companyId },
      data: updateData,
    });
    
    if (node.count === 0) return null;
    
    const updated = await prisma.orgNode.findFirst({
      where: { id },
      include: {
        reportsTo: true,
        children: true,
      },
    });
    
    return updated ? this.mapNode(updated) : null;
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    const node = await prisma.orgNode.findFirst({
      where: { id, companyId },
    });
    
    if (!node) return false;
    
    await prisma.orgNode.updateMany({
      where: { reportsToId: id },
      data: { 
        reportsToId: node.reportsToId,
        level: node.reportsToId ? { decrement: 1 } : 0,
      },
    });
    
    const result = await prisma.orgNode.deleteMany({
      where: { id, companyId },
    });
    
    return result.count > 0;
  }

  async getHierarchy(companyId: string): Promise<OrgNode[]> {
    const rootNodes = await prisma.orgNode.findMany({
      where: { companyId, reportsToId: null },
      include: {
        children: {
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
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });
    
    return rootNodes.map((n: any) => this.mapNode(n));
  }

  async updatePositions(companyId: string, positions: { id: string; x: number; y: number }[]): Promise<void> {
    for (const pos of positions) {
      await prisma.orgNode.updateMany({
        where: { id: pos.id, companyId },
        data: { 
          positionX: pos.x, 
          positionY: pos.y,
          updatedAt: new Date(),
        },
      });
    }
  }

  async getByAgentId(agentId: string, companyId: string): Promise<OrgNode | null> {
    const node = await prisma.orgNode.findFirst({
      where: { agentId, companyId },
      include: {
        reportsTo: true,
        children: true,
      },
    });
    
    return node ? this.mapNode(node) : null;
  }

  async assignAgent(nodeId: string, companyId: string, agentId: string | null): Promise<OrgNode | null> {
    if (agentId) {
      await prisma.orgNode.updateMany({
        where: { agentId, companyId },
        data: { agentId: null },
      });
    }
    
    const node = await prisma.orgNode.updateMany({
      where: { id: nodeId, companyId },
      data: { 
        agentId,
        updatedAt: new Date(),
      },
    });
    
    if (node.count === 0) return null;
    
    const updated = await prisma.orgNode.findFirst({
      where: { id: nodeId },
      include: {
        reportsTo: true,
        children: true,
      },
    });
    
    return updated ? this.mapNode(updated) : null;
  }

  private mapNode(node: any): OrgNode {
    return {
      id: node.id,
      title: node.title,
      department: node.department ?? undefined,
      agentId: node.agentId ?? undefined,
      reportsToId: node.reportsToId ?? undefined,
      level: node.level,
      positionX: node.positionX ?? undefined,
      positionY: node.positionY ?? undefined,
      metadata: node.metadata ?? {},
      children: node.children?.map((c: any) => this.mapNode(c)) ?? [],
      createdAt: node.createdAt.toISOString(),
      updatedAt: node.updatedAt.toISOString(),
    };
  }
}

export const orgService = new OrgService();
