# Báo cáo kiểm thử

**Ngày kiểm thử:** 2026-11-17  
**Phạm vi:** Toàn bộ yêu cầu P0 (R1–R9) và P1 (X1–X2) theo [KE_HOACH_THIET_KE_KY_THUAT.md](./KE_HOACH_THIET_KE_KY_THUAT.md)

## 1. Kết quả kiểm thử tự động

| Lệnh | Kết quả | Chi tiết |
|---|---|---|
| `npm run typecheck` | Đạt | `tsc --noEmit` (strict + `noUncheckedIndexedAccess`), 0 lỗi |
| `npm run lint` | Đạt | `eslint src e2e` (gồm luật phụ thuộc 4 tầng), 0 lỗi |
| `npm run test` | Đạt | **15 file test / 82 test cases passed** (Unit + Integration + Component) |
| `npm run test:cov` | Đạt | Tổng: **97.99% Stmts / 95.58% Branch / 100% Funcs (domain)**; riêng `domain/`: **97.54% Branch** |
| `npm run build` | Đạt | `vite build` thành công (`dist/index.html`, JS `244.73 kB`, CSS `6.97 kB`) |
| `npm run e2e` | Đạt | **7/7 kịch bản Playwright passed** (`E2E-01` → `E2E-08`, gồm mobile `375×667` và hỏng `localStorage`) |

## 2. Kiểm tra quy ước kiến trúc & mã nguồn

- Mọi file trong `src/` đều `≤ 193` dòng (đạt quy tắc `≤ 200` dòng).
- Tầng `domain/` thuần TypeScript, không import React/DOM/`localStorage`.
- Toàn bộ nhãn và thông báo lỗi tiếng Việt tập trung tại `src/domain/labels.vi.ts`.
- Không dùng `dangerouslySetInnerHTML`.
- Dữ liệu mẫu BTC giữ nguyên văn trong `src/data/seed.ts`.
