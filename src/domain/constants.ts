import type { DeviceStatus, RequestStatus } from './types';

export const DEVICE_STATUSES: readonly DeviceStatus[] = [
  'available',
  'borrowed',
  'maintenance',
];

export const REQUEST_STATUSES: readonly RequestStatus[] = [
  'pending',
  'approved',
  'borrowing',
  'returned',
  'rejected',
];

// D2: Chỉ Đã duyệt và Đang mượn mới chiếm thiết bị
export const BLOCKING_STATUSES: readonly RequestStatus[] = ['approved', 'borrowing'];

// D4: Mặc định cho đổi tự do giữa 5 trạng thái; siết thứ tự bằng cách thu hẹp bảng này
export const ALLOWED_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
  pending: ['pending', 'approved', 'borrowing', 'returned', 'rejected'],
  approved: ['pending', 'approved', 'borrowing', 'returned', 'rejected'],
  borrowing: ['pending', 'approved', 'borrowing', 'returned', 'rejected'],
  returned: ['pending', 'approved', 'borrowing', 'returned', 'rejected'],
  rejected: ['pending', 'approved', 'borrowing', 'returned', 'rejected'],
};

export const NAME_MIN = 2;
export const NAME_MAX = 60;
export const STORAGE_KEY = 'clb-muon-thiet-bi:v1';
export const REQUEST_ID_PREFIX = 'YC-';
