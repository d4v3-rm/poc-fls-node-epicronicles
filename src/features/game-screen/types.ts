export type DockSelection =
  | { kind: 'colony'; planetId: string; systemId: string }
  | {
      kind: 'fleet';
      fleetId: string;
      systemId: string;
      source?: 'fleet' | 'colonization' | 'construction';
    }
  | { kind: 'science'; shipId: string; systemId: string };
