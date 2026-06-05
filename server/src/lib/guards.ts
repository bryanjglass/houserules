import type { Response } from 'express';
import type { User } from '@prisma/client';
import { prisma } from './prisma.js';

// Resolve a child and confirm it belongs to the requesting parent. On failure it
// writes the response (404 if not a child, 403 if not this parent's) and returns
// null, so callers do `const child = await getChildOrFail(...); if (!child) return;`.
export async function getChildOrFail(
  childId: string,
  parentId: string,
  res: Response
): Promise<User | null> {
  const child = await prisma.user.findUnique({ where: { id: childId } });
  if (!child || child.role !== 'CHILD') {
    res.status(404).json({ error: 'Child not found' });
    return null;
  }
  if (child.parentId !== parentId) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }
  return child;
}
