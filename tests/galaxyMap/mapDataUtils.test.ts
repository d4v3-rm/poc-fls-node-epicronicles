import { describe, expect, it } from 'vitest';
import { computeZoomBounds } from '../../src/components/GalaxyMap/hooks/mapDataUtils';
import { buildFleetSignature, buildSystemsSignature } from '../../src/components/GalaxyMap/hooks/signatures';
import type { Fleet, StarSystem } from '../../src/engines/types';

describe('computeZoomBounds', () => {
  it('applies a minimum zoom floor of 10', () => {
    const { minZoom } = computeZoomBounds(1);
    expect(minZoom).toBe(10);
  });

  it('scales min and max zoom with radius', () => {
    const { minZoom, maxZoom } = computeZoomBounds(300);
    expect(minZoom).toBeGreaterThan(10);
    expect(maxZoom).toBeGreaterThan(minZoom);
  });
});

describe('signatures', () => {
  it('builds a fleet signature with key attributes', () => {
    const fleet: Fleet = {
      id: 'F1',
      name: 'Fleet 1',
      ownerId: 'player',
      systemId: 'S1',
      targetSystemId: 'S2',
      anchorPlanetId: 'P1',
      localOffset: null,
      ticksToArrival: 3,
      ships: [],
      lastTargetSystemId: null,
    };
    const sig = buildFleetSignature([fleet]);
    expect(sig).toContain('F1:S1:S2');
  });

  it('builds a systems signature including fleet signature', () => {
    const fleetSig = 'fleetSig';
    const systemsSig = buildSystemsSignature({
      systems: [
        {
          id: 'S1',
          name: 'Sys',
          visibility: 'surveyed',
          ownerId: 'player',
          hostilePower: 0,
          orbitingPlanets: [],
          hasShipyard: false,
          position: { x: 0, y: 0 },
          mapPosition: { x: 0, y: 0, z: 0 },
          starClass: 'G',
        } as StarSystem,
      ],
      galaxyShape: 'circle',
      galaxySeed: 'seed',
      fleetSignature: fleetSig,
    });
    expect(systemsSig).toContain('circle:seed|');
    expect(systemsSig).toContain(fleetSig);
  });
});
