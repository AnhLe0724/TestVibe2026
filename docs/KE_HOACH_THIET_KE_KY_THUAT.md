# KẾ HOẠCH THIẾT KẾ KỸ THUẬT
## Ứng dụng đăng ký và quản lý mượn thiết bị cho câu lạc bộ (Bảng Kỹ thuật)

> **Mục đích tối thượng:** chức năng **không lỗi**, **chạy chuẩn**, **dễ sửa**.
> Mọi quyết định trong tài liệu này đều phải trả lời được câu hỏi: *"Nó giúp giảm lỗi, giúp chạy đúng, hay giúp sửa nhanh hơn không?"* Nếu không, bỏ.

---

## 0. Tóm tắt một trang

| Hạng mục | Quyết định |
|---|---|
| Loại ứng dụng | Web một trang (SPA), giao diện tiếng Việt, chạy hoàn toàn trên trình duyệt, không cần máy chủ |
| Công nghệ | Vite + React + TypeScript (strict). Lưu dữ liệu bằng `localStorage` |
| Kiến trúc | 4 tầng: **domain** (luật nghiệp vụ thuần) → **data** (lưu trữ) → **services** (ca sử dụng) → **ui** (giao diện) |
| Nguyên tắc chống lỗi | Mọi luật nghiệp vụ nằm ở **một nơi duy nhất** (domain), giao diện không tự kiểm tra, kiểm tra lại ở service khi ghi |
| Nguyên tắc dễ sửa | File nhỏ (< 200 dòng), một file một việc, không "chuỗi ma thuật" (magic string), nhãn tiếng Việt gom một chỗ |
| Kiểm thử | Unit (luật) → Integration (service + lưu trữ) → Component (form, màn hình) → E2E (đúng kịch bản demo) |
| Cổng chất lượng | `npm run verify` (typecheck + lint + test + build) phải xanh trước mỗi commit |

---

## 1. Phân tích yêu cầu

### 1.1 Bảng truy vết yêu cầu (Requirement → Module → Test)

| # | Yêu cầu của BTC | Ưu tiên | Module chịu trách nhiệm | Test chính |
|---|---|---|---|---|
| R1 | Danh sách thiết bị: tên, mã, tình trạng, ghi chú | P0 | `ui/features/devices/*` | CT-DEV-*, E2E-01 |
| R2 | Lọc theo tình trạng / loại thiết bị | P0 | `domain/filters.ts` | UT-FI-*, CT-DEV-* |
| R3 | Form gửi yêu cầu: chọn thiết bị, tên, ngày mượn, ngày trả dự kiến | P0 | `ui/features/borrow/BorrowForm`, `services/requestService.ts` | CT-FORM-*, E2E-02 |
| R4 | Kiểm tra bắt buộc; ngày trả không trước ngày mượn | P0 | `domain/validation.ts`, `domain/date.ts` | UT-VA-* |
| R5 | Màn hình người phụ trách: xem yêu cầu, đổi trạng thái (5 trạng thái) | P0 | `ui/features/manager/*`, `domain/statusRules.ts` | UT-ST-*, CT-MGR-*, E2E-04 |
| R6 | Không cho duyệt 2 yêu cầu chồng lấn ngày trên cùng thiết bị + thông báo dễ hiểu | P0 | `domain/overlap.ts`, `domain/statusRules.ts` | UT-OV-*, UT-ST-*, E2E-03 |
| R7 | Tìm yêu cầu theo tên người mượn hoặc mã thiết bị | P0 | `domain/search.ts` | UT-SE-*, E2E-01 |
| R8 | Dữ liệu còn sau khi tải lại trang | P0 | `data/storage.ts` | IT-ST-*, E2E-05 |
| R9 | Nút "Nạp dữ liệu mẫu" đưa về đúng trạng thái ban đầu | P0 | `services/resetService.ts`, `data/seed.ts` | IT-ST-07/08, E2E-06 |
| X1 | Thống kê: số thiết bị Sẵn sàng / Đang mượn / Bảo trì | P1 | `domain/stats.ts` | UT-SS-* |
| X2 | Xác nhận trả + ghi nhận thời điểm trả | P1 | `domain/statusRules.ts` (`returnedAt`) | UT-ST-08 |
| X3 | QR cho mã yêu cầu (chỉ để thử, không tính điểm) | P2 | `ui/features/manager/RequestQr.tsx` | Kiểm thủ công |

**Quy tắc cắt phạm vi:** P0 phải xong 100% và đã kiểm thử trước khi đụng P1. P2 chỉ làm khi mọi thứ còn lại đã xanh.

### 1.2 Các quyết định và giả định (cần bạn xác nhận)

Đề có những chỗ mơ hồ. Dưới đây là cách tôi chọn, kèm lý do. Mỗi cái được tách thành hằng số/bảng dữ liệu nên đổi rất nhanh nếu BTC hiểu khác.

| Mã | Vấn đề | Quyết định | Lý do / Cách đổi |
|---|---|---|---|
| D1 | "Chồng lấn" tính theo ngày nào? | **Khoảng ngày đóng 2 đầu** (`[mượn, trả]` tính cả hai ngày). Mượn 21–22 và mượn 22–23 **là trùng** | Dữ liệu mẫu có YC-102 mượn và trả cùng ngày 21/11, nghĩa là ngày trả vẫn chiếm thiết bị. Đổi: sửa 1 dòng trong `overlap.ts` |
| D2 | Trạng thái nào "chiếm" thiết bị? | Chỉ **Đã duyệt** và **Đang mượn** (`BLOCKING_STATUSES`) | Chờ duyệt chưa chắc được; Đã trả/Từ chối đã giải phóng. Đổi: `constants.ts` |
| D3 | Kiểm tra trùng lịch lúc nào? | (a) Khi **gửi** yêu cầu: chặn nếu trùng yêu cầu đang chiếm. (b) Khi **chuyển sang** Đã duyệt/Đang mượn: chặn nếu trùng yêu cầu khác đang chiếm. (c) Hai yêu cầu *Chờ duyệt* trùng nhau vẫn được gửi (hiện cảnh báo nhẹ), vì người phụ trách sẽ chọn một | Khớp kịch bản demo "thử tạo yêu cầu trùng thời gian" và yêu cầu "không cho duyệt" |
| D4 | Đổi trạng thái yêu cầu có bị giới hạn thứ tự không? | **Cho đổi tự do giữa 5 trạng thái**, nhưng vẫn qua đủ các chốt chặn (trùng lịch, thiết bị bảo trì). Bảng `ALLOWED_TRANSITIONS` cho phép siết lại | BTC có thể demo đổi bất kỳ trạng thái nào; người phụ trách cũng cần sửa nhầm. Đổi: `statusRules.ts` |
| D5 | Thiết bị **Bảo trì** | Không cho gửi yêu cầu mới; không cho duyệt/cho mượn yêu cầu cũ của thiết bị đó | Đề ghi "Không cho đăng ký mượn" |
| D6 | Thiết bị **Đang mượn** (vd. TB-02) | **Vẫn cho** gửi yêu cầu cho ngày tương lai | Đặt lịch trước là mục đích của ứng dụng (YC-101 chính là ví dụ) |
| D7 | Tình trạng thiết bị đồng bộ với yêu cầu? | Khi yêu cầu → **Đang mượn**: thiết bị → *Đang mượn*. Khi → **Đã trả**: thiết bị → *Sẵn sàng* (nếu không còn yêu cầu Đang mượn khác của nó). *Bảo trì* không bao giờ bị tự đổi. Đồng bộ chỉ chạy **khi đổi trạng thái**, không chạy lúc nạp dữ liệu | Dữ liệu mẫu có điểm lệch: YC-103 "Đang mượn" nhưng TB-01 "Sẵn sàng". Nút nạp mẫu phải trả về **đúng nguyên văn** dữ liệu BTC, không được "sửa cho đẹp" |
| D8 | Ngày mượn trong quá khứ | **Không chặn** (chỉ không có luật) | Đề không yêu cầu; chặn sẽ phụ thuộc đồng hồ máy và dễ làm hỏng demo |
| D9 | Định dạng ngày | Lưu `YYYY-MM-DD` (chuỗi ISO), hiển thị `dd/mm/yyyy` | So sánh chuỗi ISO đúng thứ tự thời gian, tránh lỗi múi giờ |
| D10 | Xác thực người phụ trách | **Không có đăng nhập** (đề không yêu cầu). Hai màn hình truy cập bằng menu | Ghi rõ trong README để không bị hiểu là thiếu sót |
| D11 | Yêu cầu mượn thiết bị đang "Đang mượn" nhưng chưa có bản ghi yêu cầu tương ứng (TB-02) | Không suy luận từ ô Ghi chú. Ghi nhận là **giới hạn đã biết** | Ghi chú là văn bản tự do; suy luận sẽ sinh lỗi khó đoán |

