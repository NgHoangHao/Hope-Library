# 📐 UI Coding Guidelines & Architecture Rules — Hope Library

Tài liệu này định nghĩa quy chuẩn kiến trúc và nguyên tắc viết UI áp dụng cho toàn bộ dự án **Hope Library** (Next.js App Router + TypeScript + Tailwind CSS). Mọi thành viên và AI Assistant phải tuân thủ nghiêm ngặt các quy tắc này.

---

## 1. 📁 Cấu trúc thư mục chuẩn (Project Directory Structure)

```text
hope-library/
├── app/
│   ├── (landing)/                # Route group cho khách/người dùng công cộng
│   │   ├── page.tsx              # Landing Home Page
│   │   ├── about/page.tsx        # Trang giới thiệu
│   │   ├── books/page.tsx        # Danh mục sách công cộng
│   │   └── layout.tsx            # Header, Footer chung cho landing
│   │
│   ├── (auth)/                   # Route group cho xác thực
│   │   ├── login/page.tsx        # Đăng nhập
│   │   ├── register/page.tsx     # Đăng ký
│   │   └── layout.tsx            # Layout tối giản (card căn giữa, background)
│   │
│   ├── (dashboard)/              # Route group quản trị / nghiệp vụ thư viện
│   │   ├── dashboard/page.tsx    # Dashboard tổng quan thống kê
│   │   ├── books/page.tsx        # Quản lý sách & bản sao (admin/librarian)
│   │   ├── users/page.tsx        # Quản lý bạn đọc / tài khoản
│   │   ├── roles/page.tsx        # Phân quyền & vai trò
│   │   └── layout.tsx            # Sidebar, Topbar, Main Shell dashboard
│   │
│   ├── layout.tsx                # Root layout (HTML, Font, Global Providers)
│   └── globals.css               # Tailwind CSS v4 & theme variables
│
├── components/                   # UI components dùng chung toàn dự án (Domain-agnostic)
│   ├── ui/                       # Atomic/primitive components (Button, Input, Modal, Badge...)
│   ├── layouts/                  # Layout shells/wrappers (Header, Footer, Sidebar, PageContainer)
│   └── common/                   # Compound UI dùng chung (EmptyState, ConfirmDialog, Pagination...)
│
├── features/                     # Feature-First / Domain-driven modules
│   ├── auth/                     # Xác thực, phân quyền truy cập
│   ├── book/                     # Nghiệp vụ sách, chi tiết sách, tìm kiếm
│   ├── author/                   # Nghiệp vụ tác giả
│   ├── category/                 # Nghiệp vụ danh mục thể loại
│   ├── user/                     # Thông tin người dùng, hồ sơ cá nhân
│   ├── role/                     # Phân quyền vai trò, permissions
│   ├── navigation/               # Menu navigation, breadcrumbs, search command
│   └── borrowing/                # Mượn/trả sách, phiếu mượn, quá hạn
│
├── lib/                          # Tiện ích chung (utils, cn, api client, formatters)
├── providers/                    # React Context Providers (Theme, Query, Auth, Toast)
├── hooks/                        # Custom hooks dùng chung (useMediaQuery, useDebounce...)
├── types/                        # Global TypeScript types & API contract interfaces
├── config/                       # Cấu hình site, routes, role permissions, hằng số tĩnh
├── public/                       # Static assets (images, logos, icons)
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 2. 🏛️ Phân vùng trách nhiệm (Architectural Responsibilities)

### 2.1. Thư mục `app/` (Routing Layer — "Thin Pages")
- **Nguyên tắc "Thin Page"**: `page.tsx` và `layout.tsx` chỉ đóng vai trò **định tuyến (routing)**, nhận params/searchParams, và import/ghép nối các component từ `features/` hoặc `components/layouts/`.
- ❌ **CẤM**:
  - Không viết code giao diện phức tạp (> 60 dòng) trực tiếp trong `page.tsx`.
  - Không nhúng logic nghiệp vụ lớn, gọi API trực tiếp hoặc xử lý state cồng kềnh trong `page.tsx`.
- ✅ **NÊN**:
  - Server Component mặc định để fetch dữ liệu khởi tạo (SSR/RSC) hoặc metadata.
  - Render một feature container chính (VD: `<BookListingView />`, `<DashboardOverview />`).

### 2.2. Thư mục `components/` (Shared UI Layer)
Chứa các thành phần **KHÔNG phụ thuộc vào nghiệp vụ cụ thể (Domain-agnostic)**:
- **`components/ui/`**: Các UI primitives nhỏ nhất (nền tảng Design System theo chuẩn shadcn/ui/Radix):
  - Ví dụ: `Button`, `Input`, `Dialog`, `Select`, `DropdownMenu`, `Card`, `Badge`, `Skeleton`.
  - Không chứa dữ liệu cố định (hardcoded data) của sách, người dùng hay tác giả.
- **`components/layouts/`**: Khung sườn bố cục dùng chung:
  - Ví dụ: `LandingHeader`, `LandingFooter`, `DashboardSidebar`, `DashboardNavbar`, `PageHeader`.
- **`components/common/`**: Các component ghép có thể tái sử dụng ở nhiều nơi:
  - Ví dụ: `Pagination`, `DataTable`, `EmptyState`, `ConfirmModal`, `SearchBar`, `StatusBadge`.

### 2.3. Thư mục `features/` (Feature-Driven / Business Domain)
Mỗi feature đại diện cho một domain nghiệp vụ độc lập. Cấu trúc chuẩn bên trong mỗi folder feature:

```text
features/<feature-name>/
├── components/          # UI riêng của feature (VD: BookCard, BorrowHistoryTable, LoginForm)
├── hooks/               # Custom hooks nghiệp vụ (VD: useBookFilter, useBorrowActions)
├── services/ hoặc api/  # API calls, server actions, fetchers của domain này
├── types/               # Type definitions, DTOs riêng cho feature
├── schemas/             # Zod validation schemas cho form (VD: bookFormSchema.ts)
├── constants/           # Hằng số, options select, status mappings
└── index.ts             # Public API (chỉ export những gì cần chia sẻ ra ngoài)
```

**Quy tắc Feature Isolation**:
- Feature `A` hạn chế import trực tiếp từ file nội bộ của Feature `B`. Hãy chỉ import qua `features/<feature-name>/index.ts`.
- Nếu một component trong feature bắt đầu được dùng ở ≥ 3 features khác nhau và không còn dính líu đến domain, hãy chuyển nó lên `components/common/`.

### 2.4. `lib/`, `providers/`, `hooks/`, `types/`, `config/`
- **`lib/utils.ts`**: Chứa hàm `cn()` (`clsx` + `tailwind-merge`) và các helper thuần túy (format ngày tháng `formatDate`, định dạng tiền tệ, format số lượng sách).
- **`providers/`**: Wrap các context ở Root Layout (`layout.tsx`), gồm ThemeProvider, QueryClientProvider, ToastProvider.
- **`hooks/`**: Chỉ chứa hook phi nghiệp vụ (VD: `useDebounce`, `useLocalStorage`, `useOnClickOutside`). Hook có dính líu đến `book` phải nằm trong `features/book/hooks/`.
- **`config/`**: Khai báo routes path constants (`ROUTES.LANDING.BOOKS`, `ROUTES.DASHBOARD.USERS`), site metadata, sidebar navigation menu config.

---

## 3. ⚛️ Quy chuẩn viết Component & React

### 3.1. Ranh giới Server Component (RSC) vs Client Component (`use client`)
- **Mặc định là Server Component** để tối ưu hóa SEO, giảm tải JS bundle và hỗ trợ streaming.
- Chỉ gắn `'use client'` ở mức component lá (Leaf Component) khi thật sự cần:
  - Cần interactivity: `useState`, `useEffect`, `useReducer`, `useRef`.
  - Sử dụng Browser APIs (`window`, `localStorage`, `navigator`).
  - Lắng nghe event: `onClick`, `onChange`, `onSubmit`.
  - Dùng Context Hooks (`useTheme`, `useForm`).
- **Pattern**: Tạo Server Container ở `page.tsx` -> truyền data qua props cho Client Interactive Component bên trong `features/`.

### 3.2. Định nghĩa Props & Type Safety
- Luôn định nghĩa interface/type rõ ràng cho Props với tiền tố/hậu tố rõ nghĩa:
  ```tsx
  export interface BookCardProps {
    book: Book;
    variant?: 'compact' | 'detailed' | 'grid';
    onBorrow?: (bookId: string) => void;
    className?: string;
  }
  ```
- Luôn hỗ trợ prop `className?: string` cho các component UI để dễ dàng mở rộng style từ bên ngoài thông qua hàm `cn()`.
- ❌ Tuyệt đối **không dùng `any`**. Luôn khai báo kiểu cụ thể hoặc `unknown` kèm type guard.

---

## 4. 🎨 Quy chuẩn Styling & Tailwind CSS

### 4.1. Hệ thống Class & Helper `cn`
- Luôn ghép nối className bằng hàm `cn()`:
  ```tsx
  import { cn } from "@/lib/utils";

  export function Badge({ className, variant = "default", ...props }: BadgeProps) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
          variant === "default" && "bg-primary text-primary-foreground",
          variant === "destructive" && "bg-destructive text-destructive-foreground",
          className
        )}
        {...props}
      />
    );
  }
  ```

### 4.2. Nguyên tắc Thẩm mỹ & Trải nghiệm (Modern UI/UX)
- **Mobile-First Responsive**: Luôn bắt đầu từ kích thước mobile mặc định, sau đó bổ sung breakpoint: `sm:`, `md:`, `lg:`, `xl:`.
- **Màu sắc & Tokens**: Sử dụng biến màu semantic của hệ thống (VD: `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`), tránh hardcode mã màu hex tuỳ tiện (tránh dùng `text-[#333333]`).
- **Interactive States**: Mọi nút bấm, link và row tương tác phải có đầy đủ trạng thái:
  - `hover:*`
  - `focus-visible:*` (đảm bảo a11y keyboard navigation)
  - `active:*`
  - `disabled:*` (kèm `cursor-not-allowed opacity-50`)
- **Animations & Transitions**: Thêm `transition-all duration-200 ease-in-out` cho các hiệu ứng hover, dialog fade-in, dropdown popup để giao diện mượt mà và cao cấp.
- **Feedback & Loading States**:
  - Khi chờ dữ liệu: sử dụng `Skeleton` đúng hình dáng content thay vì spinner toàn trang.
  - Khi không có dữ liệu: hiển thị `EmptyState` thân thiện với nút hành động (CTA).

---

## 5. 📋 Quy chuẩn Đặt tên (Naming Conventions)

| Đối tượng | Quy ước đặt tên | Ví dụ |
| :--- | :--- | :--- |
| **Component File** | `PascalCase.tsx` | `BookCard.tsx`, `UserTable.tsx`, `SidebarNav.tsx` |
| **Component Name** | `PascalCase` | `function BookCard(...)` |
| **Hooks** | `camelCase.ts` (tiền tố `use`) | `useBorrowStatus.ts`, `useBookFilter.ts` |
| **Utilities / Services** | `camelCase.ts` | `formatDate.ts`, `bookApi.ts` |
| **Types / Interfaces** | `PascalCase` | `interface BookItem`, `type BorrowStatus` |
| **Constants / Enums** | `UPPER_SNAKE_CASE` hoặc `PascalCase` | `BOOK_STATUS`, `BORROW_LIMIT_PER_USER` |
| **Next.js Routes** | `kebab-case` hoặc `()` cho route group | `app/(landing)/about/page.tsx` |

---

## 6. 📝 Checklist trước khi hoàn thành một UI Component hoặc Trang

- [ ] File được đặt đúng thư mục (nếu là UI chung -> `components/`, nếu dính nghiệp vụ -> `features/<feature>/`).
- [ ] `page.tsx` có dung lượng gọn gàng (thin page), không chứa logic khổng lồ.
- [ ] Xác định rõ Client Component (`'use client'`) hay Server Component.
- [ ] Có đầy đủ TypeScript interface cho Props, không dùng `any`.
- [ ] Class CSS sử dụng `cn()` và hỗ trợ truyền `className` từ ngoài vào.
- [ ] Đã test giao diện trên mobile và desktop (`responsive`).
- [ ] Đã xử lý đầy đủ các trạng thái: **Loading (Skeleton)**, **Empty State**, **Error**, và **Disabled**.
- [ ] Sử dụng thẻ HTML ngữ nghĩa (`<main>`, `<nav>`, `<header>`, `<section>`, `<article>`, `<button>`).

---

## 7. 🛑 Quy tắc Thực thi & Chạy lệnh (Execution & Dev Server Rules)

- ❌ **TUYỆT ĐỐI KHÔNG TỰ Ý CHẠY DEV SERVER (`npm run dev`, `next dev`...)**:
  - AI Assistant **KHÔNG ĐƯỢC** tự động bật hoặc chạy dev server ngầm (`npm run dev`, `yarn dev`, `pnpm dev`, `next dev`).
  - **Người dùng sẽ tự chạy project trên máy cá nhân.**
  - Chỉ chạy các lệnh kiểm tra tĩnh không liên tục (như `npm run build` hoặc `npm run lint`) khi cần kiểm tra lỗi cú pháp/type và chỉ khi có sự đồng ý hoặc yêu cầu từ người dùng. Không duy trì tiến trình server chạy ngầm.

---

## 8. 🌐 Quy tắc Gọi API Backend (`ApiResponse` Contract)

Khi viết service/fetcher gọi API sang backend `hope-library`:
1. **Quy ước phản hồi từ backend**:
   - Backend NestJS luôn trả về đối tượng `ApiResponse` (`src/common/api.response.ts`):
     ```json
     {
       "statusCode": 200,
       "message": "Thông báo thành công",
       "response": { ... },
       "timestamp": "2026-10-30T..."
     }
     ```
2. **Quy tắc xử lý bắt buộc**:
   - ❌ **CẤM** kiểm tra `if (!result.success)` hay `if (result.success)` vì backend **KHÔNG CÓ trường `success`**.
   - ✅ Kiểm tra thành công dựa vào HTTP Status: `if (!res.ok || (result.statusCode && result.statusCode >= 400)) { throw new Error(result.message); }`.
   - ✅ Trích xuất dữ liệu từ trường **`response`**: `const data = result.response ?? result.data ?? result;`.

---

## 9. ✨ Quy chuẩn Tương tác, Accessibility & Runtime (Astryx Techniques)

Áp dụng các nguyên tắc kỹ thuật từ Design System **Astryx** cho toàn bộ FE `hopelib`:

1. **IME Composition Guard (`lib/ime.ts`)**:
   - Mọi handler `onKeyDown` / `keydown` xử lý phím lệnh (`Enter`, `Escape`, `Backspace`, mũi tên...) **BẮT BUỘC** gọi `if (isImeKeyEvent(e.nativeEvent)) return;` (hoặc `isImeKeyEvent(e)` với native DOM event) để tránh kích hoạt lệnh khi người dùng đang gõ bộ gõ tiếng Việt (Telex/VNI) hoặc CJK.
2. **Layer Dismissal Stack & Focus Trap (`hooks/useLayerDismissal.ts`, `hooks/useFocusTrap.ts`)**:
   - Modal/Dialog không tự gắn `window.addEventListener("keydown")` rời rạc cho `Escape`; dùng `useLayerDismissal` để đảm bảo chỉ đóng lớp trên cùng (top-most) và tự động có IME guard.
   - Dùng `useFocusTrap` để giữ `Tab`/`Shift+Tab` trong Modal và trả focus về phần tử gốc theo đúng chế độ tương tác (`keyboard` vs `pointer`).
3. **Committed Ref (`hooks/useCommittedRef.ts`)**:
   - Khi callback/timer/listener cần đọc prop hoặc handler mới nhất mà không re-subscribe `useEffect`, dùng `useCommittedRef(value)` (sử dụng `useInsertionEffect`) thay vì viết `useRef` + `useEffect` thủ công.
4. **Event Handler Composition (`lib/composeEventHandlers.ts`)**:
   - Component UI dùng chung nhận event props từ ngoài vào (`onClick`, `onKeyDown`) nên ghép bằng `composeEventHandlers(consumerHandler, internalHandler)` để không ghi đè nhau và tôn trọng `event.preventDefault()`.
5. **Semantic Tokens, Reduced Motion & Interaction Modality (`app/globals.css`, `lib/interactionModality.ts`)**:
   - Ưu tiên dùng semantic CSS variables (`--color-accent`, `--color-background-surface`, `--color-text-primary`, `--motion-duration-*`) thay vì hardcode hex/duration.
   - Mọi hiệu ứng scale/ping/animation cần tôn trọng `prefers-reduced-motion` (`motion-reduce:active:scale-100`, `motion-reduce:animate-none`, `motion-reduce:transition-none`).
   - Luôn khai báo `displayName` cho các UI primitive component.

---

## 10. 🎨 Design System & UX Quality Checklist (UI/UX Pro Max)

Hệ thống thiết kế chuẩn của dự án được lưu bền vững theo mô hình **Master + Page Overrides**:
- **Global Source of Truth**: [design-system/hope-library/MASTER.md](file:///E:/Individual-Project/hopelib/design-system/hope-library/MASTER.md) (`tokens.json`, `tokens.css`).
- **Dashboard Override**: [design-system/hope-library/pages/dashboard.md](file:///E:/Individual-Project/hopelib/design-system/hope-library/pages/dashboard.md).

Quy tắc bắt buộc khi xây dựng/chỉnh sửa giao diện (theo độ ưu tiên 1 → 10 của `ui-ux-pro-max`):
1. **Accessibility (CRITICAL)**:
   - Độ tương phản chữ tối thiểu `4.5:1` (tránh xám nhạt trên nền xám).
   - Mọi trang có điều hướng đều hỗ trợ `<SkipToContent />` trỏ tới `<main id="main-content" tabIndex={-1}>`.
   - `scroll-padding-top: var(--header-height)` giữ phần tử đang focus không bị sticky header che khuất (WCAG 2.2 AA).
   - Mọi nút chỉ có icon **BẮT BUỘC** có `aria-label`; mọi icon trang trí đi kèm text gắn `aria-hidden="true"`.
2. **Touch & Interaction (CRITICAL)**:
   - Nút bấm có vùng chạm đủ lớn (`p-1.5` trở lên cho icon button), `cursor-pointer`, chuyển trạng thái mượt (`150–300ms`), không phụ thuộc hoàn toàn vào hover.
3. **Typography & Spacing**:
   - Body `line-height: 1.5`, heading ngắn dùng `text-wrap: balance` (tránh mồ côi 1 từ cuối dòng).
   - Dùng thang spacing (`--space-xs`..`--space-3xl`) và shadow (`--shadow-sm`..`--shadow-xl`) trong `app/globals.css`.
4. **Icons & Visual Hygiene**:
   - Dùng icon SVG (`lucide-react`), **không dùng emoji** thay cho UI icon.
