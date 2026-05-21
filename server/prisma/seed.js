import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateHouseholdCode } from '../src/lib/codes.js';

const prisma = new PrismaClient();

const HOUSEHOLD_CODE = 'HOUSE1';

// Idempotent backfill: give every parent without a household code a unique one.
async function backfillHouseholdCodes() {
  const parents = await prisma.user.findMany({ where: { role: 'PARENT', householdCode: null } });
  for (const parent of parents) {
    let code;
    for (let i = 0; i < 8; i++) {
      code = generateHouseholdCode();
      if (!(await prisma.user.findUnique({ where: { householdCode: code } }))) break;
    }
    await prisma.user.update({ where: { id: parent.id }, data: { householdCode: code } });
    console.log(`  Backfilled household code ${code} for ${parent.email ?? parent.name}`);
  }
}

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const parent = await prisma.user.upsert({
    where: { email: 'parent@example.com' },
    update: { householdCode: HOUSEHOLD_CODE },
    create: {
      name: 'Parent',
      email: 'parent@example.com',
      passwordHash,
      householdCode: HOUSEHOLD_CODE,
      role: 'PARENT',
    },
  });

  const alexPin = await bcrypt.hash('1234', 10);
  const alex = await prisma.user.upsert({
    where: { id: 'seed-child-alex' },
    update: { pinHash: alexPin, pinFailedAttempts: 0, pinLockedUntil: null },
    create: {
      id: 'seed-child-alex',
      name: 'Alex',
      pinHash: alexPin,
      role: 'CHILD',
      parentId: parent.id,
    },
  });

  const samPin = await bcrypt.hash('5678', 10);
  const sam = await prisma.user.upsert({
    where: { id: 'seed-child-sam' },
    update: { pinHash: samPin, pinFailedAttempts: 0, pinLockedUntil: null },
    create: {
      id: 'seed-child-sam',
      name: 'Sam',
      pinHash: samPin,
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

  await backfillHouseholdCodes();

  console.log('Seed complete.');
  console.log('  Parent login: parent@example.com / password123');
  console.log(`  Household code (for kid login): ${HOUSEHOLD_CODE}`);
  console.log('  Child Alex PIN: 1234');
  console.log('  Child Sam PIN: 5678');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