---

## 2. Mô hình dữ liệu và luật nghiệp vụ

### 2.1 Kiểu dữ liệu (`src/domain/types.ts`)

```ts
export type ISODate = string; // "2026-11-22", luôn đã qua kiểm tra hợp lệ

export type DeviceStatus = 'available' | 'borrowed' | 'maintenance';
export type RequestStatus = 'pending' | 'approved' | 'borrowing' | 'returned' | 'rejected';

export interface Device {
  id: string;            // "TB-01"
  name: string;          // "Máy ảnh Lumix G7"
  category: string;      // "Máy ảnh"
  status: DeviceStatus;
  note: string;
}

export interface BorrowRequest {
  id: string;            // "YC-101"
  borrower: string;      // "An Nguyễn"
  deviceId: string;      // "TB-02"
  startDate: ISODate;
  endDate: ISODate;
  status: RequestStatus;
  createdAt: string;     // ISO date-time
  returnedAt?: string;   // chỉ có khi status = 'returned' (X2)
}

export interface AppState {
  schemaVersion: 1;
  devices: Device[];
  requests: BorrowRequest[];
  nextRequestSeq: number; // 104 sau khi nạp mẫu → YC-104
}
```

**Vì sao dùng mã tiếng Anh (`'available'`) và tách nhãn tiếng Việt?** Mã không có dấu nên không gõ sai chính tả, không lệch Unicode (dấu dựng sẵn/tổ hợp). Nhãn "Sẵn sàng", "Chờ duyệt"… nằm duy nhất trong `labels.vi.ts`, sửa chữ chỉ sửa một chỗ.

### 2.2 Kiểu kết quả thống nhất (`src/domain/result.ts`)

Mọi hàm nghiệp vụ **không ném lỗi** cho tình huống người dùng gây ra; chúng trả về `Result`:

```ts
export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; errors: AppError[] };

export interface AppError {
  code: ErrorCode;            // vd. 'SCHEDULE_CONFLICT'
  field?: 'borrower' | 'deviceId' | 'startDate' | 'endDate';
  params?: Record<string, string>; // dữ liệu để chèn vào câu thông báo
}
```

Giao diện chỉ làm một việc: `errors.map(e => MESSAGES[e.code](e.params))`. Lợi ích: thêm/sửa thông báo không đụng logic; test kiểm `code` chứ không so chuỗi dài.

### 2.3 Luật chồng lấn (`src/domain/overlap.ts`)

```ts
// Điều kiện: cả hai khoảng đã hợp lệ (start <= end, định dạng ISO)
export const rangesOverlap = (a: DateRange, b: DateRange): boolean =>
  a.start <= b.end && b.start <= a.end;

export const findConflict = (
  requests: BorrowRequest[],
  candidate: { id?: string; deviceId: string; startDate: ISODate; endDate: ISODate },
): BorrowRequest | undefined =>
  requests.find(r =>
    r.id !== candidate.id &&                       // không tự trùng với chính nó
    r.deviceId === candidate.deviceId &&
    BLOCKING_STATUSES.includes(r.status) &&
    rangesOverlap({ start: r.startDate, end: r.endDate },
                  { start: candidate.startDate, end: candidate.endDate }));
```

### 2.4 Luật đổi trạng thái yêu cầu (`src/domain/statusRules.ts`)

Hàm thuần: `planStatusChange(state, requestId, target): Result<AppState>` (trả về trạng thái mới, không sửa trạng thái cũ).

Thứ tự kiểm tra (dừng ở lỗi đầu tiên):
1. Yêu cầu tồn tại? → `REQUEST_NOT_FOUND`
2. Chuyển đổi nằm trong `ALLOWED_TRANSITIONS`? → `TRANSITION_NOT_ALLOWED` (mặc định cho phép tất cả, D4)
3. Nếu `target ∈ BLOCKING_STATUSES`:
   - thiết bị đang *Bảo trì*? → `DEVICE_UNDER_MAINTENANCE`
   - `findConflict(...)` có kết quả? → `SCHEDULE_CONFLICT` (kèm mã yêu cầu, tên người, khoảng ngày đang chiếm)
4. Áp dụng: cập nhật `status`; đặt/xóa `returnedAt`; đồng bộ tình trạng thiết bị theo D7.

### 2.5 Kiểm tra form gửi yêu cầu (`src/domain/validation.ts`)

`validateNewRequest(input, state): Result<NewRequest>`. **Trả về tất cả lỗi cùng lúc** (không dừng ở lỗi đầu) để người dùng sửa một lượt.

| Trường | Luật | Mã lỗi |
|---|---|---|
| Người mượn | Bỏ khoảng trắng đầu/cuối, gộp khoảng trắng liên tiếp; không rỗng; 2–60 ký tự | `NAME_REQUIRED`, `NAME_TOO_SHORT`, `NAME_TOO_LONG` |
| Thiết bị | Đã chọn; tồn tại; không *Bảo trì* | `DEVICE_REQUIRED`, `DEVICE_NOT_FOUND`, `DEVICE_UNDER_MAINTENANCE` |
| Ngày mượn / trả | Có giá trị; là ngày lịch hợp lệ (loại `2026-02-30`) | `START_REQUIRED`, `END_REQUIRED`, `DATE_INVALID` |
| Quan hệ ngày | `endDate >= startDate` (bằng nhau là hợp lệ) | `END_BEFORE_START` |
| Lịch | Không trùng yêu cầu đang chiếm (D3a) | `SCHEDULE_CONFLICT` |

Cảnh báo (không chặn): trùng với yêu cầu *Chờ duyệt* khác → mã `OVERLAPS_PENDING`, hiện thông báo nhẹ sau khi gửi thành công.

### 2.6 Tìm kiếm (`src/domain/search.ts`)

- Chuẩn hóa cả truy vấn và dữ liệu: bỏ dấu (`NFD` + xóa dấu tổ hợp), **thay `đ`→`d` thủ công** (vì `đ` không tách được bằng NFD), chữ thường, gộp khoảng trắng.
- Khớp **chứa chuỗi** (`includes`) trên: tên người mượn, mã thiết bị. Thêm bản "rút gọn" bỏ ký tự không phải chữ/số để `tb03` khớp `TB-03`. (Mở rộng nhẹ: mã yêu cầu `YC-101`.)
- Truy vấn rỗng → trả về toàn bộ.

### 2.7 Sinh mã yêu cầu

Dùng bộ đếm `nextRequestSeq` lưu cùng dữ liệu, **không** dùng `length + 1` (sẽ trùng mã nếu có xóa/đổi). Sau nạp mẫu `nextRequestSeq = 104`. Test: tạo → `YC-104`, tải lại, tạo tiếp → `YC-105`.

