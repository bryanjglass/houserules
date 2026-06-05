import type { Request, Response, NextFunction } from 'express';
import type { ZodType, ZodError } from 'zod';

// Render a Zod error as a single short, human-readable message matching the
// app's existing `{ error: string }` response shape. Uses the first issue and
// prefixes the offending field path when there is one (e.g. "dollarAmount: ...").
export function formatZodError(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Invalid request';
  const path = issue.path.join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}

// Validate (and coerce) a request body against a schema before the handler runs.
// On failure: 400 with { error }. On success: req.body is replaced with the
// parsed, typed, default-applied value so handlers can drop their own parsing.
export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: formatZodError(result.error) });
    }
    req.body = result.data;
    next();
  };
}
