import { BLOCKING_STATUSES } from './constants';
import type { BorrowRequest, DateRange, ISODate } from './types';

export interface OverlapCandidate {
  id?: string;
  deviceId: string;
  startDate: ISODate;
  endDate: ISODate;
}

// D1: Khoảng ngày đóng hai đầu [start, end]
export const rangesOverlap = (a: DateRange, b: DateRange): boolean =>
  a.start <= b.end && b.start <= a.end;

export const findConflict = (
  requests: readonly BorrowRequest[],
  candidate: OverlapCandidate,
): BorrowRequest | undefined =>
  requests.find(
    (r) =>
      r.id !== candidate.id &&
      r.deviceId === candidate.deviceId &&
      BLOCKING_STATUSES.includes(r.status) &&
      rangesOverlap(
        { start: r.startDate, end: r.endDate },
        { start: candidate.startDate, end: candidate.endDate },
      ),
  );

export const findPendingOverlap = (
  requests: readonly BorrowRequest[],
  candidate: OverlapCandidate,
): BorrowRequest | undefined =>
  requests.find(
    (r) =>
      r.id !== candidate.id &&
      r.deviceId === candidate.deviceId &&
      r.status === 'pending' &&
      rangesOverlap(
        { start: r.startDate, end: r.endDate },
        { start: candidate.startDate, end: candidate.endDate },
      ),
  );
