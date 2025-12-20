import * as THREE from 'three';

type TextureOptions = {
  colorSpace?: THREE.ColorSpace;
  wrapS?: THREE.Wrapping;
  wrapT?: THREE.Wrapping;
  minFilter?: THREE.TextureFilter;
  magFilter?: THREE.TextureFilter;
  flipY?: boolean;
};

const textureCache = new Map<string, THREE.Texture>();
const loader = new THREE.TextureLoader();

export const loadAssetTexture = (url: string, options?: TextureOptions) => {
  const cached = textureCache.get(url);
  if (cached) {
    return cached;
  }
  const texture = loader.load(url);
  if (options?.colorSpace) {
    texture.colorSpace = options.colorSpace;
  }
  if (options?.wrapS) {
    texture.wrapS = options.wrapS;
  }
  if (options?.wrapT) {
    texture.wrapT = options.wrapT;
  }
  if (options?.minFilter) {
    texture.minFilter = options.minFilter;
  }
  if (options?.magFilter) {
    texture.magFilter = options.magFilter;
  }
  if (typeof options?.flipY === 'boolean') {
    texture.flipY = options.flipY;
  }
  textureCache.set(url, texture);
  return texture;
};

