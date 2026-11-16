import { nextId } from '../domain/ids';
import { ok, type Result } from '../domain/result';
import { planStatusChange } from '../domain/statusRules';
import type {
  AppState,
  AppWarning,
  BorrowRequest,
  NewRequestInput,
  RequestStatus,
} from '../domain/types';
import { validateNewRequest } from '../domain/validation';
import type { AppStore } from './store';

export interface SubmitSuccess {
  request: BorrowRequest;
  warnings: AppWarning[];
}

export const submitRequest = (
  store: AppStore,
  input: NewRequestInput,
  nowIso: string = new Date().toISOString(),
): Result<SubmitSuccess> => {
  const current = store.getState();
  const validated = validateNewRequest(input, current);
  if (!validated.ok) return validated;

  const { id, nextSeq } = nextId(current.nextRequestSeq);
  const request: BorrowRequest = {
    id,
    borrower: validated.value.borrower,
    deviceId: validated.value.deviceId,
    startDate: validated.value.startDate,
    endDate: validated.value.endDate,
    status: 'pending',
    createdAt: nowIso,
  };

  const nextState: AppState = {
    ...current,
    requests: [...current.requests, request],
    nextRequestSeq: nextSeq,
  };
  store.setState(nextState);

  return ok({ request, warnings: validated.value.warnings });
};

export const changeRequestStatus = (
  store: AppStore,
  requestId: string,
  target: RequestStatus,
  nowIso: string = new Date().toISOString(),
): Result<AppState> => {
  const current = store.getState();
  const planned = planStatusChange(current, requestId, target, nowIso);
  if (!planned.ok) return planned;

  store.setState(planned.value);
  return ok(planned.value);
};
