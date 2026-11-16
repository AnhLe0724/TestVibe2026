import { REQUEST_STATUSES } from '../../../domain/constants';
import { REQUEST_STATUS_LABELS } from '../../../domain/labels.vi';
import type { RequestStatus } from '../../../domain/types';

interface StatusSelectProps {
  requestId: string;
  value: RequestStatus;
  onChange: (target: RequestStatus) => void;
}

export function StatusSelect({ requestId, value, onChange }: StatusSelectProps) {
  return (
    <select
      className="input-control status-select"
      data-testid={`status-select-${requestId}`}
      aria-label={`Đổi trạng thái cho ${requestId}`}
      value={value}
      onChange={(e) => onChange(e.target.value as RequestStatus)}
    >
      {REQUEST_STATUSES.map((s) => (
        <option key={s} value={s}>
          {REQUEST_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
