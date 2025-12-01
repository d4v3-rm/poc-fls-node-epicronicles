# GalaxyMap lib structure

- `anchors/`: shared anchor pooling/resolution utilities.
- `background/`: nebula generation (mask, layers, particles) and cleanup helpers.
- `common/`: shared math/coordinate utilities for map space.
- `frame/`: per-frame updates (camera, nebula fade, system animations), entry via `updateFrame`.
- `map/`: star and planet visuals (textures, materials, system nodes).
- `objects/`: scene objects like the black hole.
- `rebuild/`: scene (re)construction pipeline and anchor builders.
