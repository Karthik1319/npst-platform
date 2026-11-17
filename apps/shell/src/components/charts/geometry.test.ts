import { describe, expect, it } from 'vitest';
import {
  niceTicks,
  pieAngles,
  polarToCartesian,
  topRoundedBar,
} from './geometry';

// Expected values were read from the original Admin Portal's rendered charts
// (its chart library, recharts 3), so the in-house charts draw the same shapes.
describe('chart geometry (same as the original charts)', () => {
  it('splits a donut with 3° padding like the original (4 completed, 7 pending, 4 overdue)', () => {
    const [completed, pending, overdue] = pieAngles([4, 7, 4], 3);
    expect(completed?.start).toBe(0);
    expect(completed?.end).toBeCloseTo(93.6, 1);
    expect(pending?.start).toBeCloseTo(96.6, 1);
    expect(overdue?.end).toBeCloseTo(357, 0);
    // First slice starts at 3 o'clock on the outer radius: (cx + 85, cy).
    const start = polarToCartesian(256.5, 135.4296875, 85, 0);
    expect(start.x).toBeCloseTo(341.5, 4);
    expect(start.y).toBeCloseTo(135.4297, 4);
  });

  // Output of the original chart library's getNiceTickValues([0, max], 5, false).
  it.each([
    [0, [0, 1, 2, 3, 4]],
    [3, [0, 1, 2, 3, 4]],
    [4, [0, 1, 2, 3, 4]],
    [5, [0, 2, 4, 6, 8]],
    [7, [0, 2, 4, 6, 8]],
    [10, [0, 3, 6, 9, 12]],
    [13, [0, 4, 8, 12, 16]],
    [25, [0, 7, 14, 21, 28]],
    [100, [0, 25, 50, 75, 100]],
  ])('uses integer "nice" ticks from 0 (max %i)', (max, ticks) => {
    expect(niceTicks(max)).toEqual(ticks);
  });

  it('draws a bar with rounded top corners exactly like the original', () => {
    expect(topRoundedBar(48.6143, 194.5, 53, 63.5, 4)).toBe(
      'M48.6143,198.5A 4,4,0,0,1,52.6143,194.5L 97.6143,194.5A 4,4,0,0,1,101.6143,198.5L 101.6143,258L 48.6143,258Z',
    );
  });
});
