import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// POST /api/notifications/register — register or refresh an FCM push token for the
// authenticated user. Upserts on token value; reassigns userId if the token was
// previously registered to a different user (e.g. shared tablet after re-login).
router.post('/register', requireAuth, async (req, res) => {
  const { token, platform } = req.body;
  if (!token || !platform) return res.status(400).json({ error: 'token and platform required' });

  await prisma.pushToken.upsert({
    where: { token },
    update: { userId: req.user!.id, platform, lastUsedAt: new Date() },
    create: { userId: req.user!.id, token, platform },
  });

  res.json({ ok: true });
});

export default router;
