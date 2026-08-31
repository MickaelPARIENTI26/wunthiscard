/**
 * Where the wheel stops.
 *
 * The result is already decided and committed server-side before anything
 * turns, so this is purely the job of pointing at the right segment. It is kept
 * out of the component and unit-tested because an off-by-one here would show
 * one prize and award another — the single worst bug this feature could have.
 */

/** Turns added on top of the landing angle, so the wheel visibly spins. */
export const FULL_TURNS = 5;

/** Share of a segment the stop point is allowed to wander from dead centre. */
const JITTER_SPREAD = 0.55;

/**
 * @param previous  current rotation in degrees (kept cumulative, never reset)
 * @param target    index of the segment that must end under the pointer
 * @param count     number of segments on the wheel
 * @param jitter    -0.5..0.5; offsets the stop within the segment
 * @returns the new cumulative rotation, always greater than `previous`
 */
export function landingRotation(
  previous: number,
  target: number,
  count: number,
  jitter = 0
): number {
  const arc = 360 / count;
  // Segment centres start at arc/2 clockwise from the pointer, so the wheel has
  // to give back exactly that much for the segment to arrive at the top.
  const desired = 360 - (target * arc + arc / 2) + jitter * arc * JITTER_SPREAD;
  const current = ((previous % 360) + 360) % 360;
  let delta = desired - current;
  // Always turn forwards: a negative delta would visibly rewind the wheel.
  while (delta < 0) delta += 360;
  return previous + 360 * FULL_TURNS + delta;
}

/**
 * Angle of the segment sitting under the pointer, as a signed offset from that
 * segment's centre. Exists so tests can assert where the wheel actually stopped
 * rather than re-deriving the formula they are checking.
 */
export function offsetFromSegmentCentre(rotation: number, target: number, count: number): number {
  const arc = 360 / count;
  const at = (((target * arc + arc / 2 + rotation) % 360) + 360) % 360;
  return at > 180 ? at - 360 : at;
}
