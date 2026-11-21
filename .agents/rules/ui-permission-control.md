# Quy chuẩn Ẩn / Hiện Button Theo Quyền Hạn (UI Permission Control)

Tài liệu này định nghĩa quy chuẩn **bắt buộc** về việc kiểm soát hiển thị các nút bấm (Button), thanh tác vụ (Action Toolbar), menu hoặc các khối giao diện theo quyền hạn (Permission / Role) trên toàn bộ ứng dụng Frontend (`hopelib`). Mọi AI Assistant và lập trình viên phải tuân thủ nghiêm ngặt quy tắc này.

---

## 1. Nguyên Tắc Cốt Lõi

> [!IMPORTANT]
> **QUY TẮC BẮT BUỘC:**
> 1. Mọi Client Component (`"use client"`) cần ẩn/hiện nút (button) hoặc kiểm soát tương tác theo quyền **BẮT BUỘC sử dụng React Hook `usePermissions()`** từ module `@/features/auth`.
> 2. **CẤM** kiểm tra thủ công vai trò cứng (hardcoded roles) như `user?.role === 'ADMIN'`, `roles.includes('LIBRARIAN')` rải rác trong JSX để ẩn/hiện nút thao tác.
> 3. **CẤM** truy xuất trực tiếp `localStorage.getItem("hope_permissions")` hoặc `localStorage.getItem("hope_user")` trong component để quyết định hiển thị nút bấm. Luôn sử dụng state phản ứng (reactive) từ `usePermissions()`.

---

## 2. Bản Chất và Cơ Chế Hoạt Động của `usePermissions()`

- **Import chuẩn**:
  ```tsx
  import { usePermissions } from "@/features/auth";
  ```
