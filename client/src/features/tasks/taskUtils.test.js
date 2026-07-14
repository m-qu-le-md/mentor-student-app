import { describe, expect, it } from 'vitest';
import { taskBucket, XP_BY_SIZE } from './taskUtils';

describe('task presentation contract', () => {
  it('giữ XP map đồng bộ với server', () => expect(XP_BY_SIZE).toEqual({ small: 20, medium: 50, large: 100 }));
  it('không trộn task đã xong vào Today', () => expect(taskBucket({ status: 'completed', dueDate: new Date() })).toBe('past'));
});
