# Quy chuẩn Tách Custom Hooks Cho Trang (Page Hook Separation)

Tài liệu này định nghĩa quy chuẩn **bắt buộc** về việc đóng gói và tách biệt toàn bộ Business Logic, State Management, và API Side-effects ra các **Custom React Hooks** trước khi import vào file trang (`page.tsx`) trong toàn bộ ứng dụng Frontend (`hopelib`). Mọi AI Assistant và lập trình viên phải tuân thủ nghiêm ngặt quy tắc này.

---

## 1. Nguyên Tắc Cốt Lõi (Core Principles)

> [!IMPORTANT]
> **QUY TẮC BẮT BUỘC:**
> 1. **CẤM viết Business Logic cồng kềnh trong `page.tsx`**: Không được khai báo hàng chục `useState`, các vòng lặp xử lý dữ liệu phức tạp (như indexing, tree traversal, diffing, filtering), hoặc các chuỗi `useEffect` gọi API trực tiếp trong file `page.tsx`.
> 2. **BẮT BUỘC tách thành Custom Hooks riêng biệt**: Mọi logic về State, Data Fetching, Mutations, Lọc/Tìm kiếm phải được đóng gói thành các hook đặt tại thư mục `features/<feature-name>/hooks/`.
> 3. **`page.tsx` là Pure Orchestrator (Điều phối viên thuần túy)**:
>    - Gọi Custom Hook để nhận về dữ liệu, cờ loading, và các hàm xử lý hành động (action handlers).
>    - Gọi `usePermissions()` để kiểm tra phân quyền nếu cần truyền cờ quyền hạn vào hook.
>    - Quản lý các state giao diện thuần túy mức trang (ví dụ: `isPreviewOpen`, `isModalOpen`).
>    - Truyền state và handlers xuống các Presentation Components con.

---

## 2. Tiêu Chí Đánh Giá File `page.tsx`

| Tiêu chí | Ngưỡng chuẩn | Hành động khi vi phạm |
| :--- | :--- | :--- |
| **Số lượng `useState` trong `page.tsx`** | Tối đa **2 - 4 states** (chỉ cho UI popup/modal) | Tách toàn bộ state dữ liệu và business state sang Custom Hook. |
| **Số lượng `useEffect` trong `page.tsx`** | **0 `useEffect`** (lý tưởng) | Mọi lifecycle fetch API và đồng bộ dữ liệu phải nằm trong Hook. |
| **Các hàm xử lý API / Mutation** | Phải nằm trong Custom Hook | Không viết hàm `handleSave`, `handleDelete` gọi API trực tiếp trong `page.tsx`. |
| **Độ dài file `page.tsx`** | Dưới **150 - 200 dòng code** | Rà soát và tách ngay Logic sang Hook, tách JSX sang Components. |

---

## 3. Cấu Trúc Thư Mục Chuẩn (Hooks Architecture)

Mọi thư mục tính năng `hopelib/features/<feature-name>/hooks/` được tổ chức như sau:

```
hopelib/features/<feature-name>/
├── hooks/
│   ├── use<Feature>Data.ts          # Fetch API, phân trang, caching
│   ├── use<Feature>Filter.ts        # Search, filter, sorting, tree expansion
│   ├── use<Feature>Mutations.ts     # Save, create, update, delete actions
│   ├── use<Feature>Management.ts    # Composite Hook kết hợp các hook trên (nếu cần)
│   └── index.ts                     # Re-export tất cả hooks
├── components/                      # UI Components đã tách
├── services/                        # API calls
├── types/                           # TypeScript interfaces
└── index.ts                         # Re-export tập trung cho page.tsx
```

---

## 4. Quy Chuẩn Thiết Kế Custom Hook

Mỗi hook phải tuân thủ:
1. **Có Interface Props & Return rõ ràng**:
   - `Use<Feature>Props`: Các tham số đầu vào (ví dụ: `canAssign?: boolean`, `roleId?: string`).
   - `Use<Feature>Return`: Kiểu dữ liệu trả về với các nhóm thuộc tính rõ ràng:
     - Nhóm Dữ liệu (Data): `data`, `roles`, `tree`, `counts`.
     - Nhóm Trạng thái (Loading/Error): `isLoading`, `isSaving`, `error`.
     - Nhóm Hành động (Action handlers): `handleSelect`, `handleSave`, `handleToggle`.
