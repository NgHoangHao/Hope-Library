# Quy chuẩn Tách Component và Cấu trúc Trang (Page Component Modularization)

Tài liệu này định nghĩa quy chuẩn **bắt buộc** về việc tách nhỏ các thành phần giao diện (Components) trước khi đưa vào các file trang (`page.tsx`) trong toàn bộ ứng dụng Frontend (`hopelib`). Mọi AI Assistant và lập trình viên phải tuân thủ nghiêm ngặt quy tắc này.

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)

> [!IMPORTANT]
> **QUY TẮC BẮT BUỘC:**
> 1. **CẤM viết file `page.tsx` nguyên khối (monolithic)**: Không được viết toàn bộ cấu trúc giao diện lớn, các Modal, Form, Toolbar, Table, List, Checkbox logic trực tiếp trong một file `page.tsx` duy nhất.
> 2. **BẮT BUỘC tách thành các Components riêng biệt**: Mọi khối giao diện có tính logic, hiển thị độc lập hoặc tái sử dụng phải được tách thành các file component đặt tại thư mục `features/<feature-name>/components/` (hoặc `components/` nội bộ).
> 3. **`page.tsx` chỉ đóng vai trò là "Orchestrator" (Điều phối viên)**:
>    - Quản lý state tổng thể của trang, query parameters.
>    - Gọi API / hooks lấy dữ liệu (`useEffect`, `usePermissions`, API services).
>    - Định nghĩa các hàm xử lý sự kiện (handlers) và truyền props xuống các component con.
>    - Ghép nối các component lại thành layout hoàn chỉnh.

---

## 2. Tiêu Chí Đánh Giá File `page.tsx`

| Tiêu chí | Ngưỡng chuẩn | Hành động khi vi phạm |
| :--- | :--- | :--- |
| **Độ dài file `page.tsx`** | Dưới **250 dòng code** | Phải rà soát và tách ngay các khối JSX, Modal, Toolbar thành component con. |
| **Khối Modal / Dialog** | Phải nằm ở file riêng (`*Modal.tsx`) | Không nhúng thẻ modal dài trực tiếp vào cuối `page.tsx`. |
| **Thanh công cụ / Tìm kiếm / Lọc** | Tách thành `*Toolbar.tsx` hoặc `*FilterBar.tsx` | Không viết các input search, dropdown filter phức tạp inline. |
| **Bảng / Danh sách dữ liệu** | Tách thành `*Table.tsx` hoặc `*List.tsx` | Mỗi dòng/item nếu có logic phức tạp tiếp tục tách thành `*Item.tsx` hoặc `*Row.tsx`. |
| **Thanh tác vụ cố định (Sticky Action Bar)** | Tách thành `*ActionBar.tsx` hoặc `*SaveBar.tsx` | Đưa logic diff và nút Save/Undo ra component riêng. |

---

## 3. Cấu Trúc Thư Mục Chuẩn (Feature-Based Architecture)

Mọi module tính năng trong `hopelib/features/<feature-name>` tuân thủ cấu trúc sau:

```
hopelib/features/<feature-name>/
├── components/                      # Tất cả các React Component đã tách
│   ├── <Feature>List.tsx            # Component danh sách / bảng
│   ├── <Feature>Item.tsx            # Component từng item con (nếu phức tạp)
│   ├── <Feature>Toolbar.tsx         # Thanh tìm kiếm, lọc, nút hành động
│   ├── <Feature>CreateModal.tsx     # Modal tạo mới / form
│   ├── <Feature>DetailModal.tsx     # Modal xem chi tiết
│   └── <Feature>SaveBar.tsx         # Thanh lưu thay đổi (nếu có)
├── hooks/                           # Custom React Hooks nội bộ
├── services/                        # Các hàm fetch API (tuân thủ ApiResponse)
├── types/                           # TypeScript interfaces / types
└── index.ts                         # Re-export tập trung để page.tsx import
```

Và tại file Route:
```
hopelib/app/(dashboard)/<route>/
└── page.tsx                         # File trang điều phối, import từ @/features/<feature-name>
```

---

## 4. Quy Chuẩn Thiết Kế Props Cho Component Được Tách

Mỗi component con được tách ra phải có:
1. **Interface Props rõ ràng**: Khai báo rõ ràng kiểu dữ liệu, các callback events bắt đầu bằng tiền tố `on...` (ví dụ: `onSelectRole`, `onToggleCheck`, `onSave`).
2. **Tránh Prop Drilling không cần thiết**: Chỉ truyền các dữ liệu và handler cần thiết.
3. **Export rõ ràng**: Xuất khẩu cả Component và Interface Props qua `index.ts`.

