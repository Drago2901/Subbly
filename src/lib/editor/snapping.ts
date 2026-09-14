export type SnapPoint = {
  time: number;
  id: string;
};

export type SnapResult = {
  time: number;
  snapped: boolean;
  targetId?: string;
};

/** Snap a time to nearby clip/caption boundaries when within the threshold. */
export function snapTime(
  time: number,
  points: SnapPoint[],
  threshold = 0.08,
): SnapResult {
  let nearest: SnapPoint | undefined;
  let distance = Number.POSITIVE_INFINITY;

  for (const point of points) {
    const nextDistance = Math.abs(point.time - time);
    if (nextDistance < distance) {
      distance = nextDistance;
      nearest = point;
    }
  }

  if (!nearest || distance > threshold) {
    return { time, snapped: false };
  }

  return {
    time: nearest.time,
    snapped: true,
    targetId: nearest.id,
  };
}

export function clampTimelineTime(time: number, duration: number): number {
  if (!Number.isFinite(time)) return 0;
  if (!Number.isFinite(duration) || duration <= 0) return Math.max(0, time);
  return Math.min(Math.max(0, time), duration);
}
