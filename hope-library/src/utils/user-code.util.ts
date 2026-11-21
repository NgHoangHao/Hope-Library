import type { ClientSession, Model } from 'mongoose';
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
 * Lấy mã user code kế tiếp từ MongoDB (User model), đảm bảo không bị trùng lặp (unique)
 */
export async function generateNextAvailableUserCode(
  userModel: Model<User>,
  session?: ClientSession,
): Promise<string> {
  let latestCode: string | null = null;

  try {
    const agg = userModel.aggregate<{ code?: string }>([
      { $match: { code: { $type: 'string', $ne: '' } } },
      { $addFields: { codeLen: { $strLenCP: '$code' } } },
      { $sort: { codeLen: -1, code: -1 } },
      { $limit: 1 },
      { $project: { code: 1 } },
    ]);
    if (session) {
      agg.session(session);
    }
    const [latest] = await agg.exec();
    latestCode = latest?.code ?? null;
  } catch {
    try {
      const query = userModel.findOne({}).sort({ createdAt: -1 }).lean();
      if (session) {
        query.session(session);
      }
      const latest = await query.exec();
      latestCode = (latest as { code?: string } | null)?.code ?? null;
    } catch {
      latestCode = null;
    }
  }

  let candidate = computeNextUserCode(latestCode);

  const checkExists = async (codeToCheck: string): Promise<boolean> => {
    try {
      if (typeof userModel.exists === 'function') {
        const query = userModel.exists({ code: codeToCheck });
        if (session && typeof query?.session === 'function') {
          query.session(session);
        }
        const found = await query;
        return Boolean(found);
      }
      const query = userModel.findOne({ code: codeToCheck }).lean();
      if (session && typeof query?.session === 'function') {
        query.session(session);
      }
      const found = await query.exec();
      return Boolean(found);
    } catch {
      return false;
    }
  };

  while (await checkExists(candidate)) {
    candidate = computeNextUserCode(candidate);
  }

  return candidate;
}
