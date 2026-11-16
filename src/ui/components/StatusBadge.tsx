import { DEVICE_STATUS_LABELS, REQUEST_STATUS_LABELS } from '../../domain/labels.vi';
import type { DeviceStatus, RequestStatus } from '../../domain/types';

const DEVICE_TONE: Record<DeviceStatus, string> = {
  available: 'badge-success',
  borrowed: 'badge-warning',
  maintenance: 'badge-danger',
};

const REQUEST_TONE: Record<RequestStatus, string> = {
  pending: 'badge-warning',
  approved: 'badge-info',
  borrowing: 'badge-info',
  returned: 'badge-success',
  rejected: 'badge-neutral',
};

export function DeviceStatusBadge({ status }: { status: DeviceStatus }) {
  return <span className={`badge ${DEVICE_TONE[status]}`}>{DEVICE_STATUS_LABELS[status]}</span>;
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`badge ${REQUEST_TONE[status]}`}>{REQUEST_STATUS_LABELS[status]}</span>;
}
