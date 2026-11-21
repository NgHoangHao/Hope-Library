/**
 * Trích xuất danh sách role của người dùng từ object User hoặc JWT Token
 */
export function extractRoles(user?: unknown, token?: string): string[] {
  const rolesSet = new Set<string>();
  const userObj = user as Record<string, unknown> | undefined;

  // 1. Trích xuất từ user.roles (hỗ trợ mảng string hoặc mảng object)
  if (Array.isArray(userObj?.roles)) {
    userObj.roles.forEach((r: unknown) => {
      if (typeof r === "string") {
        rolesSet.add(r);
      } else if (r && typeof r === "object") {
        const item = r as { name?: string; code?: string };
        if (item.name) rolesSet.add(item.name);
        else if (item.code) rolesSet.add(item.code);
      }
    });
  }

  // 1b. Trích xuất từ user.roleList hoặc user.roleDetails nếu có
  const roleArray = (userObj?.roleList || userObj?.roleDetails) as unknown;
  if (Array.isArray(roleArray)) {
    roleArray.forEach((r: unknown) => {
      if (typeof r === "string") {
        rolesSet.add(r);
      } else if (r && typeof r === "object") {
        const item = r as { name?: string; code?: string };
        if (item.name) rolesSet.add(item.name);
        else if (item.code) rolesSet.add(item.code);
      }
    });
  }

  // 2. Trích xuất từ user.role (chuỗi hoặc object đơn)
  if (userObj?.role) {
    if (typeof userObj.role === "string") {
      rolesSet.add(userObj.role);
    } else if (typeof userObj.role === "object") {
      const item = userObj.role as { name?: string; code?: string };
      if (item.name) rolesSet.add(item.name);
      else if (item.code) rolesSet.add(item.code);
    }
  }

  // 3. Trích xuất từ user.userRoles nếu có
  if (Array.isArray(userObj?.userRoles)) {
    userObj.userRoles.forEach((ur: unknown) => {
      if (ur && typeof ur === "object") {
        const item = ur as { role?: { name?: string; code?: string }; name?: string };
        const roleName = item?.role?.name || item?.role?.code || item?.name;
        if (roleName) rolesSet.add(roleName);
      }
    });
  }

  // 4. Giải mã Base64URL từ JWT Access Token (hỗ trợ đầy đủ ký tự '-' '_' và padding)
  const effectiveToken =
    token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("hope_access_token")
      : null);

  if (effectiveToken && typeof effectiveToken === "string") {
    try {
      const parts = effectiveToken.split(".");
      if (parts.length >= 2) {
        let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) {
          base64 += "=";
        }
        const jsonString = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const parsed = JSON.parse(jsonString);

        if (Array.isArray(parsed?.roles)) {
          parsed.roles.forEach((r: unknown) => {
            if (typeof r === "string") {
              rolesSet.add(r);
            } else if (r && typeof r === "object") {
              const item = r as { name?: string; code?: string };
              if (item.name) rolesSet.add(item.name);
              else if (item.code) rolesSet.add(item.code);
            }
          });
        }
        if (typeof parsed?.role === "string") {
          rolesSet.add(parsed.role);
        }
      }
    } catch (err) {
      console.warn("[auth.helper] Lỗi giải mã JWT token:", err);
    }
  }

  return Array.from(rolesSet);
}

/**
 * Kiểm tra xem người dùng có quyền truy cập Dashboard (ADMIN hoặc LIBRARIAN)
 */
export function hasDashboardRole(user?: unknown, token?: string): boolean {
  const roles = extractRoles(user, token);
  return roles.some((role) => {
    const upper = (role || "").trim().toUpperCase();
    return upper === "ADMIN" || upper === "LIBRARIAN";
  });
}

/**
 * Lấy đường dẫn điều hướng sau khi người dùng đăng nhập thành công:
 * - Nếu danh sách role tồn tại ADMIN hoặc LIBRARIAN -> ưu tiên điều hướng qua /dashboard
 * - Nếu chỉ có role BORROWER (hoặc người dùng thông thường) -> điều hướng qua /home
 */
export function getPostLoginRedirectUrl(user?: unknown, token?: string): string {
  if (hasDashboardRole(user, token)) {
    return "/dashboard";
  }
  return "/home";
}
