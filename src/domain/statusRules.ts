import { ALLOWED_TRANSITIONS, BLOCKING_STATUSES } from './constants';
import { formatDisplayDate } from './date';
import { findConflict } from './overlap';
import { err, ok, type Result } from './result';
import type { AppState, BorrowRequest, Device, RequestStatus } from './types';

const syncDeviceStatus = (
  devices: readonly Device[],
  requests: readonly BorrowRequest[],
  deviceId: string,
  target: RequestStatus,
): Device[] =>
  devices.map((d) => {
    if (d.id !== deviceId || d.status === 'maintenance') return d;
    // D7: Chỉ đồng bộ khi chuyển sang borrowing hoặc returned
    if (target === 'borrowing') return { ...d, status: 'borrowed' };
    if (target === 'returned') {
      const stillBorrowing = requests.some((r) => r.deviceId === deviceId && r.status === 'borrowing');
      return { ...d, status: stillBorrowing ? 'borrowed' : 'available' };
    }
    return d;
  });

export const planStatusChange = (
  state: AppState,
  requestId: string,
  target: RequestStatus,
  nowIso: string = new Date().toISOString(),
): Result<AppState> => {
  const req = state.requests.find((r) => r.id === requestId);
  if (!req) return err({ code: 'REQUEST_NOT_FOUND' });

  if (!ALLOWED_TRANSITIONS[req.status].includes(target)) {
    return err({ code: 'TRANSITION_NOT_ALLOWED' });
  }

  if (BLOCKING_STATUSES.includes(target)) {
    const device = state.devices.find((d) => d.id === req.deviceId);
    if (device?.status === 'maintenance') {
      return err({ code: 'DEVICE_UNDER_MAINTENANCE', params: { deviceId: req.deviceId } });
    }
    const conflict = findConflict(state.requests, {
      id: req.id,
      deviceId: req.deviceId,
      startDate: req.startDate,
      endDate: req.endDate,
    });
    if (conflict) {
      return err({
        code: 'SCHEDULE_CONFLICT',
        params: {
          deviceId: conflict.deviceId,
          reqId: conflict.id,
          borrower: conflict.borrower,
          start: formatDisplayDate(conflict.startDate),
          end: formatDisplayDate(conflict.endDate),
        },
      });
    }
  }

  const nextRequests: BorrowRequest[] = state.requests.map((r) => {
    if (r.id !== requestId) return r;
    if (target === 'returned') {
      return { ...r, status: target, returnedAt: r.returnedAt ?? nowIso };
    }
    const { returnedAt: _removed, ...rest } = r;
    void _removed;
    return { ...rest, status: target };
  });

  const nextDevices = syncDeviceStatus(state.devices, nextRequests, req.deviceId, target);
  return ok({ ...state, devices: nextDevices, requests: nextRequests });
};