---

## 3. Kiến trúc

```
┌─────────────────────────── ui (React) ───────────────────────────┐
│  pages → features → components      (chỉ hiển thị + gọi service) │
└───────────────┬──────────────────────────────────────────────────┘
                │ gọi hàm / đọc store
┌───────────────▼────────────── services ──────────────────────────┐
│  requestService, deviceService, resetService, store              │
│  (ghép domain + data; mỗi hàm là 1 ca sử dụng, trả Result)       │
└──────┬───────────────────────────────────────────────┬───────────┘
       │ dùng luật                                      │ đọc/ghi
┌──────▼───────── domain (TS thuần) ──────┐   ┌────────▼── data ────────┐
│ types, date, overlap, validation,       │   │ storage, seed, schema,  │
│ statusRules, search, filters, stats     │   │ migrations              │
└─────────────────────────────────────────┘   └─────────────────────────┘
```

### 3.1 Quy tắc phụ thuộc (bắt buộc, kiểm bằng ESLint `no-restricted-imports`)

| Tầng | Được import | **Cấm** import |
|---|---|---|
| `domain` | chỉ chính nó | `react`, `window`, `document`, `localStorage`, `data`, `services`, `ui` |
| `data` | `domain` | `react`, `services`, `ui` |
| `services` | `domain`, `data` | `react`, `ui` |
| `ui` | `services`, `domain` (kiểu & nhãn) | `data` trực tiếp |

**Vì sao?** Luật nghiệp vụ thuần thì test được trong vài mili-giây, không cần trình duyệt, và sửa luật không thể làm vỡ giao diện.

### 3.2 Luồng dữ liệu một chiều

```
Hành động người dùng → service (kiểm tra bằng domain trên trạng thái MỚI NHẤT)
   → Result thất bại  → UI hiện lỗi, trạng thái KHÔNG đổi
   → Result thành công → store cập nhật → storage ghi → UI render lại từ store
```

Quy tắc chống lỗi cốt lõi:
1. **Nguồn sự thật duy nhất**: `store`. Không có bản sao state trong component (trừ giá trị đang gõ trong ô nhập).
2. **Kiểm tra lại ở service**, không tin nút bị vô hiệu hóa ở giao diện (người dùng có thể bấm nhanh, mở hai tab, dữ liệu đã đổi).
3. **Bất biến (immutable)**: hàm domain trả trạng thái mới, không sửa trực tiếp.
4. **Hằng số `SEED` đóng băng** (`Object.freeze` sâu hoặc hàm `createSeed()` trả bản sao mới mỗi lần) để nút nạp mẫu không bao giờ bị nhiễm dữ liệu cũ.

### 3.3 Store (`src/services/store.ts`)

Store tự viết ~40 dòng: `getState()`, `setState(next)`, `subscribe(fn)`; React dùng `useSyncExternalStore`. Không cần thư viện state. Test được không cần React.

### 3.4 Lưu trữ (`src/data/storage.ts`)

- Khóa: `clb-muon-thiet-bi:v1`. Giá trị: JSON của `AppState`.
- **Đọc**: `try/catch` quanh `getItem` và `JSON.parse` → kiểm schema (`schema.ts`) → hợp lệ thì dùng; sai/hỏng thì **lưu bản hỏng sang khóa `...:corrupt-<timestamp>`**, nạp dữ liệu mẫu, và hiện cảnh báo (không bao giờ màn hình trắng).
- **Ghi**: `try/catch` quanh `setItem`. Thất bại (chế độ riêng tư/đầy bộ nhớ) → ứng dụng vẫn chạy trong bộ nhớ, hiện banner *"Không lưu được dữ liệu vào trình duyệt. Dữ liệu sẽ mất khi tải lại trang."*
- **Đồng bộ nhiều tab**: lắng nghe sự kiện `storage` → nạp lại store.
- **Phiên bản**: `schemaVersion` + `migrations.ts` (hiện chỉ v1; có khung sẵn để sau này đổi cấu trúc không làm mất dữ liệu).
- Giao diện `Storage` được tiêm vào (dependency injection) để test dùng `fakeStorage`.

### 3.5 Điều hướng

Router băm (hash) rất nhẹ, không cần thư viện: `#/` (thành viên: thiết bị + form) và `#/quan-ly` (người phụ trách). Tải lại trang giữ nguyên màn hình. Đường dẫn lạ → về `#/`.

---

## 4. Cấu trúc thư mục

```
clb-muon-thiet-bi/
├─ index.html
├─ package.json
├─ tsconfig.json                 # "strict": true, noUncheckedIndexedAccess: true
├─ vite.config.ts
├─ vitest.config.ts
├─ playwright.config.ts
├─ eslint.config.js              # gồm luật phụ thuộc tầng (mục 3.1)
├─ README.md                     # cách chạy, quyết định D1–D11, giới hạn đã biết
├─ docs/
│  ├─ KE_HOACH_THIET_KE_KY_THUAT.md   # tài liệu này
│  └─ BAO_CAO_KIEM_THU.md             # ghi kết quả chạy test trước demo
├─ e2e/                          # Playwright: mô phỏng kịch bản demo
│  ├─ demo-flow.spec.ts
│  ├─ persistence.spec.ts
│  └─ mobile.spec.ts
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ app/
   │  ├─ router.tsx              # hash router
   │  ├─ ErrorBoundary.tsx       # lỗi bất ngờ → màn hình thân thiện + nút nạp mẫu
   │  └─ bootstrap.ts            # tải dữ liệu, dựng store
   ├─ domain/                    # ★ TS thuần, trái tim của ứng dụng
   │  ├─ types.ts
   │  ├─ constants.ts            # BLOCKING_STATUSES, ALLOWED_TRANSITIONS, giới hạn
   │  ├─ labels.vi.ts            # nhãn trạng thái + MESSAGES lỗi tiếng Việt
   │  ├─ result.ts
   │  ├─ date.ts                 # parse/validate/format dd/mm/yyyy ↔ ISO
   │  ├─ overlap.ts
   │  ├─ validation.ts
   │  ├─ statusRules.ts
   │  ├─ search.ts               # normalize + searchRequests
   │  ├─ filters.ts              # filterDevices
   │  ├─ stats.ts                # (P1)
   │  ├─ ids.ts                  # formatRequestId, nextId
   │  └─ *.test.ts               # test đặt cạnh file được test
   ├─ data/
   │  ├─ seed.ts                 # createSeed(): dữ liệu BTC, nguyên văn
   │  ├─ schema.ts               # kiểm cấu trúc dữ liệu đọc từ localStorage
   │  ├─ storage.ts
   │  ├─ migrations.ts
   │  └─ *.test.ts
   ├─ services/
   │  ├─ store.ts
   │  ├─ requestService.ts       # submitRequest, changeRequestStatus
   │  ├─ deviceService.ts        # changeDeviceStatus (P1)
   │  ├─ resetService.ts         # resetToSeed
   │  └─ *.test.ts
   ├─ ui/
   │  ├─ components/             # nút, ô nhập, StatusBadge, Toast, ConfirmDialog, EmptyState
   │  ├─ features/
   │  │  ├─ devices/            # DeviceList, DeviceCard, DeviceFilters
   │  │  ├─ borrow/             # BorrowForm
   │  │  └─ manager/            # RequestTable, StatusSelect, RequestSearch, StatsBar, RequestQr
   │  ├─ pages/                 # MemberPage, ManagerPage (chỉ ghép feature)
   │  ├─ hooks/                 # useStore, useToast
   │  └─ styles/                # tokens.css (màu/khoảng cách), base.css
   └─ test/
      ├─ setup.ts
      ├─ fakeStorage.ts         # localStorage giả, có chế độ "ném lỗi"
      └─ factories.ts           # makeDevice(), makeRequest() để viết test gọn
```

