import 'express-async-errors';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import tasksRoutes from './routes/tasks.js';
import allowanceRoutes from './routes/allowance.js';
import goalsRoutes from './routes/goals.js';

// In development, load server/.env so the documented local setup works.
// In production, Railway provides env vars directly.
if (process.env.NODE_ENV !== 'production') {
  try {
    process.loadEnvFile(new URL('../.env', import.meta.url));
  } catch {
    // No .env file — fall back to whatever is already in the environment.
  }
}

// Fail fast on missing config rather than dying cryptically on the first
// token sign/verify or query.
const missingEnv = ['JWT_SECRET', 'DATABASE_URL'].filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error(`FATAL: missing required environment variable(s): ${missingEnv.join(', ')}`);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const isProd = process.env.NODE_ENV === 'production';

// Behind Railway's proxy, trust the first hop so req.ip (used by rate limiting)
// reflects the real client rather than the proxy.
if (isProd) app.set('trust proxy', 1);

// CSP is disabled here: the SPA relies on React inline style attributes, so a
// tuned policy needs to be verified in a browser before enabling.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/allowance', allowanceRoutes);
app.use('/api/goals', goalsRoutes);

// Serve built client in production
const __dirname = dirname(fileURLToPath(import.meta.url));
if (isProd) {
  const clientDist = join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(join(clientDist, 'index.html')));
}

// Terminal error handler — catches anything thrown in async handlers
// (forwarded by express-async-errors) so failures are logged, not silent.
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Server error' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
