# Hope Library Monorepo - AI Coding Rules

Dự án gồm 2 phần chính:
- `hope-library`: Backend xây dựng bằng NestJS, TypeORM, Redis, SQL Server.
- `hopelib`: Frontend xây dựng bằng Next.js (App Router), TypeScript, Tailwind CSS.

---

## 📌 QUY TẮC BẮT BUỘC VỀ API RESPONSE (`ApiResponse`)

Chi tiết đầy đủ xem tại: [.agents/rules/api-response-contract.md](file:///.agents/rules/api-response-contract.md).

### 1. Phía Backend (`hope-library`):
- Mọi endpoint trả về dữ liệu thành công **BẮT BUỘC** bọc trong class `ApiResponse` (`src/common/api.response.ts`):
  - `return ApiResponse.success(data, message);` (200 OK)
  - `return ApiResponse.created(data, message);` (201 Created)
- Ngoại lệ ném qua `AppException` (`src/common/app.exception.ts`).
- Cấu trúc JSON trả về client:
  ```json
  {
    "statusCode": 200,
    "message": "...",
    "response": { ... },
    "timestamp": "..."
  }
  ```

### 2. Phía Frontend (`hopelib`):
- **CẤM** kiểm tra `if (!result.success)` hay `if (result.success)` vì Backend `ApiResponse` **KHÔNG CÓ trường `success`**.
- Kiểm tra lỗi qua `!response.ok || (result.statusCode && result.statusCode >= 400)`.
- **Dữ liệu trả về nằm trong key `response`**: Luôn trích xuất data bằng `result.response` (fallback: `result.response ?? result.data ?? result`).

---

## 📌 QUY TẮC BẮT BUỘC VỀ ẨN / HIỆN BUTTON THEO QUYỀN HẠN (`usePermissions`)

Chi tiết đầy đủ xem tại: [.agents/rules/ui-permission-control.md](file:///.agents/rules/ui-permission-control.md).

- **BẮT BUỘC dùng React Hook `usePermissions()`** từ module `@/features/auth` khi cần ẩn/hiện hoặc kiểm soát tương tác nút bấm:
  ```tsx
  import { usePermissions } from "@/features/auth";

  const { hasPermission, hasAnyPermission } = usePermissions();

  {hasPermission("BOOK_CREATE") && <button>Thêm sách</button>}
  ```
- **CẤM** hardcode kiểm tra role thủ công như `user?.roles?.includes('ADMIN')` hay `role === 'LIBRARIAN'`.
- **CẤM** đọc trực tiếp `localStorage.getItem("hope_permissions")` trong component.
- Vai trò `ADMIN` đã được tích hợp tự động bypass toàn quyền trong `hasPermission`, không cần viết thêm điều kiện `|| isAdmin`.

---

## 📌 QUY TẮC BẮT BUỘC VỀ TÁCH COMPONENT CHO TRANG (`page.tsx`)

Chi tiết đầy đủ xem tại: [.agents/rules/page-component-modularization.md](file:///.agents/rules/page-component-modularization.md).

- **CẤM viết file `page.tsx` nguyên khối (monolithic)**: Không được viết toàn bộ cấu trúc giao diện lớn, các Modal, Form, Toolbar, Table, List, Checkbox logic trực tiếp trong một file `page.tsx` duy nhất.
- **BẮT BUỘC tách thành các Components riêng biệt**: Mọi khối giao diện có tính logic, hiển thị độc lập hoặc tái sử dụng phải được tách thành các file component đặt tại thư mục `features/<feature-name>/components/` (hoặc `components/` nội bộ).
- **`page.tsx` chỉ đóng vai trò là "Orchestrator" (Điều phối viên)**:
  - Quản lý state tổng thể của trang, query parameters.
  - Gọi API / hooks lấy dữ liệu (`useEffect`, `usePermissions`, API services).
  - Định nghĩa các hàm xử lý sự kiện (handlers) và truyền props xuống các component con.
  - Ghép nối các component lại thành layout hoàn chỉnh.
- **Độ dài chuẩn của `page.tsx`**: Duy trì dưới **250 dòng code**, tách toàn bộ các Modal, Toolbar, Bảng/Cây dữ liệu ra file riêng.
- **Tập trung hóa Export**: Re-export các component qua `features/<feature-name>/index.ts` để `page.tsx` import sạch đẹp.

---

## 📌 QUY TẮC BẮT BUỘC VỀ TÁCH CUSTOM HOOKS CHO TRANG (`page.tsx`)

Chi tiết đầy đủ xem tại: [.agents/rules/page-hook-separation.md](file:///.agents/rules/page-hook-separation.md).

- **CẤM viết Business Logic, State Machine, chuỗi `useEffect` gọi API trực tiếp trong `page.tsx`**.
- **BẮT BUỘC đóng gói toàn bộ Logic vào Custom Hooks** đặt tại thư mục `features/<feature-name>/hooks/`:
  - Hook quản lý dữ liệu, API query & mutations (`use<Feature>Data`, `use<Feature>Mutations`).
  - Hook lọc, tìm kiếm, sắp xếp (`use<Feature>Filter`).
  - Composite Hook (`use<Feature>Management`) kết hợp trọn vẹn nghiệp vụ để `page.tsx` chỉ cần gọi 1 hook.
- **`page.tsx` chỉ đóng vai trò Pure Orchestrator**:
  - Chỉ gọi Custom Hook để nhận dữ liệu và handlers.
  - Quản lý tối đa 2 - 4 states giao diện đơn giản (ví dụ: `isOpenModal`).
  - **0 `useEffect`** trong `page.tsx` (toàn bộ lifecycle đẩy vào hook).
  - Độ dài chuẩn của `page.tsx` sau khi tách Hook & Component: **dưới 150 - 200 dòng code**.
- **Tập trung hóa Export**: Re-export các hooks qua `features/<feature-name>/hooks/index.ts` và `features/<feature-name>/index.ts`.