### 4.1 Bản đồ sửa lỗi ("Muốn sửa X → mở file Y")

| Muốn sửa… | Mở file |
|---|---|
| Thay chữ hiển thị / câu thông báo lỗi | `domain/labels.vi.ts` |
| Đổi cách tính trùng lịch (vd. ngày trả không chiếm) | `domain/overlap.ts` |
| Đổi trạng thái nào được coi là "chiếm thiết bị" | `domain/constants.ts` (`BLOCKING_STATUSES`) |
| Siết/nới thứ tự chuyển trạng thái | `domain/constants.ts` (`ALLOWED_TRANSITIONS`) |
| Thêm/bớt quy tắc kiểm tra form | `domain/validation.ts` + `labels.vi.ts` |
| Sai kết quả tìm kiếm | `domain/search.ts` |
| Dữ liệu mẫu sai/lệch BTC | `data/seed.ts` |
| Mất dữ liệu sau tải lại / lỗi lưu | `data/storage.ts` |
| Giao diện/màu/khoảng cách | `ui/styles/tokens.css`, `ui/components/*` |
| Màn hình thành viên / người phụ trách | `ui/pages/*` → `ui/features/*` |

### 4.2 Quy ước code (để dễ sửa)

- Một file một trách nhiệm; **tối đa ~200 dòng**; hàm tối đa ~30 dòng.
- Đặt tên theo nghiệp vụ (`findConflict`, `planStatusChange`), không đặt `utils.ts`/`helpers.ts`.
- **Không** chuỗi ma thuật: `'approved'` chỉ xuất hiện trong `types.ts`/`constants.ts`; nơi khác dùng hằng số.
- Chú thích **vì sao** (không chú thích cái hiển nhiên). Mỗi quyết định D1–D11 có comment `// D1:` tại chỗ áp dụng.
- Quy ước `data-testid` (cho E2E ổn định, không phụ thuộc chữ tiếng Việt): `device-card-TB-03`, `filter-status`, `filter-category`, `form-borrower`, `form-device`, `form-start`, `form-end`, `form-submit`, `field-error-<tên trường>`, `request-row-YC-101`, `status-select-YC-101`, `request-search`, `alert-conflict`, `btn-reset-seed`, `confirm-reset-yes`, `stats-available`, `stats-borrowed`, `stats-maintenance`.

---

## 5. Thiết kế giao diện

### 5.1 Hai màn hình

**Màn hình Thành viên (`#/`)**
- Thanh trên: tên ứng dụng, menu (Thành viên | Người phụ trách), nút **Nạp dữ liệu mẫu**.
- Bộ lọc: Tình trạng (Tất cả/Sẵn sàng/Đang mượn/Bảo trì), Loại thiết bị (sinh từ dữ liệu, không gõ cứng), nút "Xóa lọc".
- Danh sách thiết bị dạng thẻ: **mã, tên, loại, huy hiệu tình trạng, ghi chú**. Thiết bị Bảo trì hiện nút "Mượn" bị vô hiệu kèm lý do.
- Form "Gửi yêu cầu mượn": Thiết bị (chọn; bấm "Mượn" trên thẻ sẽ điền sẵn), Tên người mượn, Ngày mượn, Ngày trả dự kiến, nút Gửi.

**Màn hình Người phụ trách (`#/quan-ly`)**
- (P1) Thanh thống kê: 3 số Sẵn sàng / Đang mượn / Bảo trì.
- Ô tìm kiếm "Tìm theo tên người mượn hoặc mã thiết bị".
- Bảng yêu cầu: Mã YC, Người mượn, Thiết bị (mã + tên), Ngày mượn, Ngày trả, Trạng thái (ô chọn đổi trạng thái).
- Khu vực thông báo lỗi trùng lịch nằm **ngay phía trên bảng**, `role="alert"`.

### 5.2 Mọi vùng dữ liệu phải có đủ 4 trạng thái

| Trạng thái | Ví dụ hiển thị |
|---|---|
| Có dữ liệu | Bảng/thẻ bình thường |
| Rỗng | "Chưa có yêu cầu nào." / "Không có yêu cầu khớp “abc”." + nút xóa tìm kiếm |
| Lỗi | Banner lỗi lưu trữ; ErrorBoundary |
| Thành công | Toast "Đã gửi yêu cầu YC-104." / "Đã đổi YC-101 sang Đã duyệt." |

### 5.3 Thông báo tiếng Việt (mẫu, đặt trong `labels.vi.ts`)

| Mã lỗi | Câu hiển thị |
|---|---|
| `NAME_REQUIRED` | Vui lòng nhập tên người mượn. |
| `DEVICE_REQUIRED` | Vui lòng chọn thiết bị cần mượn. |
| `START_REQUIRED` / `END_REQUIRED` | Vui lòng chọn ngày mượn. / Vui lòng chọn ngày trả dự kiến. |
| `END_BEFORE_START` | Ngày trả không được trước ngày mượn. |
| `DEVICE_UNDER_MAINTENANCE` | Thiết bị {id} đang bảo trì nên chưa thể cho mượn. |
| `SCHEDULE_CONFLICT` | Thiết bị {id} đã có yêu cầu {reqId} ({người}) từ {dd/mm/yyyy} đến {dd/mm/yyyy}, trùng với thời gian này. Vui lòng chọn ngày khác. |
| `STORAGE_WRITE_FAILED` | Không lưu được dữ liệu vào trình duyệt. Dữ liệu sẽ mất khi tải lại trang. |
| `STORAGE_CORRUPT` | Dữ liệu đã lưu bị lỗi nên ứng dụng đã nạp lại dữ liệu mẫu. |

Câu lỗi phải: nói **chuyện gì xảy ra**, **vì sao**, **làm gì tiếp** — không dùng thuật ngữ kỹ thuật.

### 5.4 Quy tắc giao diện

- **Mobile-first**: kiểm tra ở 375×667; không cuộn ngang; bảng yêu cầu chuyển thành thẻ xếp dọc khi hẹp.
- Nút/ô chạm ≥ 44px; mỗi ô nhập có `<label>` thật; lỗi gắn `aria-describedby`; khi gửi lỗi, **đưa con trỏ vào ô lỗi đầu tiên**.
- Trạng thái dùng **chữ + màu** (không chỉ màu).
- Nút **Nạp dữ liệu mẫu** luôn có hộp xác nhận ("Thao tác này sẽ xóa mọi thay đổi và khôi phục dữ liệu ban đầu. Tiếp tục?").
- Nhập tên có gõ dấu (Telex/VNI): không được cắt/giật chữ khi đang soạn.
- Mọi nội dung người dùng nhập render bằng React (tự thoát ký tự). **Cấm** `dangerouslySetInnerHTML`.

---

## 6. Phương pháp xây dựng có hệ thống

### 6.1 Nguyên tắc làm việc

1. **Từ trong ra ngoài**: domain → data → service → UI. Lõi đúng trước, giao diện làm sau cùng.
2. **Lát cắt dọc**: mỗi lát là một chức năng hoàn chỉnh (luật + test + UI + E2E), xong mới sang lát khác. Không để dở dang nhiều chỗ.
3. **Viết test trước cho domain** (TDD): với luật nghiệp vụ, viết bảng ca kiểm thử (mục 7) rồi mới viết hàm.
4. **Mỗi bước nhỏ → chạy `npm run verify` → commit.** Hỏng thì quay lại commit trước, không "vá chồng vá".
5. **Không thêm thứ không có trong bảng truy vết** khi P0 chưa xong.

### 6.2 Các giai đoạn và tiêu chí hoàn thành (Exit Criteria)

