import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import type { Messaging } from 'firebase-admin/messaging';
import { prisma } from './prisma.js';

type PushPayload = { title: string; body: string; data?: Record<string, string> };

// FCM error codes that mean the token is permanently dead (app uninstalled, token rotated).
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

let _messaging: Messaging | null = null;
let _initDone = false;

function getApp(): Messaging | null {
  if (_initDone) return _messaging;
  _initDone = true;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    console.log('[push] FIREBASE_SERVICE_ACCOUNT not set — push notifications disabled');
    return null;
  }

  try {
    const serviceAccount = JSON.parse(raw);
    const app = initializeApp({ credential: cert(serviceAccount) });
    _messaging = getMessaging(app);
    console.log('[push] Firebase initialized');
    return _messaging;
  } catch (err) {
    console.error('[push] Failed to initialize Firebase:', err);
    return null;
  }
}

async function dispatch(userId: string, payload: PushPayload): Promise<void> {
  const messaging = getApp();
  if (!messaging) return;

  const tokens = await prisma.pushToken.findMany({
    where: { userId },
    select: { id: true, token: true },
  });
  if (tokens.length === 0) return;

  const results = await messaging.sendEach(
    tokens.map((t) => ({
      token: t.token,
      notification: { title: payload.title, body: payload.body },
      ...(payload.data && { data: payload.data }),
    }))
  );

  // Prune tokens FCM reports as permanently invalid; leave valid siblings alone.
  const deadIds = tokens
    .filter((_, i) => {
      const r = results.responses[i];
      return !r.success && r.error && DEAD_TOKEN_CODES.has(r.error.code);
    })
    .map((t) => t.id);

  if (deadIds.length > 0) {
    await prisma.pushToken.deleteMany({ where: { id: { in: deadIds } } });
  }
}

// Fire-and-forget: errors are logged, never surfaced to callers.
// Skips silently when userId is absent (open-pool chores with no assignee).
export function notifyUser(userId: string | null | undefined, payload: PushPayload): void {
  if (!userId) return;
  dispatch(userId, payload).catch((err) => console.error('[push] dispatch error:', err));
}
