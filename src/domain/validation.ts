import { NAME_MAX, NAME_MIN } from './constants';
import { formatDisplayDate, isValidISODate } from './date';
import { findConflict, findPendingOverlap } from './overlap';
import { err, ok, type Result } from './result';
import type { AppError, AppState, AppWarning, NewRequestInput, ValidatedNewRequest } from './types';

const normalizeBorrower = (raw: string): string => raw.trim().replace(/\s+/g, ' ');

const validateBorrower = (raw: string, errors: AppError[]): string => {
  const borrower = normalizeBorrower(raw);
  if (!borrower) {
    errors.push({ code: 'NAME_REQUIRED', field: 'borrower' });
  } else if (borrower.length < NAME_MIN) {
    errors.push({ code: 'NAME_TOO_SHORT', field: 'borrower', params: { min: String(NAME_MIN) } });
  } else if (borrower.length > NAME_MAX) {
    errors.push({ code: 'NAME_TOO_LONG', field: 'borrower', params: { max: String(NAME_MAX) } });
  }
  return borrower;
};

const validateDevice = (deviceId: string, state: AppState, errors: AppError[]): boolean => {
  if (!deviceId) {
    errors.push({ code: 'DEVICE_REQUIRED', field: 'deviceId' });
    return false;
  }
  const device = state.devices.find((d) => d.id === deviceId);
  if (!device) {
    errors.push({ code: 'DEVICE_NOT_FOUND', field: 'deviceId' });
    return false;
  }
  if (device.status === 'maintenance') {
    errors.push({ code: 'DEVICE_UNDER_MAINTENANCE', field: 'deviceId', params: { deviceId } });
    return false;
  }
  return true;
};

const validateDates = (startDate: string, endDate: string, errors: AppError[]): boolean => {
  let valid = true;
  if (!startDate) {
    errors.push({ code: 'START_REQUIRED', field: 'startDate' });
    valid = false;
  } else if (!isValidISODate(startDate)) {
    errors.push({ code: 'DATE_INVALID', field: 'startDate' });
    valid = false;
  }
  if (!endDate) {
    errors.push({ code: 'END_REQUIRED', field: 'endDate' });
    valid = false;
  } else if (!isValidISODate(endDate)) {
    errors.push({ code: 'DATE_INVALID', field: 'endDate' });
    valid = false;
  }
  if (valid && endDate < startDate) {
    errors.push({ code: 'END_BEFORE_START', field: 'endDate' });
    return false;
  }
  return valid;
};

export const validateNewRequest = (
  input: NewRequestInput,
  state: AppState,
): Result<ValidatedNewRequest> => {
  const errors: AppError[] = [];
  const warnings: AppWarning[] = [];

  const borrower = validateBorrower(input.borrower, errors);
  const deviceOk = validateDevice(input.deviceId, state, errors);
  const datesOk = validateDates(input.startDate, input.endDate, errors);

  if (deviceOk && datesOk) {
    const candidate = {
      deviceId: input.deviceId,
      startDate: input.startDate,
      endDate: input.endDate,
    };
    const conflict = findConflict(state.requests, candidate);
    if (conflict) {
      errors.push({
        code: 'SCHEDULE_CONFLICT',
        field: 'startDate',
        params: {
          deviceId: conflict.deviceId,
          reqId: conflict.id,
          borrower: conflict.borrower,
          start: formatDisplayDate(conflict.startDate),
          end: formatDisplayDate(conflict.endDate),
        },
      });
    } else {
      const pending = findPendingOverlap(state.requests, candidate);
      if (pending) {
        warnings.push({
          code: 'OVERLAPS_PENDING',
          params: { deviceId: pending.deviceId, reqId: pending.id },
        });
      }
    }
  }

  if (errors.length > 0) return err(...errors);

  return ok({
    borrower,
    deviceId: input.deviceId,
    startDate: input.startDate,
    endDate: input.endDate,
    warnings,
  });
};
