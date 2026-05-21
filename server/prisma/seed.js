import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const parent = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: {},
    create: {
      name: 'Parent',
      email: 'parent@example.com',
      passwordHash,
      role: 'PARENT',
    },
  });

  const alex = await prisma.user.upsert({
    where: { id: 'seed-child-alex' },
    update: {},
    create: {
      id: 'seed-child-alex',
      name: 'Alex',
      pin: '1234',
      role: 'CHILD',
      parentId: parent.id,
    },
  });

  const sam = await prisma.user.upsert({
    where: { id: 'seed-child-sam' },
    update: {},
    create: {
      id: 'seed-child-sam',
      name: 'Sam',
      pin: '5678',
      role: 'CHILD',
      parentId: parent.id,
    },
  });

  const existingTasks = await prisma.task.count();
  if (existingTasks === 0) {
    await prisma.task.createMany({
      data: [
        {
          title: 'Take out the trash',
          description: 'Every Monday evening before 7pm',
          dollarAmount: 2.0,
          assignedToId: alex.id,
          createdById: parent.id,
          isRecurring: true,
          recurrence: 'WEEKLY',
        },
        {
          title: 'Clean your room',
          dollarAmount: 3.0,
          assignedToId: alex.id,
          createdById: parent.id,
        },
        {
          title: 'Wash the dishes',
          dollarAmount: 1.5,
          assignedToId: sam.id,
          createdById: parent.id,
          isRecurring: true,
          recurrence: 'DAILY',
        },
        {
          title: 'Feed the dog',
          assignedToId: sam.id,
          createdById: parent.id,
          isRecurring: true,
          recurrence: 'DAILY',
        },
      ],
    });
  }

  console.log('Seed complete.');
  console.log('  Parent login: parent@example.com / password123');
  console.log('  Child Alex PIN: 1234');
  console.log('  Child Sam PIN: 5678');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
