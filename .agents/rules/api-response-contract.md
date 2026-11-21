# Quy chuẩn API Response Contract (Backend & Frontend)

Tài liệu này định nghĩa quy chuẩn **bắt buộc** về phản hồi API (API Response Contract) giữa Backend (`hope-library`) và Frontend (`hopelib`). Mọi AI Assistant và lập trình viên phải tuân thủ nghiêm ngặt quy tắc này.

---

## 1. Bản chất của class `ApiResponse` (Backend NestJS)

Mọi endpoint Controller trong `hope-library` khi trả về kết quả thành công có dữ liệu **bắt buộc** phải bọc trong class `ApiResponse`:
* File nguồn: [`src/common/api.response.ts`](file:///E:/Individual-Project/hope-library/src/common/api.response.ts)
* Import: `import { ApiResponse } from '../common/index.js';`

### Cấu trúc thực tế của class `ApiResponse`:
```typescript
export class ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  response?: T;       // <-- Dữ liệu thực tế được lưu tại field này
  timestamp: string;

  get data(): T | undefined {
    return this.response;
  }
}
```

### ⚠️ ĐẶC ĐIỂM QUAN TRỌNG KHI SERIALIZE RA JSON:
Khi NestJS trả về phản hồi HTTP cho client, đối tượng JSON có dạng:
```json
{
  "statusCode": 200,
  "message": "Thông báo thành công",
  "response": { ... },
  "timestamp": "2026-10-30T10:00:00.000Z"
}
```

> [!CAUTION]
> 1. JSON trả về **KHÔNG CÓ trường `success`** (boolean). Tuyệt đối không kiểm tra `if (result.success)` hay `if (!result.success)`.
> 2. Dữ liệu payload của API nằm ở key **`response`** (`result.response`), không phải `result.data` trực tiếp trên JSON thô.

---

## 2. Quy tắc phía Backend (`hope-library`)

1. **Thành công**:
   * Luôn return thông qua helper methods của `ApiResponse`:
     ```typescript
     // 200 OK
     return ApiResponse.success(data, 'Thông báo thành công');

     // 201 Created
     return ApiResponse.created(createdItem, 'Tạo mới thành công');
     ```
   * Không bao giờ return plain object, raw entity hay string trần.

2. **Lỗi / Ngoại lệ**:
   * Luôn throw thông qua `AppException` (`src/common/app.exception.ts`):
     ```typescript
     throw AppException.badRequest('Thông báo lỗi', details, 'ERROR_CODE');
     ```
   * JSON lỗi trả về client:
     ```json
     {
       "statusCode": 400,
       "message": "Thông báo lỗi",
       "errorCode": "ERROR_CODE",
       "details": { ... },
       "timestamp": "..."
     }
     ```

---

## 3. Quy tắc phía Frontend (`hopelib`)

Mọi hàm gọi API (Service / Fetcher) trong `hopelib` **BẮT BUỘC** xử lý theo pattern chuẩn sau:

### 3.1. Định nghĩa Type chuẩn:
```typescript
export interface BackendApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  response?: T;
  timestamp: string;
  errorCode?: string;
  details?: unknown;
}
```

### 3.2. Pattern gọi và xử lý Response chuẩn:
```typescript
export async function callApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json: BackendApiResponse<T> = await res.json();

  // 1. Kiểm tra trạng thái lỗi (Dựa vào HTTP status và statusCode trong body)
  // TUYỆT ĐỐI KHÔNG check if (!json.success)
  if (!res.ok || (json.statusCode && json.statusCode >= 400)) {
    const errorMsg = json.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.';
    throw new Error(errorMsg);
  }

  // 2. Trích xuất payload dữ liệu an toàn từ field 'response'
  const payload = (json.response ?? (json as any).data ?? json) as T;
  return payload;
}
```

---

## 4. Tóm tắt ghi nhớ (Checklist)
* [x] Backend luôn wrap dữ liệu trả về trong `ApiResponse.success(data, message)` hoặc `ApiResponse.created(data, message)`.
* [x] Backend JSON trả về có key dữ liệu là **`response`**.
* [x] Frontend kiểm tra lỗi bằng `!res.ok || (json.statusCode >= 400)`.
* [x] Frontend lấy data bằng `json.response`.
* [x] Tuyệt đối không kiểm tra `result.success` vì trường này không tồn tại trong `ApiResponse`.