| GĐ | Công việc | Tiêu chí xong (phải đạt mới sang GĐ sau) | Tỷ trọng thời gian |
|---|---|---|---|
| 0 | **Khung dự án**: Vite+React+TS strict, ESLint (luật tầng), Prettier, Vitest, Playwright, script `verify`, commit đầu | `npm run verify` chạy xanh trên dự án rỗng; thử import sai tầng bị ESLint báo | 5% |
| 1 | **Domain**: `types, constants, result, date, overlap, validation, statusRules, search, filters, ids` + test | Toàn bộ UT-* xanh; độ phủ nhánh domain ≥ 95%; test vét cạn `overlap` xanh | 20% |
| 2 | **Data**: `seed` (đúng nguyên văn BTC), `schema`, `storage`, `migrations` + test | IT-ST-* xanh; test "seed khớp từng ô với đề" xanh | 10% |
| 3 | **Services + store**: `submitRequest, changeRequestStatus, resetToSeed` | IT-SV-* xanh; gọi service sai không làm đổi state | 10% |
| 4 | **UI khung**: layout, router, ErrorBoundary, tokens CSS, components dùng chung | Chuyển 2 màn hình được; ErrorBoundary hiện đúng khi cố ném lỗi | 10% |
| 5 | **Lát R1+R2**: danh sách thiết bị + bộ lọc | CT-DEV-* xanh; xem được trên điện thoại | 8% |
| 6 | **Lát R3+R4**: form gửi yêu cầu | CT-FORM-* xanh; E2E-02 xanh | 12% |
| 7 | **Lát R5+R6+R7**: màn hình quản lý, đổi trạng thái, báo trùng lịch, tìm kiếm | CT-MGR-* xanh; E2E-03, E2E-04 xanh | 15% |
| 8 | **Lát R8+R9**: lưu bền + nạp mẫu (đã có lõi từ GĐ2–3, ở đây nối UI) | E2E-05, E2E-06 xanh | 5% |
| 9 | **Mở rộng P1** (X1 thống kê → X2 trả/`returnedAt`) | Mỗi mục có test riêng; P0 vẫn xanh | 5% |
| 10 | **Củng cố & diễn tập**: mobile, bàn phím, chạy toàn bộ kịch bản demo 3 lần liên tiếp, điền `BAO_CAO_KIEM_THU.md` | Danh sách kiểm thủ công (7.7) tích hết; `verify` + `e2e` xanh trên bản build | (còn lại) |

> **Nếu thiếu thời gian**, cắt theo thứ tự: X3 (QR) → X2 → X1 → trau chuốt giao diện. **Không bao giờ cắt**: GĐ 1–3 và các test của R4, R6, R8, R9.

### 6.3 Quy tắc khi dùng AI để viết code (vibe coding an toàn)

- **Giao từng lát**, kèm file liên quan và tiêu chí xong. Không yêu cầu "làm cả ứng dụng".
- Luôn dán cho AI: (1) kiểu dữ liệu `types.ts`, (2) quy tắc tầng (mục 3.1), (3) các quyết định D1–D11, (4) bảng ca test của lát đó.
- **Không cho AI sửa domain khi chưa có test đỏ** thể hiện lỗi.
- Sau mỗi lần AI sinh code: chạy `npm run verify`; đọc nhanh diff; từ chối thay đổi lan sang file không liên quan.
- Khi lỗi: **dán thông báo lỗi nguyên văn + test thất bại**, yêu cầu sửa *nguyên nhân gốc*, không bọc `try/catch` che lỗi.

**Mẫu prompt GĐ1 (overlap):**
```
Vai trò: kỹ sư TypeScript. Chỉ làm file src/domain/overlap.ts và overlap.test.ts.
Ràng buộc: hàm thuần, không import ngoài domain; khoảng ngày ISO đóng hai đầu (D1);
BLOCKING_STATUSES lấy từ constants.ts (D2); bỏ qua yêu cầu có cùng id (tự không trùng chính mình).
Viết test TRƯỚC theo bảng UT-OV-01..09 (dán bảng). Chạy test, báo kết quả. Không sửa file khác.
```

**Mẫu prompt GĐ6 (form):**
```
Chỉ làm src/ui/features/borrow/BorrowForm.tsx (+ test). Không tự kiểm tra dữ liệu trong component:
gọi submitRequest() và hiển thị errors qua MESSAGES. Lỗi theo field hiện dưới ô, focus ô lỗi đầu tiên.
Thành công: xóa form, toast "Đã gửi yêu cầu {id}". Dùng đúng data-testid trong mục 4.2.
Viết test CT-FORM-01..08.
```

### 6.4 Quản lý phiên bản

- Nhánh `main` luôn chạy được. Commit nhỏ, thông điệp theo lát: `feat(domain): overlap inclusive + tests`.
- Gắn tag trước khi thử thay đổi lớn (`git tag stable-gd7`) để quay về trong 10 giây khi hỏng.

---

## 7. Chiến lược kiểm thử

### 7.1 Tháp kiểm thử

| Tầng | Công cụ | Phạm vi | Số lượng ước tính | Chạy khi |
|---|---|---|---|---|
| Unit | Vitest | `domain/*` | nhiều nhất (~60–80) | Mỗi lần lưu (watch) |
| Integration | Vitest + `fakeStorage` | `data/*`, `services/*` | ~20–25 | Mỗi commit |
| Component | Vitest + React Testing Library + `user-event` | Form, danh sách, màn quản lý, hộp xác nhận | ~20 | Mỗi commit |
| E2E | Playwright (Chromium; thêm viewport điện thoại) | Kịch bản demo, lưu bền, mobile | ~6–8 | Trước mỗi mốc & trước demo |
| Thủ công | Danh sách 7.7 | Cảm nhận, trình duyệt thật, IME | 1 lượt/mốc | Trước demo |

**Mục tiêu độ phủ:** `domain/` và `services/` ≥ 95% nhánh; toàn dự án ≥ 80%. Độ phủ chỉ là chỉ báo; cái quyết định là các bảng ca dưới đây có đủ không.

### 7.2 Unit: chồng lấn (`overlap.test.ts`)

| ID | Ca | A | B | Kỳ vọng |
|---|---|---|---|---|
| UT-OV-01 | Trùng hoàn toàn | 21–22/11 | 21–22/11 | trùng |
| UT-OV-02 | Chạm đầu mút (D1) | 21–22/11 | 22–23/11 | **trùng** |
| UT-OV-03 | Liền kề, không chạm | 21–21/11 | 22–22/11 | không trùng |
| UT-OV-04 | Chứa nhau | 20–25/11 | 22–23/11 | trùng |
| UT-OV-05 | Cách xa | 10–11/11 | 21–22/11 | không trùng |
| UT-OV-06 | Đối xứng | hoán đổi A,B ở mọi ca trên | | cùng kết quả |
| UT-OV-07 | Qua ranh tháng | 30/11–02/12 | 01/12–01/12 | trùng |
| UT-OV-08 | Qua ranh năm | 31/12/2026–02/01/2027 | 01/01/2027 | trùng |
| UT-OV-09 | **Vét cạn**: mọi cặp khoảng trong cửa sổ 12 ngày | | | kết quả `rangesOverlap` == giao của hai tập ngày (tính độc lập) |
| UT-OV-10 | `findConflict`: khác thiết bị | | | không trùng |
| UT-OV-11 | `findConflict`: yêu cầu cũ là Chờ duyệt / Đã trả / Từ chối | | | không trùng |
| UT-OV-12 | `findConflict`: yêu cầu cũ Đã duyệt / Đang mượn | | | trùng, trả về đúng yêu cầu đó |
| UT-OV-13 | `findConflict` bỏ qua chính `candidate.id` | | | không tự trùng |

### 7.3 Unit: kiểm tra form (`validation.test.ts`)

