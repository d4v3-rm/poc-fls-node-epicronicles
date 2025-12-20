import type { GalaxyShape } from '@domain/galaxy/galaxy';

export const getCoreVoidFraction = (shape: GalaxyShape) => {
  const byShape: Record<GalaxyShape, number> = {
    circle: 0.18,
    spiral: 0.14,
    ring: 0.55,
    bar: 0.12,
    ellipse: 0.16,
    cluster: 0.1,
  };
  return byShape[shape] ?? 0.15;
};

export const getDustRadii = (shape: GalaxyShape, maxSystemRadius: number) => {
  const outerRadius = Math.max(120, maxSystemRadius * 1.02);
  const innerVoidRadius = outerRadius * getCoreVoidFraction(shape);
  return {
    outerRadius,
    innerVoidRadius: Math.max(30, innerVoidRadius),
  };
};

export const getSpiralParams = () => ({
  arms: 3,
  twist: Math.PI * 3.6,
});

