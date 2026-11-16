import type { AppState } from '../domain/types';

// Dữ liệu mẫu BTC nguyên văn (mục 10.1); trả bản sao mới mỗi lần gọi để tránh nhiễm tham chiếu
export const createSeed = (): AppState => ({
  schemaVersion: 1,
  devices: [
    { id: 'TB-01', name: 'Máy ảnh Lumix G7', category: 'Máy ảnh', status: 'available', note: 'Kèm pin và thẻ nhớ' },
    { id: 'TB-02', name: 'Chân máy mini', category: 'Phụ kiện', status: 'borrowed', note: 'Dự kiến trả ngày 22/11' },
    { id: 'TB-03', name: 'Micro USB', category: 'Âm thanh', status: 'available', note: 'Dùng ghi âm/phỏng vấn' },
    { id: 'TB-04', name: 'Đèn LED để bàn', category: 'Ánh sáng', status: 'maintenance', note: 'Không cho đăng ký mượn' },
    { id: 'TB-05', name: 'Tripod cao', category: 'Phụ kiện', status: 'available', note: 'Có túi đựng' },
  ],
  requests: [
    { id: 'YC-101', borrower: 'An Nguyễn', deviceId: 'TB-02', startDate: '2026-11-22', endDate: '2026-11-23', status: 'pending', createdAt: '2026-11-01T00:00:00.000Z' },
    { id: 'YC-102', borrower: 'Bình Trần', deviceId: 'TB-03', startDate: '2026-11-21', endDate: '2026-11-21', status: 'approved', createdAt: '2026-11-01T00:00:00.000Z' },
    { id: 'YC-103', borrower: 'Chi Lê', deviceId: 'TB-01', startDate: '2026-11-24', endDate: '2026-11-25', status: 'borrowing', createdAt: '2026-11-01T00:00:00.000Z' },
  ],
  nextRequestSeq: 104,
});
