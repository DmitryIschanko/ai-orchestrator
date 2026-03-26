import { PrismaClient } from '@prisma/client';
import type { Skill } from '../types/index.js';

const prisma = new PrismaClient();

export interface CreateSkillInput {
  name: string;
  source?: string;
  sourceUrl?: string;
  content?: string;
}

export interface UpdateSkillInput {
  name?: string;
  source?: string;
  sourceUrl?: string;
  content?: string;
  enabled?: boolean;
}

export class SkillService {
  async list(companyId: string, filters?: { enabled?: boolean }): Promise<Skill[]> {
    const where: any = { companyId };
    
    if (filters?.enabled !== undefined) {
      where.enabled = filters.enabled;
    }
    
    const skills = await prisma.skill.findMany({
      where,
      orderBy: { name: 'asc' },
    });
    
    return skills.map(this.mapSkill);
  }

  async getById(id: string, companyId: string): Promise<Skill | null> {
    const skill = await prisma.skill.findFirst({
      where: { id, companyId },
    });
    
    return skill ? this.mapSkill(skill) : null;
  }

  async getByName(name: string, companyId: string): Promise<Skill | null> {
    const skill = await prisma.skill.findFirst({
      where: { name, companyId },
    });
    
    return skill ? this.mapSkill(skill) : null;
  }

  async create(companyId: string, data: CreateSkillInput): Promise<Skill> {
    const skill = await prisma.skill.create({
      data: {
        ...data,
        companyId,
      },
    });
    
    return this.mapSkill(skill);
  }

  async update(id: string, companyId: string, data: UpdateSkillInput): Promise<Skill | null> {
    const updateData: any = { updatedAt: new Date() };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.sourceUrl !== undefined) updateData.sourceUrl = data.sourceUrl;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.enabled !== undefined) updateData.enabled = data.enabled;
    
    const skill = await prisma.skill.updateMany({
      where: { id, companyId },
      data: updateData,
    });
    
    if (skill.count === 0) return null;
    
    const updated = await prisma.skill.findFirst({
      where: { id },
    });
    
    return updated ? this.mapSkill(updated) : null;
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    const result = await prisma.skill.deleteMany({
      where: { id, companyId },
    });
    return result.count > 0;
  }

  async toggleEnabled(id: string, companyId: string): Promise<Skill | null> {
    const skill = await prisma.skill.findFirst({
      where: { id, companyId },
    });
    
    if (!skill) return null;
    
    return this.update(id, companyId, { enabled: !skill.enabled });
  }

  async importFromClawHub(companyId: string, hubUrl: string): Promise<{ imported: number; errors: string[] }> {
    const errors: string[] = [];
    let imported = 0;
    
    try {
      // Fetch skills from ClawHub
      const response = await fetch(`${hubUrl}/api/skills`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from ClawHub: ${response.statusText}`);
      }
      
      const hubSkills = await response.json() as any[];
      
      for (const hubSkill of hubSkills) {
        try {
          // Check if skill already exists
          const existing = await this.getByName(hubSkill.name, companyId);
          
          if (existing) {
            // Update existing
            await this.update(existing.id, companyId, {
              source: 'clawhub',
              sourceUrl: hubSkill.sourceUrl,
              content: hubSkill.content,
            });
          } else {
            // Create new
            await this.create(companyId, {
              name: hubSkill.name,
              source: 'clawhub',
              sourceUrl: hubSkill.sourceUrl,
              content: hubSkill.content,
            });
          }
          
          imported++;
        } catch (err) {
          errors.push(`Failed to import ${hubSkill.name}: ${err}`);
        }
      }
    } catch (err) {
      errors.push(`Failed to fetch from ClawHub: ${err}`);
    }
    
    return { imported, errors };
  }

  async getStats(companyId: string) {
    const [
      total,
      enabled,
    ] = await Promise.all([
      prisma.skill.count({ where: { companyId } }),
      prisma.skill.count({ where: { companyId, enabled: true } }),
    ]);
    
    return {
      total,
      enabled,
      disabled: total - enabled,
    };
  }

  private mapSkill(skill: any): Skill {
    return {
      id: skill.id,
      name: skill.name,
      source: skill.source ?? undefined,
      sourceUrl: skill.sourceUrl ?? undefined,
      content: skill.content ?? undefined,
      enabled: skill.enabled,
      createdAt: skill.createdAt.toISOString(),
      updatedAt: skill.updatedAt.toISOString(),
    };
  }
}

export const skillService = new SkillService();
