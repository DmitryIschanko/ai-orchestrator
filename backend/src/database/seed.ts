import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Create default company
  const company = await prisma.company.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Company',
      slug: 'default',
      mission: 'Building AI-powered workflows',
    },
  });
  
  console.log(`Company created: ${company.name}`);
  
  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      role: 'admin',
      companyId: company.id,
    },
  });
  
  console.log(`Admin user created: ${admin.email}`);
  
  // Create sample org structure
  const ceo = await prisma.orgNode.upsert({
    where: { 
      id: 'ceo-node',
    },
    update: {},
    create: {
      id: 'ceo-node',
      companyId: company.id,
      title: 'CEO',
      department: 'Executive',
      level: 0,
      positionX: 400,
      positionY: 50,
    },
  });
  
  await prisma.orgNode.upsert({
    where: { 
      id: 'cto-node',
    },
    update: {},
    create: {
      id: 'cto-node',
      companyId: company.id,
      title: 'CTO',
      department: 'Engineering',
      reportsToId: ceo.id,
      level: 1,
      positionX: 200,
      positionY: 200,
    },
  });
  
  await prisma.orgNode.upsert({
    where: { 
      id: 'cfo-node',
    },
    update: {},
    create: {
      id: 'cfo-node',
      companyId: company.id,
      title: 'CFO',
      department: 'Finance',
      reportsToId: ceo.id,
      level: 1,
      positionX: 600,
      positionY: 200,
    },
  });
  
  console.log('Org structure created');
  
  // Create sample goals
  const mission = await prisma.goal.upsert({
    where: { 
      id: 'mission-1',
    },
    update: {},
    create: {
      id: 'mission-1',
      companyId: company.id,
      type: 'mission',
      title: 'Build the best AI automation platform',
      status: 'active',
    },
  });
  
  await prisma.goal.upsert({
    where: { 
      id: 'objective-1',
    },
    update: {},
    create: {
      id: 'objective-1',
      companyId: company.id,
      parentId: mission.id,
      type: 'objective',
      title: 'Launch v1.0 by Q2',
      status: 'active',
      progress: 75,
    },
  });
  
  console.log('Goals created');
  
  // Create sample skills
  const skills = [
    { name: 'code-review', source: 'clawhub', content: 'Review code for quality and best practices' },
    { name: 'testing', source: 'clawhub', content: 'Write and run tests' },
    { name: 'documentation', source: 'clawhub', content: 'Write technical documentation' },
  ];
  
  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { 
        id: `skill-${skill.name}`,
      },
      update: {},
      create: {
        id: `skill-${skill.name}`,
        companyId: company.id,
        ...skill,
      },
    });
  }
  
  console.log('Skills created');
  
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