| ID | Đầu vào | Kỳ vọng |
|---|---|---|
| UT-VA-01 | Tên rỗng / chỉ khoảng trắng | `NAME_REQUIRED` |
| UT-VA-02 | Tên 1 ký tự / 61 ký tự | `NAME_TOO_SHORT` / `NAME_TOO_LONG` |
| UT-VA-03 | `"  An   Nguyễn  "` | Hợp lệ; lưu là `"An Nguyễn"` |
| UT-VA-04 | Tên chứa `<script>` | Hợp lệ (lưu nguyên), kiểm tra riêng ở tầng UI là hiển thị dạng chữ |
| UT-VA-05 | Chưa chọn thiết bị | `DEVICE_REQUIRED` |
| UT-VA-06 | Mã thiết bị không tồn tại (giả mạo) | `DEVICE_NOT_FOUND` |
| UT-VA-07 | TB-04 (Bảo trì) | `DEVICE_UNDER_MAINTENANCE` |
| UT-VA-08 | Thiếu ngày mượn / ngày trả | `START_REQUIRED` / `END_REQUIRED` |
| UT-VA-09 | `2026-02-30`, `2026-13-01`, `abc` | `DATE_INVALID` |
| UT-VA-10 | Trả trước mượn | `END_BEFORE_START` |
| UT-VA-11 | Trả = mượn | **Hợp lệ** |
| UT-VA-12 | Trùng yêu cầu Đã duyệt/Đang mượn cùng thiết bị | `SCHEDULE_CONFLICT` (kèm id, người, khoảng ngày) |
| UT-VA-13 | Trùng yêu cầu Chờ duyệt | Hợp lệ + cảnh báo `OVERLAPS_PENDING` |
| UT-VA-14 | Nhiều lỗi cùng lúc (tên rỗng + trả trước mượn) | Trả **cả hai** lỗi |
| UT-VA-15 | Năm nhuận `2028-02-29` | Hợp lệ; `2027-02-29` → `DATE_INVALID` |

### 7.4 Unit: đổi trạng thái (`statusRules.test.ts`)

Dùng dữ liệu mẫu BTC.

| ID | Ca | Kỳ vọng |
|---|---|---|
| UT-ST-01 | Duyệt YC-101 (TB-02, 22–23/11) | Thành công; trạng thái `approved` |
| UT-ST-02 | Tạo YC-104 (TB-02, 23–24/11) rồi duyệt YC-101, sau đó duyệt YC-104 | Lần duyệt YC-104 **thất bại** `SCHEDULE_CONFLICT`; state không đổi |
| UT-ST-03 | Chuyển yêu cầu Đã duyệt trùng lịch sang Đang mượn khi có yêu cầu khác đang chiếm | `SCHEDULE_CONFLICT` |
| UT-ST-04 | Chuyển sang Từ chối / Đã trả / Chờ duyệt | Không kiểm tra trùng lịch, luôn thành công |
| UT-ST-05 | Duyệt yêu cầu của thiết bị đang Bảo trì | `DEVICE_UNDER_MAINTENANCE` |
| UT-ST-06 | Đặt lại đúng trạng thái hiện tại | Thành công, không thay đổi (idempotent) |
| UT-ST-07 | → Đang mượn: thiết bị thành *Đang mượn*. → Đã trả: thiết bị về *Sẵn sàng* nếu không còn yêu cầu Đang mượn khác; còn thì giữ *Đang mượn*. Thiết bị *Bảo trì* không bị đổi | Đúng như mô tả (D7) |
| UT-ST-08 | → Đã trả gán `returnedAt`; đổi khỏi Đã trả xóa `returnedAt` | Đúng |
| UT-ST-09 | Mã yêu cầu không tồn tại | `REQUEST_NOT_FOUND` |
| UT-ST-10 | YC-103 (Đang mượn) đặt lại Đã duyệt rồi Đang mượn: không tự trùng với chính nó | Thành công |
| UT-ST-11 | Hàm không sửa state đầu vào (so sánh sâu trước/sau) | Không đổi |

### 7.5 Unit: tìm kiếm, lọc, thống kê, ngày, mã

| ID | Ca | Kỳ vọng |
|---|---|---|
| UT-SE-01 | `"TB-03"`, `"tb-03"`, `"tb03"`, `" TB 03 "` | Cùng ra YC-102 |
| UT-SE-02 | `"binh"`, `"Bình"`, `"BÌNH TRẦN"` | Cùng ra YC-102 |
| UT-SE-03 | `"đức"` ↔ `"duc"` (kiểm tra `đ`) với tên "Đức Phạm" | Khớp cả hai chiều |
| UT-SE-04 | Chuỗi rỗng / toàn khoảng trắng | Trả toàn bộ yêu cầu |
| UT-SE-05 | Không khớp | Mảng rỗng (UI hiện trạng thái rỗng) |
| UT-SE-06 | Ký tự đặc biệt `(`, `[`, `*` | Không ném lỗi (không dùng RegExp từ input người dùng) |
| UT-FI-01 | Lọc theo tình trạng Sẵn sàng | TB-01, TB-03, TB-05 |
| UT-FI-02 | Lọc theo loại "Phụ kiện" | TB-02, TB-05 |
| UT-FI-03 | Lọc kết hợp (Sẵn sàng + Phụ kiện) | TB-05 |
| UT-FI-04 | Danh sách loại sinh từ dữ liệu, không trùng, có thứ tự ổn định | Máy ảnh, Phụ kiện, Âm thanh, Ánh sáng (hoặc thứ tự cố định đã chọn) |
| UT-SS-01 | Thống kê dữ liệu mẫu | Sẵn sàng 3, Đang mượn 1, Bảo trì 1 |
| UT-DT-01 | `parse("22/11/2026")` ↔ `format("2026-11-22")` | Hai chiều khớp |
| UT-DT-02 | Ngày không tồn tại | Bị loại |
| UT-ID-01 | `nextRequestSeq=104` → `YC-104`, tăng bộ đếm | Đúng |

### 7.6 Integration: dữ liệu và service

| ID | Ca | Kỳ vọng |
|---|---|---|
| IT-ST-01 | Lần đầu chạy (storage rỗng) | State = seed; đã ghi vào storage |
| IT-ST-02 | Ghi rồi đọc lại | Bằng nhau từng trường |
| IT-ST-03 | JSON hỏng (`"{abc"`) | Nạp seed, bản hỏng được sao lưu, có cảnh báo `STORAGE_CORRUPT`, **không crash** |
| IT-ST-04 | JSON hợp lệ nhưng sai cấu trúc (thiếu `devices`, ngày sai kiểu, trạng thái lạ) | Xử lý như IT-ST-03 |
| IT-ST-05 | `schemaVersion` lạ | Xử lý an toàn (migrate hoặc nạp seed + sao lưu) |
| IT-ST-06 | `setItem` ném lỗi (đầy bộ nhớ) | Ứng dụng vẫn hoạt động trong bộ nhớ; phát tín hiệu `STORAGE_WRITE_FAILED` |
| IT-ST-07 | Thay đổi dữ liệu rồi nạp mẫu → thay đổi tiếp → nạp mẫu lần nữa | Mỗi lần state == seed gốc; hằng số seed không bị nhiễm (chống lỗi tham chiếu chung) |
| IT-ST-08 | Sau nạp mẫu tạo yêu cầu → `YC-104`; tải lại (tạo storage mới từ cùng dữ liệu) và tạo nữa → `YC-105` | Không trùng mã |
| IT-ST-09 | **Seed khớp nguyên văn đề**: 5 thiết bị, 3 yêu cầu, từng ô (kể cả TB-01 "Sẵn sàng" với YC-103 "Đang mượn") | Khớp 100% |
| IT-SV-01 | `submitRequest` hợp lệ | Thêm yêu cầu `pending`, store đổi, storage ghi |
| IT-SV-02 | `submitRequest` lỗi | Store **không đổi**, storage **không ghi** |
| IT-SV-03 | `changeRequestStatus` thành công | Store + storage cập nhật cùng lúc |
| IT-SV-04 | `changeRequestStatus` trùng lịch | Store và storage không đổi |
| IT-SV-05 | Hai lần duyệt liên tiếp hai yêu cầu trùng nhau (mô phỏng bấm nhanh) | Đúng một thành công, một `SCHEDULE_CONFLICT` |
| IT-SV-06 | Sự kiện `storage` từ tab khác | Store cập nhật theo |

