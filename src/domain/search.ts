import type { BorrowRequest } from './types';

export const normalize = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd') // đ/Đ không tách được bằng NFD
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

export const compact = (s: string): string => normalize(s).replace(/[^a-z0-9]/g, '');

export const matchesQuery = (r: BorrowRequest, q: string): boolean => {
  const nq = normalize(q);
  const cq = compact(q);
  if (!nq) return true;
  return (
    normalize(r.borrower).includes(nq) ||
    normalize(r.deviceId).includes(nq) ||
    (cq !== '' && compact(r.deviceId).includes(cq))
  );
};

export const searchRequests = (requests: readonly BorrowRequest[], query: string): BorrowRequest[] =>
  requests.filter((r) => matchesQuery(r, query));
