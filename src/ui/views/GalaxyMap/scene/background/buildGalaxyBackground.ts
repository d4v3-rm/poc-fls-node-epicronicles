import * as THREE from 'three';
import type { GalaxyShape } from '@domain/galaxy/galaxy';
import { createSeededRandom } from './random';
import { getDustRadii } from './layout';
import { buildGalaxyDisc } from './galaxyDisc';
import { buildBlackHole } from './blackHole';
import { buildGalaxyDust } from './dust';
import { buildDustField } from './dustField';
import { buildGalaxyNebula } from './nebula';
import { buildStarfield } from './starfield';

export interface BuildGalaxyBackgroundParams {
  group: THREE.Group;
  galaxyShape: GalaxyShape;
  galaxySeed: string;
  systemPositions: Map<string, THREE.Vector3>;
  maxSystemRadius: number;
}

export const buildGalaxyBackground = ({
  group,
  galaxyShape,
  galaxySeed,
  systemPositions,
  maxSystemRadius,
}: BuildGalaxyBackgroundParams) => {
  const rootSeed = `${galaxySeed}:${galaxyShape}`;
  const { outerRadius, innerVoidRadius } = getDustRadii(
    galaxyShape,
    maxSystemRadius,
  );

  group.name = 'backgroundGroup';
  group.position.set(0, 0, 0);

  const starfield = buildStarfield({
    group,
    random: createSeededRandom(`${rootSeed}:starfield`),
    radius: Math.min(Math.max(outerRadius * 12, 2600), 18000),
  });

  const disc = buildGalaxyDisc({
    group,
    shape: galaxyShape,
    random: createSeededRandom(`${rootSeed}:disc`),
    outerRadius,
    innerVoidRadius,
    systemPositions,
  });

  const blackHole = buildBlackHole({
    group,
    innerVoidRadius,
    random: createSeededRandom(`${rootSeed}:blackHole`),
  });

  const dustField = buildDustField({
    group,
    random: createSeededRandom(`${rootSeed}:dustField`),
    outerRadius,
    innerVoidRadius,
    systemPositions,
  });

  const dust = buildGalaxyDust({
    group,
    shape: galaxyShape,
    random: createSeededRandom(`${rootSeed}:dust`),
    outerRadius,
    innerVoidRadius,
    systemPositions,
  });

  const nebula = buildGalaxyNebula({
    group,
    shape: galaxyShape,
    random: createSeededRandom(`${rootSeed}:nebula`),
    outerRadius,
    innerVoidRadius,
    systemPositions,
  });

  group.userData = group.userData ?? {};
  group.userData.blackHole = {
    object: blackHole.object,
    lensingRadius: blackHole.lensingRadius,
    horizonRadius: blackHole.horizonRadius,
  };
  group.userData.update = (elapsed: number, zoomFactor = 1) => {
    starfield.update(elapsed);
    disc.update(elapsed, zoomFactor);
    blackHole.update(elapsed, zoomFactor);
    dustField.update(elapsed, zoomFactor);
    dust.update(elapsed, zoomFactor);
    nebula.update(elapsed, zoomFactor);
  };
};