### 7.7 Component

| ID | Ca | Kỳ vọng |
|---|---|---|
| CT-DEV-01 | Hiển thị 5 thiết bị đủ mã, tên, tình trạng, ghi chú | Đúng |
| CT-DEV-02 | Lọc tình trạng, lọc loại, kết hợp, "Xóa lọc" | Danh sách đổi theo |
| CT-DEV-03 | Lọc không còn kết quả | Hiện trạng thái rỗng có hướng dẫn |
| CT-DEV-04 | Thẻ TB-04 | Nút Mượn bị vô hiệu + lý do |
| CT-FORM-01 | Gửi form rỗng | Hiện đủ lỗi tại từng ô; focus ô lỗi đầu tiên |
| CT-FORM-02 | Ngày trả trước ngày mượn | Hiện `END_BEFORE_START` dưới ô ngày trả |
| CT-FORM-03 | Gửi hợp lệ | Toast có mã YC mới; form được làm sạch; yêu cầu xuất hiện bên màn quản lý |
| CT-FORM-04 | Gửi trùng lịch với YC-102 (TB-03, 21/11) | Hiện câu `SCHEDULE_CONFLICT` đầy đủ; **không** thêm yêu cầu |
| CT-FORM-05 | Bấm "Mượn" trên thẻ | Ô thiết bị trong form được điền sẵn |
| CT-FORM-06 | Bấm Gửi hai lần liên tiếp | Chỉ một yêu cầu được tạo |
| CT-FORM-07 | Nhập tên chứa `<img onerror=...>` | Hiển thị thành chữ, không thực thi |
| CT-MGR-01 | Bảng hiện 3 yêu cầu mẫu đúng ngày `dd/mm/yyyy` và nhãn trạng thái tiếng Việt | Đúng |
| CT-MGR-02 | Đổi trạng thái hợp lệ | Hàng cập nhật, toast thành công |
| CT-MGR-03 | Đổi sang Đã duyệt gây trùng | Hiện alert tiếng Việt; ô chọn **trở về trạng thái cũ** |
| CT-MGR-04 | Tìm "binh" / "TB-03" / chuỗi không có | Lọc đúng; trạng thái rỗng khi không khớp; xóa tìm kiếm khôi phục đủ danh sách |
| CT-MGR-05 | Nút Nạp mẫu: Hủy | Không thay đổi gì |
| CT-MGR-06 | Nút Nạp mẫu: Xác nhận | Dữ liệu về đúng ban đầu |
| CT-APP-01 | Component con ném lỗi | ErrorBoundary hiện thông báo thân thiện + nút nạp mẫu, không trắng trang |

### 7.8 E2E (Playwright) — bám đúng kịch bản demo của BTC

**E2E-01 → E2E-06 là một kịch bản liền mạch** (mỗi test có thể chạy độc lập nhờ bước nạp mẫu ở đầu).

| ID | Kịch bản | Điểm kiểm tra |
|---|---|---|
| E2E-01 | Nạp dữ liệu mẫu → vào màn quản lý → tìm `TB-03` | Chỉ thấy YC-102 (Bình Trần) |
| E2E-02 | Màn thành viên: chọn TB-05, tên "Dũng Hoàng", mượn 26/11–27/11/2026, gửi | Toast thành công; yêu cầu `YC-104` ở màn quản lý, trạng thái Chờ duyệt |
| E2E-03 | **Trùng lịch (a)**: gửi yêu cầu TB-03 ngày 21/11/2026 → bị từ chối, hiện câu báo trùng YC-102. **Trùng lịch (b)**: tạo yêu cầu TB-02 23–24/11, vào quản lý duyệt YC-101 (thành công) rồi duyệt yêu cầu mới → bị chặn, hiện thông báo | Cả hai có `alert-conflict`; số yêu cầu và trạng thái không đổi |
| E2E-04 | Màn quản lý: đổi YC-101 sang Đã duyệt rồi Đang mượn rồi Đã trả; đổi một yêu cầu khác sang Từ chối | Nhãn đúng; (X1) số liệu thống kê cập nhật theo D7 |
| E2E-05 | **Tải lại trang** sau các bước trên | Mọi yêu cầu, trạng thái, bộ lọc dữ liệu vẫn còn; mã tiếp theo không trùng |
| E2E-06 | Bấm Nạp dữ liệu mẫu → xác nhận | Đúng 5 thiết bị, 3 yêu cầu, trạng thái gốc; tải lại vẫn đúng |
| E2E-07 | Viewport 375×667 chạy lại E2E-01/02 | Không cuộn ngang; mọi nút bấm được |
| E2E-08 | Làm hỏng `localStorage` (ghi chuỗi rác) rồi tải lại | Ứng dụng mở được, hiện cảnh báo, dữ liệu mẫu |

### 7.9 Danh sách kiểm thủ công trước demo

- [ ] Chrome và Edge (máy tính); Safari hoặc Chrome trên điện thoại thật
- [ ] Gõ tiếng Việt có dấu (Telex/VNI) vào ô tên và ô tìm kiếm: không giật, không mất chữ
- [ ] Chỉ dùng bàn phím: Tab qua toàn bộ form, Enter gửi, Esc đóng hộp xác nhận
- [ ] Chọn ngày bằng bộ chọn ngày trên điện thoại; hiển thị đúng `dd/mm/yyyy`
- [ ] Mở hai tab: đổi ở tab này, tab kia cập nhật (hoặc ít nhất không hỏng dữ liệu)
- [ ] Chế độ ẩn danh: không crash; có banner nếu không lưu được
- [ ] Thu nhỏ/phóng to trình duyệt 125%/150%: không vỡ bố cục
- [ ] Chạy trọn kịch bản demo 3 lần liên tiếp, mỗi lần bắt đầu bằng "Nạp dữ liệu mẫu"
- [ ] Bản build (`npm run build && npm run preview`) chạy giống bản dev
- [ ] Ghi kết quả vào `docs/BAO_CAO_KIEM_THU.md` (ngày, commit, ca nào xanh/đỏ)

---

## 8. Cổng chất lượng và Định nghĩa "Xong"

