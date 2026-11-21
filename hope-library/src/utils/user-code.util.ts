import { EntityManager, Repository } from 'typeorm';
import { User } from '../model/user/user.entity.js';

/**
 * Tăng ký tự tiền tố (prefix) theo thứ tự alphabet:
 * 'A' -> 'B', 'B' -> 'C', ..., 'Y' -> 'Z', 'Z' -> 'AA', 'AA' -> 'AB', ..., 'AZ' -> 'BA', 'ZZ' -> 'AAA'
 */
export function getNextPrefix(prefix: string): string {
  const upper = prefix.toUpperCase();
  const chars = upper.split('');
  let i = chars.length - 1;
  while (i >= 0) {
    if (chars[i] !== 'Z') {
      chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
      return chars.join('');
    }
    chars[i] = 'A';
    i--;
  }
  return 'A' + chars.join('');
}

/**
 * Tính toán mã code người dùng kế tiếp theo quy tắc:
 * Định dạng: "A-xxxx" với xxxx là số từ 0001 đến 9999.
 * Khi số đạt 9999, tiền tố tăng lên (ví dụ: A -> B) và số reset lại về 0001 (ví dụ: B-0001).
 * Nếu chưa có mã nào hoặc mã không hợp lệ, mặc định trả về "A-0001".
 */
export function computeNextUserCode(currentCode?: string | null): string {
  if (!currentCode || typeof currentCode !== 'string' || !currentCode.trim()) {
    return 'A-0001';
  }

  const match = currentCode.trim().match(/^([A-Za-z]+)-(\d+)$/);
  if (!match) {
    return 'A-0001';
  }

  let prefix = match[1].toUpperCase();
  let num = parseInt(match[2], 10);

  if (isNaN(num) || num < 1) {
    return `${prefix}-0001`;
  }

  if (num >= 9999) {
    prefix = getNextPrefix(prefix);
    num = 1;
  } else {
    num += 1;
  }

  return `${prefix}-${String(num).padStart(4, '0')}`;
}

/**
 * Kiểm tra mã user code có hợp lệ theo định dạng quy định hay không
 */
export function isValidUserCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  return /^[A-Z]+-\d{4}$/.test(code.trim());
}

/**
 * Lấy mã user code kế tiếp từ CSDL hoặc EntityManager, đảm bảo không bị trùng lặp (unique)
 */
export async function generateNextAvailableUserCode(
  target: Repository<User> | EntityManager,
): Promise<string> {
  // Nếu target là EntityManager (ví dụ trong transaction), lấy Repository<User> từ manager
  const repo: Repository<User> =
    'getRepository' in target && typeof (target as EntityManager).getRepository === 'function'
      ? (target as EntityManager).getRepository(User)
      : (target as Repository<User>);

  let latestCode: string | null = null;

  try {
    const qb = repo.createQueryBuilder('user');

    const latest = await qb
      .where('user.code IS NOT NULL')
      .orderBy('LEN(user.code)', 'DESC')
      .addOrderBy('user.code', 'DESC')
      .getOne();

    latestCode = latest?.code ?? null;
  } catch {
    try {
      if (typeof repo.findOne === 'function') {
        const latest = await repo.findOne({
          where: {},
          order: { createdAt: 'DESC' },
        });
        latestCode = latest?.code ?? null;
      }
    } catch {
      latestCode = null;
    }
  }

  let candidate = computeNextUserCode(latestCode);

  // Safeguard: Kiểm tra candidate đã tồn tại hay chưa để tránh collision
  const checkExists = async (codeToCheck: string): Promise<boolean> => {
    try {
      if (typeof repo.exists === 'function') {
        return await repo.exists({ where: { code: codeToCheck } });
      }
      if (typeof repo.findOne === 'function') {
        const found = await repo.findOne({ where: { code: codeToCheck } });
        return Boolean(found);
      }
    } catch {
      return false;
    }
    return false;
  };

  while (await checkExists(candidate)) {
    candidate = computeNextUserCode(candidate);
  }

  return candidate;
}
