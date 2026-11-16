import type { DeviceStatus, ErrorCode, RequestStatus, WarningCode } from './types';

export const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  available: 'Sẵn sàng',
  borrowed: 'Đang mượn',
  maintenance: 'Bảo trì',
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  borrowing: 'Đang mượn',
  returned: 'Đã trả',
  rejected: 'Từ chối',
};

type MessageFormatter = (params?: Record<string, string>) => string;

export const MESSAGES: Record<ErrorCode, MessageFormatter> = {
  NAME_REQUIRED: () => 'Vui lòng nhập tên người mượn.',
  NAME_TOO_SHORT: (p) => `Tên người mượn phải có ít nhất ${p?.min ?? '2'} ký tự.`,
  NAME_TOO_LONG: (p) => `Tên người mượn không được vượt quá ${p?.max ?? '60'} ký tự.`,
  DEVICE_REQUIRED: () => 'Vui lòng chọn thiết bị cần mượn.',
  DEVICE_NOT_FOUND: () => 'Không tìm thấy thiết bị đã chọn. Vui lòng chọn lại.',
  DEVICE_UNDER_MAINTENANCE: (p) =>
    `Thiết bị ${p?.deviceId ?? ''} đang bảo trì nên chưa thể cho mượn.`,
  START_REQUIRED: () => 'Vui lòng chọn ngày mượn.',
  END_REQUIRED: () => 'Vui lòng chọn ngày trả dự kiến.',
  DATE_INVALID: () => 'Ngày không hợp lệ. Vui lòng chọn lại đúng ngày lịch.',
  END_BEFORE_START: () => 'Ngày trả không được trước ngày mượn.',
  SCHEDULE_CONFLICT: (p) =>
    `Thiết bị ${p?.deviceId ?? ''} đã có yêu cầu ${p?.reqId ?? ''} (${p?.borrower ?? ''}) từ ${p?.start ?? ''} đến ${p?.end ?? ''}, trùng với thời gian này. Vui lòng chọn ngày khác.`,
  REQUEST_NOT_FOUND: () => 'Không tìm thấy yêu cầu mượn thiết bị.',
  TRANSITION_NOT_ALLOWED: () => 'Không thể chuyển sang trạng thái đã chọn.',
  STORAGE_WRITE_FAILED: () =>
    'Không lưu được dữ liệu vào trình duyệt. Dữ liệu sẽ mất khi tải lại trang.',
  STORAGE_CORRUPT: () => 'Dữ liệu đã lưu bị lỗi nên ứng dụng đã nạp lại dữ liệu mẫu.',
};

export const WARNING_MESSAGES: Record<WarningCode, MessageFormatter> = {
  OVERLAPS_PENDING: (p) =>
    `Lưu ý: thiết bị ${p?.deviceId ?? ''} đang có yêu cầu chờ duyệt khác (${p?.reqId ?? ''}) trong khoảng thời gian này.`,
};
