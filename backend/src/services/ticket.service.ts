import { PrismaClient } from '@prisma/client';
import type { Ticket, TicketEvent } from '../types/index.js';

const prisma = new PrismaClient();

export interface CreateTicketInput {
  title: string;
  description?: string;
  goalId?: string;
  priority?: string;
  ownerId?: string;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  goalId?: string;
  ownerId?: string;
}

export class TicketService {
  async list(companyId: string, filters?: { status?: string; goalId?: string; ownerId?: string }): Promise<Ticket[]> {
    const where: any = { companyId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.goalId) {
      where.goalId = filters.goalId;
    }
    if (filters?.ownerId) {
      where.ownerId = filters.ownerId;
    }
    
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        goal: true,
        owner: true,
        createdBy: {
          select: { id: true, email: true },
        },
        events: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    return tickets.map((t: any) => this.mapTicket(t));
  }

  async getById(id: string, companyId: string): Promise<Ticket | null> {
    const ticket = await prisma.ticket.findFirst({
      where: { id, companyId },
      include: {
        goal: true,
        owner: true,
        createdBy: {
          select: { id: true, email: true },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    return ticket ? this.mapTicket(ticket) : null;
  }

  async create(companyId: string, userId: string, data: CreateTicketInput): Promise<Ticket> {
    const ticket = await prisma.ticket.create({
      data: {
        ...data,
        companyId,
        createdById: userId,
      },
      include: {
        goal: true,
        owner: true,
        createdBy: {
          select: { id: true, email: true },
        },
        events: true,
      },
    });
    
    // Add creation event
    await prisma.ticketEvent.create({
      data: {
        ticketId: ticket.id,
        type: 'created',
        data: { by: userId },
      },
    });
    
    return this.mapTicket({
      ...ticket,
      events: [...ticket.events, {
        id: 'temp',
        ticketId: ticket.id,
        type: 'created',
        data: { by: userId },
        createdAt: new Date(),
      }],
    });
  }

  async update(id: string, companyId: string, data: UpdateTicketInput, userId?: string): Promise<Ticket | null> {
    const existing = await prisma.ticket.findFirst({
      where: { id, companyId },
    });
    
    if (!existing) return null;
    
    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        goal: true,
        owner: true,
        createdBy: {
          select: { id: true, email: true },
        },
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    
    // Add status change event if status changed
    if (data.status && data.status !== existing.status) {
      await prisma.ticketEvent.create({
        data: {
          ticketId: id,
          type: 'status_changed',
          data: { 
            from: existing.status, 
            to: data.status,
            by: userId,
          },
        },
      });
    }
    
    return this.mapTicket(ticket);
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    // Delete related events first
    await prisma.ticketEvent.deleteMany({
      where: { ticketId: id },
    });
    
    const result = await prisma.ticket.deleteMany({
      where: { id, companyId },
    });
    return result.count > 0;
  }

  async addEvent(ticketId: string, type: string, data: any, userId?: string): Promise<TicketEvent> {
    const event = await prisma.ticketEvent.create({
      data: {
        ticketId,
        type,
        data: { ...data, by: userId },
      },
    });
    
    // Update ticket updatedAt
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });
    
    return {
      id: event.id,
      type: event.type,
      data: event.data,
      createdById: event.createdById ?? undefined,
      createdAt: event.createdAt.toISOString(),
    };
  }

  async getStats(companyId: string) {
    const [
      total,
      open,
      inProgress,
      review,
      done,
    ] = await Promise.all([
      prisma.ticket.count({ where: { companyId } }),
      prisma.ticket.count({ where: { companyId, status: 'open' } }),
      prisma.ticket.count({ where: { companyId, status: 'in_progress' } }),
      prisma.ticket.count({ where: { companyId, status: 'review' } }),
      prisma.ticket.count({ where: { companyId, status: 'done' } }),
    ]);
    
    return {
      total,
      open,
      inProgress,
      review,
      done,
    };
  }

  private mapTicket = (ticket: any): Ticket => {
    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description ?? undefined,
      status: ticket.status,
      priority: ticket.priority,
      goalId: ticket.goalId ?? undefined,
      ownerId: ticket.ownerId ?? undefined,
      createdById: ticket.createdById,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      events: ticket.events?.map((e: any) => this.mapEvent(e)) ?? [],
    };
  }

  private mapEvent = (event: any): TicketEvent => {
    return {
      id: event.id,
      type: event.type,
      data: event.data,
      createdById: event.createdById ?? undefined,
      createdAt: event.createdAt.toISOString(),
    };
  }
}

export const ticketService = new TicketService();
