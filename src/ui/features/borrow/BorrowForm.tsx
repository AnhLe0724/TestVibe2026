import { useRef, useState, type FormEvent } from 'react';
import { MESSAGES, WARNING_MESSAGES } from '../../../domain/labels.vi';
import type { AppError, Device, FieldName } from '../../../domain/types';
import { submitRequest } from '../../../services/requestService';
import type { AppStore } from '../../../services/store';

interface BorrowFormProps {
  store: AppStore;
  devices: readonly Device[];
  deviceId: string;
  onDeviceChange: (deviceId: string) => void;
  onToast: (msg: string) => void;
}

const FIELD_ORDER: readonly FieldName[] = ['deviceId', 'borrower', 'startDate', 'endDate'];

export function BorrowForm({
  store,
  devices,
  deviceId,
  onDeviceChange,
  onToast,
}: BorrowFormProps) {
  const [borrower, setBorrower] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState<AppError[]>([]);

  const deviceRef = useRef<HTMLSelectElement>(null);
  const borrowerRef = useRef<HTMLInputElement>(null);
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);

  const errorByField = (field: FieldName): AppError | undefined =>
    errors.find((e) => e.field === field);

  const conflictError = errors.find((e) => e.code === 'SCHEDULE_CONFLICT');

  const focusFirstError = (nextErrors: AppError[]): void => {
    const refMap: Record<FieldName, HTMLElement | null> = {
      deviceId: deviceRef.current,
      borrower: borrowerRef.current,
      startDate: startRef.current,
      endDate: endRef.current,
    };
    const first = FIELD_ORDER.find((f) => nextErrors.some((e) => e.field === f));
    if (first) refMap[first]?.focus();
  };

  const handleSubmit = (e: FormEvent): void => {
    e.preventDefault();
    const res = submitRequest(store, { borrower, deviceId, startDate, endDate });
    if (!res.ok) {
      setErrors(res.errors);
      focusFirstError(res.errors);
      return;
    }

    setErrors([]);
    onDeviceChange('');
    setBorrower('');
    setStartDate('');
    setEndDate('');

    const warnText = res.value.warnings
      .map((w) => WARNING_MESSAGES[w.code](w.params))
      .join(' ');
    const toastMsg = warnText
      ? `Đã gửi yêu cầu ${res.value.request.id}. ${warnText}`
      : `Đã gửi yêu cầu ${res.value.request.id}.`;
    onToast(toastMsg);
  };

  const devErr = errorByField('deviceId');
  const borErr = errorByField('borrower');
  const startErr = errorByField('startDate');
  const endErr = errorByField('endDate');

  return (
    <section aria-labelledby="borrow-form-heading" className="section-block form-card">
      <h2 id="borrow-form-heading" className="section-heading">
        Gửi yêu cầu mượn thiết bị
      </h2>

      {conflictError ? (
        <div className="alert-error" role="alert" data-testid="alert-conflict">
          {MESSAGES[conflictError.code](conflictError.params)}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="borrow-form">
        <div className="field-group">
          <label htmlFor="form-device">Thiết bị</label>
          <select
            ref={deviceRef}
            id="form-device"
            data-testid="form-device"
            className="input-control"
            value={deviceId}
            aria-invalid={Boolean(devErr)}
            aria-describedby={devErr ? 'err-deviceId' : undefined}
            onChange={(e) => onDeviceChange(e.target.value)}
          >
            <option value="">-- Chọn thiết bị --</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id} disabled={d.status === 'maintenance'}>
                {d.id} — {d.name}
                {d.status === 'maintenance' ? ' (Bảo trì)' : ''}
              </option>
            ))}
          </select>
          {devErr ? (
            <span id="err-deviceId" className="field-error" data-testid="field-error-deviceId">
              {MESSAGES[devErr.code](devErr.params)}
            </span>
          ) : null}
        </div>

        <div className="field-group">
          <label htmlFor="form-borrower">Tên người mượn</label>
          <input
            ref={borrowerRef}
            id="form-borrower"
            type="text"
            data-testid="form-borrower"
            className="input-control"
            placeholder="Ví dụ: An Nguyễn"
            value={borrower}
            aria-invalid={Boolean(borErr)}
            aria-describedby={borErr ? 'err-borrower' : undefined}
            onChange={(e) => setBorrower(e.target.value)}
          />
          {borErr ? (
            <span id="err-borrower" className="field-error" data-testid="field-error-borrower">
              {MESSAGES[borErr.code](borErr.params)}
            </span>
          ) : null}
        </div>

        <div className="form-dates-row">
          <div className="field-group">
            <label htmlFor="form-start">Ngày mượn</label>
            <input
              ref={startRef}
              id="form-start"
              type="date"
              data-testid="form-start"
              className="input-control"
              value={startDate}
              aria-invalid={Boolean(startErr)}
              aria-describedby={startErr ? 'err-startDate' : undefined}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {startErr && startErr.code !== 'SCHEDULE_CONFLICT' ? (
              <span id="err-startDate" className="field-error" data-testid="field-error-startDate">
                {MESSAGES[startErr.code](startErr.params)}
              </span>
            ) : null}
          </div>

          <div className="field-group">
            <label htmlFor="form-end">Ngày trả dự kiến</label>
            <input
              ref={endRef}
              id="form-end"
              type="date"
              data-testid="form-end"
              className="input-control"
              value={endDate}
              aria-invalid={Boolean(endErr)}
              aria-describedby={endErr ? 'err-endDate' : undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {endErr ? (
              <span id="err-endDate" className="field-error" data-testid="field-error-endDate">
                {MESSAGES[endErr.code](endErr.params)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" data-testid="form-submit">
            Gửi yêu cầu
          </button>
        </div>
      </form>
    </section>
  );
}