- **File nguồn**: [`hopelib/features/auth/hooks/usePermissions.ts`](file:///e:/Individual-Project/hopelib/features/auth/hooks/usePermissions.ts)
- **Cơ chế**:
  - Khi người dùng đăng nhập thành công, hệ thống tự động gọi API lấy danh sách quyền theo role và lưu vào `localStorage`.
  - Hook `usePermissions()` tự động lắng nghe sự kiện đồng bộ `permissionsUpdated` và `storage` để cập nhật trạng thái ngay lập tức trên UI.
  - **Cơ chế ADMIN Bypass**: Nếu người dùng sở hữu vai trò `ADMIN`, tất cả các hàm `hasPermission`, `hasAnyPermission`, `hasAllPermissions` sẽ **luôn trả về `true`**. Lập trình viên không cần viết thêm điều kiện `|| isAdmin`.

---

## 3. Các Hàm Tiện Ích Trong `usePermissions()`

| Thuộc tính / Hàm | Kiểu trả về | Mô tả |
| :--- | :--- | :--- |
| `hasPermission(code)` | `boolean` | Kiểm tra người dùng có một quyền cụ thể (ví dụ: `'BOOK_CREATE'`). |
| `hasAnyPermission(codes[])` | `boolean` | Kiểm tra người dùng có **ít nhất một** quyền trong danh sách. |
| `hasAllPermissions(codes[])` | `boolean` | Kiểm tra người dùng có **đủ tất cả** các quyền trong danh sách. |
| `isAdmin` | `boolean` | `true` nếu người dùng mang vai trò quản trị viên `ADMIN`. |
| `isLoading` | `boolean` | `true` trong quá trình đọc quyền khởi tạo ban đầu. |
| `permissions` | `string[]` | Danh sách toàn bộ mã quyền người dùng đang sở hữu. |
| `refreshPermissions()` | `Promise<string[]>` | Gọi backend cập nhật lại danh sách quyền mới nhất. |

---

## 4. Chuẩn Code Mẫu (Good vs Bad Practices)

### ✅ ĐÚNG: Sử dụng `usePermissions()`

#### Ví dụ 1: Ẩn/Hiện nút đơn lẻ theo 1 quyền
```tsx
"use client";

import { usePermissions } from "@/features/auth";
import { Plus } from "lucide-react";

export function BookToolbar() {
  const { hasPermission } = usePermissions();

  return (
    <div className="flex items-center gap-3">
      {hasPermission("BOOK_CREATE") && (
        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm sách mới</span>
        </button>
      )}
    </div>
  );
}
```

#### Ví dụ 2: Kiểm tra nhiều quyền kết hợp
```tsx
"use client";

import { usePermissions } from "@/features/auth";

export function LoanActionCell({ loanId }: { loanId: string }) {
  const { hasPermission, hasAnyPermission } = usePermissions();

  return (
    <div className="flex items-center gap-2">
      {/* Chỉ hiện nút sửa nếu có quyền LOAN_UPDATE */}
      {hasPermission("LOAN_UPDATE") && (
        <button onClick={() => handleEdit(loanId)} className="text-blue-600">
          Gia hạn
        </button>
      )}

      {/* Hiện menu nâng cao nếu có ít nhất một trong hai quyền */}
      {hasAnyPermission(["LOAN_DELETE", "LOAN_UPDATE"]) && (
        <button onClick={() => handleMore(loanId)} className="text-neutral-500">
          Tác vụ khác
        </button>
      )}
    </div>
  );
}
```

---

### ❌ SAI: Các trường hợp vi phạm quy chuẩn

```tsx
// ❌ CẤM: Hardcode kiểm tra tên role thay vì kiểm tra permission
{user?.roles?.includes("ADMIN") || user?.roles?.includes("LIBRARIAN") ? (
  <button>Thêm sách</button>
) : null}

// ❌ CẤM: Tự đọc localStorage trực tiếp trong component
{JSON.parse(localStorage.getItem("hope_permissions") || "[]").includes("BOOK_CREATE") && (
  <button>Thêm sách</button>
)}

// ❌ CẤM: Viết thêm điều kiện `|| isAdmin` dư thừa (hasPermission đã tích hợp sẵn ADMIN)
{(hasPermission("BOOK_CREATE") || isAdmin) && (
  <button>Thêm sách</button>
)}
```

---

## 5. Bảng Tra Cứu Mã Quyền (Permission Codes Reference)

Khi triển khai nút bấm cho từng tính năng, tra cứu mã quyền chuẩn theo danh mục dưới đây:

### 1. Quản lý Sách (Books)
- `BOOK_CREATE`: Nút tạo mới sách, thêm bản sao.
- `BOOK_READ`: Xem danh sách, xem chi tiết sách.
- `BOOK_UPDATE`: Nút chỉnh sửa sách, cập nhật thông tin bản sao.
- `BOOK_DELETE`: Nút xóa sách.

### 2. Quản lý Mượn / Trả Sách (Loans)
- `LOAN_CREATE`: Nút tạo phiếu mượn sách.
- `LOAN_READ`: Xem danh sách phiếu mượn, chi tiết phiếu.
- `LOAN_UPDATE`: Nút duyệt mượn, trả sách, gia hạn phiếu mượn.
- `LOAN_DELETE`: Nút hủy hoặc xóa phiếu mượn.

### 3. Quản lý Tác giả (Authors)
- `AUTHOR_CREATE`: Nút thêm tác giả.
- `AUTHOR_READ`: Xem danh sách, chi tiết tác giả.
- `AUTHOR_UPDATE`: Nút cập nhật thông tin tác giả.
- `AUTHOR_DELETE`: Nút xóa tác giả.

### 4. Quản lý Thể loại sách (Categories)
- `CATEGORY_CREATE`: Nút thêm thể loại.
- `CATEGORY_READ`: Xem danh mục thể loại.
- `CATEGORY_UPDATE`: Nút chỉnh sửa thể loại.
- `CATEGORY_DELETE`: Nút xóa thể loại.

### 5. Quản lý Người dùng & Hồ sơ (Users & Profile)
- `USER_READ`: Xem danh sách tài khoản thành viên/độc giả.
- `USER_CREATE`: Thêm tài khoản nhân viên/độc giả.
- `USER_UPDATE`: Cập nhật trạng thái, khóa/mở khóa tài khoản.
- `USER_DELETE`: Xóa tài khoản.
- `USER_PROFILE_READ`: Xem thông tin cá nhân.
- `USER_PROFILE_UPDATE`: Cập nhật thông tin cá nhân.

### 6. Phân quyền & Điều hướng (Roles, Permissions & Navigations)
- `ROLE_READ`, `ROLE_CREATE`, `ROLE_UPDATE`, `ROLE_DELETE`: Quản lý vai trò.
- `PERMISSION_READ`, `PERMISSION_CREATE`, `PERMISSION_UPDATE`, `PERMISSION_DELETE`: Quản trị quyền hạn.
- `ROLE_PERMISSION_ASSIGN`: Nút phân quyền cho vai trò.
- `ROLE_NAVIGATION_ASSIGN`: Nút phân quyền menu cho vai trò.
- `AUDIT_LOG_READ`, `AUDIT_LOG_EXPORT`: Xem và xuất nhật ký hệ thống.
