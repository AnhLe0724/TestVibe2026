import { describe, it, expect } from 'vitest';
import { DEVICE_STATUS_LABELS, MESSAGES, REQUEST_STATUS_LABELS, WARNING_MESSAGES } from './labels.vi';
import { DEVICE_STATUSES, REQUEST_STATUSES } from './constants';
import type { ErrorCode } from './types';

describe('labels.vi', () => {
  it('có đủ nhãn tiếng Việt cho mọi trạng thái thiết bị và yêu cầu', () => {
    for (const s of DEVICE_STATUSES) expect(DEVICE_STATUS_LABELS[s].length).toBeGreaterThan(0);
    for (const s of REQUEST_STATUSES) expect(REQUEST_STATUS_LABELS[s].length).toBeGreaterThan(0);
  });

  it('mọi mã lỗi và cảnh báo đều sinh thông báo tiếng Việt', () => {
    const codes = Object.keys(MESSAGES) as ErrorCode[];
    for (const code of codes) {
      const msg = MESSAGES[code]({
        deviceId: 'TB-01',
        reqId: 'YC-101',
        borrower: 'An',
        start: '21/11/2026',
        end: '22/11/2026',
        min: '2',
        max: '60',
      });
      expect(msg.length).toBeGreaterThan(0);
      expect(MESSAGES[code]().length).toBeGreaterThan(0);
    }
    expect(WARNING_MESSAGES.OVERLAPS_PENDING({ deviceId: 'TB-02', reqId: 'YC-101' }).length).toBeGreaterThan(0);
    expect(WARNING_MESSAGES.OVERLAPS_PENDING().length).toBeGreaterThan(0);
  });
});
