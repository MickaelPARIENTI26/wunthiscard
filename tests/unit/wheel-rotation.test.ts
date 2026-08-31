import { describe, it, expect } from 'vitest';
import {
  landingRotation,
  offsetFromSegmentCentre,
  FULL_TURNS,
} from '../../apps/web/src/lib/wheel-rotation';

describe('landingRotation — the wheel points at what the server drew', () => {
  it('stops with the target segment under the pointer, for every segment', () => {
    for (const count of [2, 3, 6, 8, 12]) {
      for (let target = 0; target < count; target++) {
        const rotation = landingRotation(0, target, count);
        expect(Math.abs(offsetFromSegmentCentre(rotation, target, count))).toBeLessThan(0.001);
      }
    }
  });

  it('keeps the stop inside the segment at full jitter, both ways', () => {
    const count = 6;
    const halfSegment = 360 / count / 2;
    for (const jitter of [-0.5, -0.2, 0, 0.2, 0.5]) {
      const rotation = landingRotation(0, 3, count, jitter);
      // Still inside the wedge: the pointer must never show a neighbour.
      expect(Math.abs(offsetFromSegmentCentre(rotation, 3, count))).toBeLessThan(halfSegment);
    }
  });

  it('always turns forwards, from any starting angle', () => {
    // A wheel that has already been spun sits at an arbitrary cumulative angle;
    // the next spin must add to it, never rewind.
    for (const previous of [0, 37.4, 359.9, 1847.2, 5000]) {
      for (let target = 0; target < 6; target++) {
        const rotation = landingRotation(previous, target, 6);
        expect(rotation).toBeGreaterThan(previous);
        expect(rotation - previous).toBeGreaterThanOrEqual(360 * FULL_TURNS);
        expect(rotation - previous).toBeLessThan(360 * (FULL_TURNS + 1));
      }
    }
  });

  it('lands correctly on a second spin without resetting the angle', () => {
    const first = landingRotation(0, 1, 6);
    const second = landingRotation(first, 4, 6);
    expect(Math.abs(offsetFromSegmentCentre(second, 4, 6))).toBeLessThan(0.001);
  });
});
