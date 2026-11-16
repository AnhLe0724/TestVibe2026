# Project Context
- **Mục tiêu:** Xây dựng mini app web tiếng Việt quản lý mượn thiết bị CLB: xem thiết bị, gửi yêu cầu mượn, người phụ trách đổi trạng thái (Chờ duyệt / Đã duyệt / Đang mượn / Đã trả / Từ chối).
- **Tech stack:** React + Vite + TypeScript (strict), CSS thuần, chạy hoàn toàn phía client, lưu dữ liệu bằng localStorage. Không backend, không thêm thư viện khi chưa hỏi.
- **Nguyên tắc:** Giao diện tối giản, code gọn (mỗi file ≤ 200 dòng), ưu tiên sử dụng các skills trong `.agent/skills/`.
# Phạm vi (KHÓA)
- Chỉ làm theo `docs/KE_HOACH_THIET_KE_KY_THUAT.md`; mỗi lần chỉ làm MỘT giai đoạn/lát, xong và có test mới sang lát tiếp.
- Kiến trúc 4 tầng: `domain` → `data` → `services` → `ui`. `domain/` là TS thuần (cấm import React, DOM, localStorage); UI không tự kiểm tra luật nghiệp vụ, chỉ gọi service.
- Không thêm tính năng ngoài kế hoạch, không đổi cấu trúc thư mục, không sửa file không liên quan.
- Nhãn và thông báo lỗi tiếng Việt chỉ đặt trong `domain/labels.vi.ts`; không dùng chuỗi ma thuật.
- Dữ liệu mẫu BTC giữ nguyên văn; nút "Nạp dữ liệu mẫu" phải đưa app về đúng trạng thái ban đầu.
- Viết test trước cho `domain/`; chạy `npm run verify` sau mỗi thay đổi, xanh mới được báo "xong".
- Gặp điểm mơ hồ: hỏi lại, không tự đoán.
 