export type ISODate = string; // "2026-11-22", luôn đã qua kiểm tra hợp lệ

export type DeviceStatus = 'available' | 'borrowed' | 'maintenance';
export type RequestStatus = 'pending' | 'approved' | 'borrowing' | 'returned' | 'rejected';

export interface Device {
  id: string;
  name: string;
  category: string;
  status: DeviceStatus;
  note: string;
}

export interface BorrowRequest {
  id: string;
  borrower: string;
  deviceId: string;
  startDate: ISODate;
  endDate: ISODate;
  status: RequestStatus;
  createdAt: string;
  returnedAt?: string;
}

export interface AppState {
  schemaVersion: 1;
  devices: Device[];
  requests: BorrowRequest[];
  nextRequestSeq: number;
}

export interface DateRange {
  start: ISODate;
  end: ISODate;
}

export interface NewRequestInput {
  borrower: string;
  deviceId: string;
  startDate: string;
  endDate: string;
}

export interface ValidatedNewRequest {
  borrower: string;
  deviceId: string;
  startDate: ISODate;
  endDate: ISODate;
  warnings: AppWarning[];
}

export type ErrorCode =
  | 'NAME_REQUIRED'
  | 'NAME_TOO_SHORT'
  | 'NAME_TOO_LONG'
  | 'DEVICE_REQUIRED'
  | 'DEVICE_NOT_FOUND'
  | 'DEVICE_UNDER_MAINTENANCE'
  | 'START_REQUIRED'
  | 'END_REQUIRED'
  | 'DATE_INVALID'
  | 'END_BEFORE_START'
  | 'SCHEDULE_CONFLICT'
  | 'REQUEST_NOT_FOUND'
  | 'TRANSITION_NOT_ALLOWED'
  | 'STORAGE_WRITE_FAILED'
  | 'STORAGE_CORRUPT';

export type WarningCode = 'OVERLAPS_PENDING';

export type FieldName = 'borrower' | 'deviceId' | 'startDate' | 'endDate';

export interface AppError {
  code: ErrorCode;
  field?: FieldName;
  params?: Record<string, string>;
}

export interface AppWarning {
  code: WarningCode;
  params?: Record<string, string>;
}
