import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateHouseholdCode } from '../src/lib/codes.js';
import { todayKey } from '../src/lib/tz.js';
import { firstOccurrenceKey } from '../src/lib/recurrence.js';

const prisma = new PrismaClient();

const HOUSEHOLD_CODE = 'HOUSE1';

// Idempotent backfill: give every parent without a household code a unique one.
async function backfillHouseholdCodes() {
  const parents = await prisma.user.findMany({ where: { role: 'PARENT', householdCode: null } });
  for (const parent of parents) {
    let code = '';
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

  const existingChores = await prisma.chore.count();
  if (existingChores === 0) {
    // Recurring chores are anchored to a concrete first scheduled occurrence (a
    // household-local day key) so projection generates occurrences from day one.
    const tz = parent.timezone || 'UTC';
    const today = todayKey(tz);
    await prisma.chore.createMany({
      data: [
        {
          householdId: parent.id,
          kind: 'ASSIGNED',
          title: 'Take out the trash',
          description: 'Every Monday evening before 7pm',
          rewardCents: 200,
          assigneeId: alex.id,
          recurrence: 'WEEKLY',
          startDay: firstOccurrenceKey(today, 'WEEKLY', null),
        },
        {
          householdId: parent.id,
          kind: 'ASSIGNED',
          title: 'Clean your room',
          rewardCents: 300,
          assigneeId: alex.id,
        },
        {
          householdId: parent.id,
          kind: 'ASSIGNED',
          title: 'Wash the dishes',
          rewardCents: 150,
          assigneeId: sam.id,
          recurrence: 'DAILY',
          startDay: firstOccurrenceKey(today, 'DAILY', null),
          // Missed days pile up so Sam can catch up after a busy week.
          missedPolicy: 'BACKFILL_14D',
        },
        {
          householdId: parent.id,
          kind: 'ASSIGNED',
          title: 'Feed the dog',
          assigneeId: sam.id,
          recurrence: 'DAILY',
          startDay: firstOccurrenceKey(today, 'DAILY', null),
        },
        {
          householdId: parent.id,
          kind: 'OPEN',
          title: 'Rake the leaves',
          description: 'First to grab it wins!',
          rewardCents: 500,
          startDay: today,
        },
        {
          householdId: parent.id,
          kind: 'PER_UNIT',
          title: 'Pull weeds',
          description: 'Paid per weed pulled — log how many you did.',
          unitRewardCents: 10,
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
