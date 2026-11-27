import type { ReportContent } from './contracts';

export function radarGeometry(
  profile: NonNullable<ReportContent['profile']>,
  width: number,
  height: number,
) {
  const cx = width / 2,
    cy = height / 2,
    radius = Math.max(20, Math.min(width, height) / 2 - 70);
  // 仅把后端分值映射为像素坐标，不补分数/等级；未知维度没有点和相邻连线。
  const positions = profile.judgments.map((judgment, index) => {
    const score = profile.scores.find((item) => item.dimension === judgment.dimension)?.score;
    if (judgment.status === 'unknown' || score === null || score === undefined) return null;
    const angle = Math.PI / 2 + (index * Math.PI * 2) / profile.judgments.length;
    return {
      dimension: judgment.dimension,
      score,
      x: cx + (Math.cos(angle) * radius * score) / 100,
      y: cy - (Math.sin(angle) * radius * score) / 100,
    };
  });
  const points = positions.filter((point) => point !== null);
  const edges = positions.flatMap((point, index) => {
    const next = positions[(index + 1) % positions.length];
    return point && next ? [{ from: point, to: next }] : [];
  });
  return { cx, cy, radius, points, edges };
}
