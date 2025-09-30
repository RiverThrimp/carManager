import type { Request, Response, NextFunction } from 'express';

type ErrorLike = {
  status?: unknown;
  message?: unknown;
};

const isErrorLike = (value: unknown): value is ErrorLike => typeof value === 'object' && value !== null;

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  void _next;

  const status = isErrorLike(err) && typeof err.status === 'number' ? err.status : 500;
  const message = isErrorLike(err) && typeof err.message === 'string' ? err.message : 'Unexpected error';

  res.status(Number.isFinite(status) ? status : 500).json({ message });
};
