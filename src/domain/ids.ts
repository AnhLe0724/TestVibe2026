import { REQUEST_ID_PREFIX } from './constants';

export const formatRequestId = (seq: number): string => `${REQUEST_ID_PREFIX}${seq}`;

export const nextId = (seq: number): { id: string; nextSeq: number } => ({
  id: formatRequestId(seq),
  nextSeq: seq + 1,
});
