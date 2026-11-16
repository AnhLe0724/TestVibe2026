import type { AppError } from './types';

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; errors: AppError[] };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const err = <T = never>(...errors: AppError[]): Result<T> => ({
  ok: false,
  errors,
});