2. **Khởi đầu với `"use client"`**: Hook chạy trên Client Component.
3. **Tập trung hóa Export**: Re-export qua `features/<feature-name>/hooks/index.ts` và `features/<feature-name>/index.ts`.

```tsx
// Ví dụ: hopelib/features/navigation/hooks/useRoleNavigations.ts
export interface UseRoleNavigationsProps {
  canAssign?: boolean;
}

export interface UseRoleNavigationsReturn {
  roles: RoleItem[];
  selectedRole: RoleItem | null;
  isLoading: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  handleSelectRole: (role: RoleItem) => void;
  handleSaveChanges: () => Promise<void>;
  // ...
}

export function useRoleNavigations(props: UseRoleNavigationsProps): UseRoleNavigationsReturn {
  // Toàn bộ logic quản lý state, API, diff ở đây
}
```

---

## 5. Ví Dụ Điển Hình: Case Study Quản Lý Menu Điều Hướng

### ❌ KHÔNG NÊN LÀM: Viết toàn bộ State và API trong `page.tsx` (> 700 dòng):
```tsx
export default function Page() {
  const [roles, setRoles] = useState([]);
  const [tree, setTree] = useState([]);
  const [initialLeafIds, setInitialLeafIds] = useState(new Set());
  const [currentLeafIds, setCurrentLeafIds] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIds, setExpandedIds] = useState({});
  // ... hơn 10 useMemo, useCallback, useEffect tính toán diff, traversal, save API
  // Khiến page.tsx dài hàng trăm dòng khó bảo trì
}
```

### ✅ ĐÚNG: Đóng gói sang Custom Hook và gọi tại `page.tsx`:

1. **Các Hooks chuyên biệt trong `features/navigation/hooks/`**:
   - `useRoleNavigations.ts`: Quản lý danh sách vai trò, menu lá đã gán, tri-state checkbox, tính diff và gọi batch save API.
   - `useNavigationTreeFilter.ts`: Quản lý từ khóa tìm kiếm, lọc đệ quy đa tầng, đóng/mở nhánh cây.
   - `useRoleNavigationManagement.ts`: Composite hook kết hợp trọn vẹn nghiệp vụ.

2. **File `page.tsx` cực kỳ tinh gọn (~100 dòng)**:
```tsx
"use client";

import React, { useState } from "react";
import {
  RoleNavigationList,
  NavigationTreeViewer,
  RoleNavigationSaveBar,
  useRoleNavigationManagement,
} from "@/features/navigation";
import { usePermissions } from "@/features/auth";

export default function RoleNavigationManagementPage() {
  const { hasPermission } = usePermissions();
  const canAssign = hasPermission("ROLE_NAVIGATION_ASSIGN");

  // Modals state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Hook quản lý toàn bộ nghiệp vụ
  const {
    roles,
    selectedRole,
    filteredTree,
    isLoading,
    isSaving,
    hasChanges,
    handleSelectRole,
    handleSaveChanges,
    // ...
  } = useRoleNavigationManagement({ canAssign });

  return (
    <div className="space-y-6">
      <Header />
      <div className="grid grid-cols-12 gap-6">
        <RoleNavigationList roles={roles} selectedRole={selectedRole} />
        <NavigationTreeViewer tree={filteredTree} />
      </div>
      <RoleNavigationSaveBar hasChanges={hasChanges} onSave={handleSaveChanges} />
    </div>
  );
}
```

---

## 6. Checklist Tự Kiểm Tra Trước Khi Hoàn Thành Task

- [ ] File `page.tsx` có đang chứa quá 4 `useState` hoặc bất kỳ `useEffect` nào không?
- [ ] Logic tính toán dữ liệu, API calls đã được đóng gói thành Custom Hook chưa?
- [ ] Hook đã được đặt trong `features/<feature-name>/hooks/` chưa?
- [ ] Hook đã có interface `Props` và `Return` tường minh bằng TypeScript chưa?
- [ ] Đã re-export hook qua file `features/<feature-name>/index.ts` chưa?
- [ ] File `page.tsx` có duy trì dưới ngưỡng **150 - 200 dòng** không?
