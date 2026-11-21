import { describe, it, expect, vi } from 'vitest';
import {
  computeNextUserCode,
  getNextPrefix,
  isValidUserCode,
  generateNextAvailableUserCode,
} from './user-code.util.js';

describe('user-code.util', () => {
  describe('getNextPrefix', () => {
    it('tăng từ A lên B', () => {
      expect(getNextPrefix('A')).toBe('B');
    });

    it('tăng từ B lên C', () => {
      expect(getNextPrefix('B')).toBe('C');
    });

    it('tăng từ Y lên Z', () => {
      expect(getNextPrefix('Y')).toBe('Z');
    });

    it('tăng từ Z lên AA', () => {
      expect(getNextPrefix('Z')).toBe('AA');
    });

    it('tăng từ AA lên AB', () => {
      expect(getNextPrefix('AA')).toBe('AB');
    });

    it('tăng từ AZ lên BA', () => {
      expect(getNextPrefix('AZ')).toBe('BA');
    });

    it('tăng từ ZZ lên AAA', () => {
      expect(getNextPrefix('ZZ')).toBe('AAA');
    });
  });

  describe('computeNextUserCode', () => {
    it('trả về A-0001 nếu không có mã trước đó (null, undefined, chuỗi rỗng)', () => {
      expect(computeNextUserCode(null)).toBe('A-0001');
      expect(computeNextUserCode(undefined)).toBe('A-0001');
      expect(computeNextUserCode('')).toBe('A-0001');
      expect(computeNextUserCode('   ')).toBe('A-0001');
    });

    it('tăng số khi chưa đạt 9999', () => {
      expect(computeNextUserCode('A-0001')).toBe('A-0002');
      expect(computeNextUserCode('A-0099')).toBe('A-0100');
      expect(computeNextUserCode('A-1234')).toBe('A-1235');
      expect(computeNextUserCode('A-9998')).toBe('A-9999');
    });

    it('chuyển prefix sang chữ cái tiếp theo và reset số về 0001 khi đạt 9999', () => {
      expect(computeNextUserCode('A-9999')).toBe('B-0001');
      expect(computeNextUserCode('B-9999')).toBe('C-0001');
      expect(computeNextUserCode('Z-9999')).toBe('AA-0001');
    });

    it('xử lý tiền tố chữ hoa/chữ thường đồng nhất', () => {
      expect(computeNextUserCode('a-0005')).toBe('A-0006');
      expect(computeNextUserCode('a-9999')).toBe('B-0001');
    });

    it('fallback về A-0001 nếu định dạng không khớp', () => {
      expect(computeNextUserCode('invalid-code')).toBe('A-0001');
      expect(computeNextUserCode('12345')).toBe('A-0001');
    });
  });

  describe('isValidUserCode', () => {
    it('kiểm tra hợp lệ định dạng A-xxxx', () => {
      expect(isValidUserCode('A-0001')).toBe(true);
      expect(isValidUserCode('B-9999')).toBe(true);
      expect(isValidUserCode('AA-0001')).toBe(true);
      expect(isValidUserCode('A-1')).toBe(false);
      expect(isValidUserCode('invalid')).toBe(false);
      expect(isValidUserCode('')).toBe(false);
    });
  });

  describe('generateNextAvailableUserCode', () => {
    const makeAgg = (result: any[]) => ({
      session: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(result),
    });

    it('sinh mã A-0001 khi collection trống', async () => {
      const mockModel: any = {
        aggregate: vi.fn(() => makeAgg([])),
        exists: vi.fn().mockResolvedValue(null),
      };

      const code = await generateNextAvailableUserCode(mockModel);
      expect(code).toBe('A-0001');
    });

    it('sinh mã kế tiếp từ mã lớn nhất trong MongoDB', async () => {
      const mockModel: any = {
        aggregate: vi.fn(() => makeAgg([{ code: 'A-0005' }])),
        exists: vi.fn().mockResolvedValue(null),
      };

      const code = await generateNextAvailableUserCode(mockModel);
      expect(code).toBe('A-0006');
    });

    it('bỏ qua mã đã tồn tại nếu có xung đột (collision avoidance)', async () => {
      const mockModel: any = {
        aggregate: vi.fn(() => makeAgg([{ code: 'A-0005' }])),
        exists: vi.fn(async ({ code }: { code: string }) =>
          code === 'A-0006' ? { _id: 'existing' } : null,
        ),
      };

      const code = await generateNextAvailableUserCode(mockModel);
      expect(code).toBe('A-0007');
    });

    it('truyền ClientSession vào aggregate khi chạy trong transaction', async () => {
      const aggObj = makeAgg([{ code: 'A-0001' }]);
      const mockModel: any = {
        aggregate: vi.fn(() => aggObj),
        exists: vi.fn().mockResolvedValue(null),
      };
      const fakeSession: any = { id: 'session-1' };

      const code = await generateNextAvailableUserCode(mockModel, fakeSession);
      expect(aggObj.session).toHaveBeenCalledWith(fakeSession);
      expect(code).toBe('A-0002');
    });
  });
});
