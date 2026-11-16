# Ứng dụng Quản lý Mượn Thiết bị Câu lạc bộ

Ứng dụng web một trang (SPA) giao diện tiếng Việt, chạy hoàn toàn trên trình duyệt bằng React + TypeScript + Vite và lưu trữ qua `localStorage`.

## 1. Cách chạy dự án

```bash
# Cài đặt phụ thuộc
npm install

# Chạy môi trường phát triển
npm run dev

# Chạy cổng chất lượng (typecheck + lint + test + build)
npm run verify

# Chạy kiểm thử độ phủ
npm run test:cov

# Chạy kiểm thử E2E bằng Playwright (cần cài Chromium trước: npx playwright install chromium)
npm run e2e

# Chạy bản build production để demo
npm run build && npm run preview
```

## 2. Kiến trúc 4 tầng

- `src/domain/`: Luật nghiệp vụ thuần TypeScript (cấm import React, DOM, `localStorage`). Mọi nhãn và thông báo lỗi tiếng Việt đặt tại `src/domain/labels.vi.ts`.
- `src/data/`: Đọc/ghi `localStorage` (`clb-muon-thiet-bi:v1`), kiểm tra schema, sao lưu bản hỏng và dữ liệu mẫu BTC (`createSeed()`).
- `src/services/`: Store (`useSyncExternalStore`) và các ca sử dụng (`submitRequest`, `changeRequestStatus`, `resetToSeed`), luôn kiểm tra lại luật nghiệp vụ ở tầng service trước khi ghi.
- `src/ui/`: Giao diện React mobile-first (`MemberPage`, `ManagerPage`), chỉ hiển thị và gọi service.

## 3. Các quyết định nghiệp vụ (D1–D11)

| Mã | Quyết định |
|---|---|
| D1 | Chồng lấn ngày tính theo khoảng đóng hai đầu `[mượn, trả]` (`21–22` và `22–23` là trùng). |
| D2 | Chỉ trạng thái `Đã duyệt` và `Đang mượn` (`BLOCKING_STATUSES`) chiếm thiết bị. |
| D3 | Chặn trùng với yêu cầu đang chiếm khi gửi và khi duyệt/cho mượn; hai yêu cầu `Chờ duyệt` trùng nhau vẫn cho gửi kèm cảnh báo nhẹ. |
| D4 | Cho phép đổi tự do giữa 5 trạng thái nhưng vẫn đi qua các chốt chặn bảo trì và trùng lịch. |
| D5 | Thiết bị `Bảo trì` không cho gửi yêu cầu mới và không cho duyệt/cho mượn. |
| D6 | Thiết bị `Đang mượn` vẫn cho đặt lịch cho ngày tương lai. |
| D7 | Đồng bộ tình trạng thiết bị chỉ chạy khi đổi trạng thái yêu cầu (`→ Đang mượn` / `→ Đã trả`), không chạy khi nạp dữ liệu mẫu. |
| D8 | Không chặn ngày mượn trong quá khứ. |
| D9 | Lưu ngày dạng ISO `YYYY-MM-DD`, hiển thị `dd/mm/yyyy`. |
| D10 | Không có đăng nhập; chuyển giữa màn Thành viên (`#/`) và Người phụ trách (`#/quan-ly`) qua menu. |
| D11 | Không suy luận lịch từ ô Ghi chú tự do. |

## 4. Giới hạn đã biết

1. Không có xác thực/phân quyền; ai mở được màn quản lý đều đổi được trạng thái (D10).
2. Dữ liệu lưu cục bộ trên từng trình duyệt/thiết bị, không đồng bộ giữa các máy khác nhau.
3. Ô Ghi chú là văn bản tự do, không tham gia kiểm tra trùng lịch (D11).
4. Không chặn ngày mượn trong quá khứ (D8).
