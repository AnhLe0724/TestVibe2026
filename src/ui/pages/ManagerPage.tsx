import { useState } from 'react';
import { MESSAGES, REQUEST_STATUS_LABELS } from '../../domain/labels.vi';
import { searchRequests } from '../../domain/search';
import type { AppError, RequestStatus } from '../../domain/types';
import { changeRequestStatus } from '../../services/requestService';
import type { AppStore } from '../../services/store';
import { RequestSearch } from '../features/manager/RequestSearch';
import { RequestTable } from '../features/manager/RequestTable';
import { StatsBar } from '../features/manager/StatsBar';
import { useAppState } from '../hooks/useStore';

export function ManagerPage({
  store,
  onToast,
}: {
  store: AppStore;
  onToast: (msg: string) => void;
}) {
  const state = useAppState(store);
  const [query, setQuery] = useState('');
  const [actionError, setActionError] = useState<AppError | null>(null);

  const filtered = searchRequests(state.requests, query);

  const handleStatusChange = (requestId: string, target: RequestStatus): void => {
    const res = changeRequestStatus(store, requestId, target);
    if (!res.ok) {
      setActionError(res.errors[0] ?? null);
      return;
    }
    setActionError(null);
    onToast(`Đã đổi ${requestId} sang ${REQUEST_STATUS_LABELS[target]}.`);
  };

  return (
    <section aria-labelledby="manager-heading" className="section-block">
      <h2 id="manager-heading" className="section-heading">
        Quản lý yêu cầu mượn thiết bị
      </h2>

      <StatsBar devices={state.devices} />

      <RequestSearch
        query={query}
        onChange={setQuery}
        onClear={() => setQuery('')}
      />

      {actionError ? (
        <div className="alert-error" role="alert" data-testid="alert-conflict">
          <span>{MESSAGES[actionError.code](actionError.params)}</span>
          <button type="button" className="btn" onClick={() => setActionError(null)}>
            Đóng
          </button>
        </div>
      ) : null}

      <RequestTable
        requests={filtered}
        devices={state.devices}
        totalCount={state.requests.length}
        query={query}
        onClearSearch={() => setQuery('')}
        onStatusChange={handleStatusChange}
      />
    </section>
  );
}
