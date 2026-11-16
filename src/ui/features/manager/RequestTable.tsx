import { formatDateTimeVi, formatDisplayDate } from '../../../domain/date';
import type { BorrowRequest, Device, RequestStatus } from '../../../domain/types';
import { EmptyState } from '../../components/EmptyState';
import { RequestStatusBadge } from '../../components/StatusBadge';
import { StatusSelect } from './StatusSelect';

interface RequestTableProps {
  requests: readonly BorrowRequest[];
  devices: readonly Device[];
  totalCount: number;
  query: string;
  onClearSearch: () => void;
  onStatusChange: (requestId: string, target: RequestStatus) => void;
}

export function RequestTable({
  requests,
  devices,
  totalCount,
  query,
  onClearSearch,
  onStatusChange,
}: RequestTableProps) {
  if (totalCount === 0) {
    return <EmptyState message="Chưa có yêu cầu nào." />;
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        message={`Không có yêu cầu khớp “${query.trim()}”.`}
        actionLabel="Xóa tìm kiếm"
        onAction={onClearSearch}
      />
    );
  }

  const deviceNameById = new Map(devices.map((d) => [d.id, d.name]));

  return (
    <div className="table-wrap">
      <table className="request-table">
        <thead>
          <tr>
            <th>Mã YC</th>
            <th>Người mượn</th>
            <th>Thiết bị</th>
            <th>Ngày mượn</th>
            <th>Ngày trả</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => {
            const devName = deviceNameById.get(req.deviceId) ?? '';
            return (
              <tr key={req.id} data-testid={`request-row-${req.id}`}>
                <td data-label="Mã YC">{req.id}</td>
                <td data-label="Người mượn">{req.borrower}</td>
                <td data-label="Thiết bị">
                  {req.deviceId}
                  {devName ? ` — ${devName}` : ''}
                </td>
                <td data-label="Ngày mượn">{formatDisplayDate(req.startDate)}</td>
                <td data-label="Ngày trả">{formatDisplayDate(req.endDate)}</td>
                <td data-label="Trạng thái">
                  <div className="status-cell">
                    <RequestStatusBadge status={req.status} />
                    <StatusSelect
                      requestId={req.id}
                      value={req.status}
                      onChange={(target) => onStatusChange(req.id, target)}
                    />
                  </div>
                  {req.status === 'returned' && req.returnedAt ? (
                    <div className="returned-at">
                      Trả lúc: {formatDateTimeVi(req.returnedAt)}
                    </div>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
