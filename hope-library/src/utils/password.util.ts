import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

/**
 * Băm mật khẩu sử dụng crypto.scrypt kết hợp salt 16-byte
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Kiểm tra mật khẩu khớp với chuỗi hash đã lưu (timing-safe)
 */
export function comparePassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) {
      return false;
    }
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = scryptSync(password, salt, 64);
    return timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
