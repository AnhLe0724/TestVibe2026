import { describe, it, expect } from 'vitest';
import { formatRequestId, nextId } from './ids';

describe('ids', () => {
  it('UT-ID-01: sinh mã từ nextRequestSeq=104 -> YC-104 và tăng bộ đếm', () => {
    expect(formatRequestId(104)).toBe('YC-104');
    expect(nextId(104)).toEqual({ id: 'YC-104', nextSeq: 105 });
  });
});