```tsx
// Ví dụ: hopelib/features/navigation/components/RoleNavigationSaveBar.tsx
export interface RoleNavigationSaveBarProps {
  hasChanges: boolean;
  addedCount: number;
  removedCount: number;
  isSaving: boolean;
  canAssign?: boolean;
  onReset: () => void;
  onSave: () => void;
}

export function RoleNavigationSaveBar({
  hasChanges,
  addedCount,
  removedCount,
  isSaving,
  canAssign = true,
  onReset,
  onSave,
}: RoleNavigationSaveBarProps) {
  // Giao diện Action Bar
}
```

---

## 5. Ví Dụ Điển Hình: Case Study Quản Lý Menu Điều Hướng

### ❌ KHÔNG NÊN LÀM (Monolithic `page.tsx` > 1500 dòng):
```tsx
// page.tsx ôm đồm tất cả
export default function MenuManagementPage() {
  // 50 dòng state...
  // 100 dòng logic...
  return (
    <div>
      {/* 200 dòng JSX cho cột trái danh sách Role */}
      <div className="left-col">...</div>

      {/* 400 dòng JSX cho Cây Checkbox và render đệ quy */}
      <div className="right-col">...</div>

      {/* 100 dòng JSX cho Sticky Diff Action Bar */}
      <div className="bottom-bar">...</div>

      {/* 150 dòng JSX cho Sidebar Preview Modal */}
      <div className="preview-modal">...</div>

      {/* 150 dòng JSX cho Clone Modal */}
      <div className="clone-modal">...</div>
    </div>
  );
}
```

### ✅ ĐÚNG: Tách thành các Component chuyên biệt:

1. **Các component trong `features/navigation/components/`**:
   - `RoleNavigationList.tsx`: Quản lý danh sách vai trò, tìm kiếm, badges vai trò.
   - `NavigationTreeViewer.tsx`: Khung xem cây menu, tìm kiếm menu, các nút Mở rộng/Thu gọn/Chọn hết.
   - `NavigationTreeNode.tsx`: Render từng nút cây đệ quy kèm icon và nhãn URL/Code.
   - `TriStateCheckbox.tsx`: Checkbox 3 trạng thái độc lập.
   - `RoleNavigationSaveBar.tsx`: Thanh sticky lưu thay đổi diff.
   - `NavigationSidebarPreviewModal.tsx`: Modal mô phỏng sidebar thực tế.
   - `CloneNavigationModal.tsx`: Modal sao chép quyền.
   - `ConfirmDiscardModal.tsx`: Modal xác nhận rời vai trò.

2. **File `page.tsx` chỉ còn điều phối tinh gọn**:
```tsx
// app/(dashboard)/system/menus/page.tsx (~200 dòng)
"use client";

import React, { useState, useEffect } from "react";
import {
  RoleNavigationList,
  NavigationTreeViewer,
  RoleNavigationSaveBar,
  NavigationSidebarPreviewModal,
  CloneNavigationModal,
  ConfirmDiscardModal,
} from "@/features/navigation";

export default function RoleNavigationManagementPage() {
  // Quản lý state & API effects...

  return (
    <div className="space-y-6 pb-24">
      {/* Header trang */}
      <PageHeader ... />

      {/* Bố cục 2 cột gọn gàng */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4">
          <RoleNavigationList ... />
        </div>
        <div className="lg:col-span-8">
          <NavigationTreeViewer ... />
        </div>
      </div>

      {/* Thanh lưu thay đổi */}
      <RoleNavigationSaveBar ... />

      {/* Các Modals */}
      <NavigationSidebarPreviewModal ... />
      <CloneNavigationModal ... />
      <ConfirmDiscardModal ... />
    </div>
  );
}
```

---

## 6. Checklist Tự Kiểm Tra Trước Khi Hoàn Thành Code

- [ ] File `page.tsx` có đang vượt quá 250 - 300 dòng không?
- [ ] Các modal hoặc popup lớn đã được tách thành file riêng chưa?
- [ ] Các danh sách hoặc bảng lặp phức tạp đã được tách ra chưa?
- [ ] Các components con đã được đặt đúng thư mục `features/<module>/components/` chưa?
- [ ] Đã re-export các component qua file `features/<module>/index.ts` chưa?
- [ ] Props của từng component đã có TypeScript interface tường minh chưa?
