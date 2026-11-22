/** Smooth, bounded easing for one discrete algorithm state transition. */
export function algorithmEase(progress: number) {
  const t = Math.min(1, Math.max(0, progress));
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
