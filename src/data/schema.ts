import { DEVICE_STATUSES, REQUEST_STATUSES } from '../domain/constants';
import { isValidISODate } from '../domain/date';
import type { AppState, BorrowRequest, Device } from '../domain/types';

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isString = (v: unknown): v is string => typeof v === 'string';

const isValidDevice = (v: unknown): v is Device =>
  isRecord(v) &&
  isString(v.id) &&
  v.id.length > 0 &&
  isString(v.name) &&
  isString(v.category) &&
  isString(v.status) &&
  (DEVICE_STATUSES as readonly string[]).includes(v.status) &&
  isString(v.note);

const isValidRequest = (v: unknown): v is BorrowRequest =>
  isRecord(v) &&
  isString(v.id) &&
  v.id.length > 0 &&
  isString(v.borrower) &&
  isString(v.deviceId) &&
  isString(v.startDate) &&
  isValidISODate(v.startDate) &&
  isString(v.endDate) &&
  isValidISODate(v.endDate) &&
  isString(v.status) &&
  (REQUEST_STATUSES as readonly string[]).includes(v.status) &&
  isString(v.createdAt) &&
  (v.returnedAt === undefined || isString(v.returnedAt));

export const isValidAppState = (v: unknown): v is AppState =>
  isRecord(v) &&
  v.schemaVersion === 1 &&
  typeof v.nextRequestSeq === 'number' &&
  Number.isInteger(v.nextRequestSeq) &&
  v.nextRequestSeq >= 1 &&
  Array.isArray(v.devices) &&
  v.devices.every(isValidDevice) &&
  Array.isArray(v.requests) &&
  v.requests.every(isValidRequest);