### 8.1 Script (`package.json`)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src e2e",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:cov": "vitest run --coverage",
    "e2e": "playwright test",
    "verify": "npm run typecheck && npm run lint && npm run test && npm run build"
  }
}
```

### 8.2 Một chức năng được coi là **XONG** khi

- [ ] Có dòng tương ứng trong bảng truy vết (mục 1.1) và đã trỏ tới test
- [ ] Test unit/integration/component của nó **xanh**, kể cả ca lỗi và ca biên
- [ ] `npm run verify` xanh
- [ ] Không vi phạm luật tầng; không chuỗi ma thuật; file ≤ ~200 dòng
- [ ] Thông báo lỗi tiếng Việt, rõ ràng, nằm trong `labels.vi.ts`
- [ ] Đã thử tay trên màn hình hẹp
- [ ] Đã commit với thông điệp rõ ràng

### 8.3 Điều kiện được phép demo

`verify` xanh + `e2e` xanh trên bản build + mục 7.9 tích hết + `README.md` ghi rõ D1–D11 và giới hạn đã biết.

---

## 9. Rủi ro và lỗi thường gặp (và cách phòng)

| Rủi ro | Hậu quả | Phòng ngừa |
|---|---|---|
| Dùng `new Date("2026-11-22")` để so sánh | Lệch múi giờ, trùng lịch sai | So sánh **chuỗi ISO** đã kiểm tra; chỉ dùng `Date.UTC` khi cần kiểm tra ngày lịch (`date.ts`) |
| Kiểm tra trùng chỉ ở giao diện | Bấm nhanh/hai tab vẫn lọt | Kiểm tra tại service trên state mới nhất (mục 3.2) |
| Tự suy ra trùng lịch sai khi so với chính nó | Không duyệt/chuyển trạng thái được | `findConflict` bỏ qua `candidate.id` (UT-OV-13, UT-ST-10) |
| Nạp mẫu "sửa" dữ liệu cho hợp lý (TB-01 vs YC-103) | Không khớp BTC | Nạp mẫu nguyên văn; đồng bộ D7 chỉ khi đổi trạng thái (IT-ST-09) |
| Seed là object dùng chung bị sửa trực tiếp | Nạp mẫu không về đúng ban đầu | `createSeed()` trả bản sao mới (IT-ST-07) |
| `localStorage` hỏng/đầy/chế độ riêng tư | Trắng trang, mất dữ liệu | Bao `try/catch`, sao lưu bản hỏng, banner (IT-ST-03..06) |
| Tìm kiếm quên chữ `đ` | "Đức" không tìm được "duc" | `normalize` xử lý `đ` riêng (UT-SE-03) |
| Dùng RegExp từ chuỗi người dùng nhập | Lỗi cú pháp, treo | Chỉ dùng `includes` (UT-SE-06) |
| Mã yêu cầu sinh theo `length+1` | Trùng mã | Bộ đếm `nextRequestSeq` (IT-ST-08) |
| Hiểu sai "chồng lấn" (ngày trả có chiếm không) | Sai với đáp án BTC | Tách vào một hàm + test UT-OV-02; đổi một dòng nếu BTC hiểu khác |
| AI sinh code lan sang file khác / thêm tính năng thừa | Khó sửa, dễ lỗi | Prompt từng lát, `verify` sau mỗi bước, đọc diff (mục 6.3) |
| Quá tải tính năng P2 | Hỏng P0 | Quy tắc cắt phạm vi (mục 1.1, 6.2) |
| Hiểu sai nhãn trạng thái do khác dấu Unicode | So sánh chuỗi thất bại | Dùng mã không dấu trong logic, nhãn chỉ để hiển thị |

### Giới hạn đã biết (ghi vào README)

1. Không có đăng nhập; ai mở được màn quản lý đều đổi được trạng thái (D10).
2. Dữ liệu lưu cục bộ theo từng trình duyệt/thiết bị, không đồng bộ giữa các máy.
3. Ô "Ghi chú" (vd. "Dự kiến trả ngày 22/11") là văn bản tự do, không tham gia kiểm tra trùng lịch (D11).
4. Không chặn ngày mượn trong quá khứ (D8).

---

## 10. Phụ lục

### 10.1 Dữ liệu mẫu BTC (`src/data/seed.ts`) — nguyên văn

```ts
export const createSeed = (): AppState => ({
  schemaVersion: 1,
  devices: [
    { id: 'TB-01', name: 'Máy ảnh Lumix G7',   category: 'Máy ảnh',   status: 'available',   note: 'Kèm pin và thẻ nhớ' },
    { id: 'TB-02', name: 'Chân máy mini',       category: 'Phụ kiện',  status: 'borrowed',    note: 'Dự kiến trả ngày 22/11' },
    { id: 'TB-03', name: 'Micro USB',           category: 'Âm thanh',  status: 'available',   note: 'Dùng ghi âm/phỏng vấn' },
    { id: 'TB-04', name: 'Đèn LED để bàn',      category: 'Ánh sáng',  status: 'maintenance', note: 'Không cho đăng ký mượn' },
    { id: 'TB-05', name: 'Tripod cao',          category: 'Phụ kiện',  status: 'available',   note: 'Có túi đựng' },
  ],
  requests: [
    { id: 'YC-101', borrower: 'An Nguyễn', deviceId: 'TB-02', startDate: '2026-11-22', endDate: '2026-11-23', status: 'pending',   createdAt: '2026-11-01T00:00:00.000Z' },
    { id: 'YC-102', borrower: 'Bình Trần', deviceId: 'TB-03', startDate: '2026-11-21', endDate: '2026-11-21', status: 'approved',  createdAt: '2026-11-01T00:00:00.000Z' },
    { id: 'YC-103', borrower: 'Chi Lê',    deviceId: 'TB-01', startDate: '2026-11-24', endDate: '2026-11-25', status: 'borrowing', createdAt: '2026-11-01T00:00:00.000Z' },
  ],
  nextRequestSeq: 104,
});
```

### 10.2 Hằng số cốt lõi (`src/domain/constants.ts`)

```ts
export const BLOCKING_STATUSES: readonly RequestStatus[] = ['approved', 'borrowing']; // D2

// D4: mặc định cho đổi tự do. Muốn siết thứ tự, thu hẹp bảng này.
export const ALLOWED_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
  pending:   ['pending', 'approved', 'borrowing', 'returned', 'rejected'],
  approved:  ['pending', 'approved', 'borrowing', 'returned', 'rejected'],
  borrowing: ['pending', 'approved', 'borrowing', 'returned', 'rejected'],
  returned:  ['pending', 'approved', 'borrowing', 'returned', 'rejected'],
  rejected:  ['pending', 'approved', 'borrowing', 'returned', 'rejected'],
};

export const NAME_MIN = 2;
export const NAME_MAX = 60;
export const STORAGE_KEY = 'clb-muon-thiet-bi:v1';
```

### 10.3 Chuẩn hóa tìm kiếm (`src/domain/search.ts`)

```ts
export const normalize = (s: string): string =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/đ/gi, 'd')            // đ/Đ không tách được bằng NFD
   .toLowerCase().replace(/\s+/g, ' ').trim();

export const compact = (s: string): string => normalize(s).replace(/[^a-z0-9]/g, '');

export const matchesQuery = (r: BorrowRequest, q: string): boolean => {
  const nq = normalize(q), cq = compact(q);
  if (!nq) return true;
  return normalize(r.borrower).includes(nq)
      || normalize(r.deviceId).includes(nq)
      || (cq !== '' && compact(r.deviceId).includes(cq));
};
```

### 10.4 Mẫu test vét cạn chồng lấn (không cần thư viện ngoài)

```ts
const days = Array.from({ length: 12 }, (_, i) => `2026-11-${String(10 + i).padStart(2, '0')}`);
const setOf = (s: string, e: string) => new Set(days.filter(d => d >= s && d <= e));

it('UT-OV-09: khớp giao hai tập ngày với mọi cặp khoảng', () => {
  for (const s1 of days) for (const e1 of days.filter(d => d >= s1))
  for (const s2 of days) for (const e2 of days.filter(d => d >= s2)) {
    const A = setOf(s1, e1), B = setOf(s2, e2);
    const expected = [...A].some(d => B.has(d));
    expect(rangesOverlap({ start: s1, end: e1 }, { start: s2, end: e2 })).toBe(expected);
  }
});
```

### 10.5 Lệnh khởi tạo gợi ý

```bash
npm create vite@latest clb-muon-thiet-bi -- --template react-ts
cd clb-muon-thiet-bi
npm i -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event \
         @testing-library/jest-dom @playwright/test eslint prettier
npx playwright install chromium
```

---

**Hết tài liệu.** Cập nhật tài liệu này khi có thay đổi quyết định D1–D11 để nó luôn khớp với code.
