import { CanvasTexture, Sprite, SpriteMaterial } from 'three';
import { markDisposableMaterial, markDisposableTexture } from '../dispose';
import {
  SYSTEM_LABEL_CANVAS_INSET_X,
  SYSTEM_LABEL_CANVAS_PADDING_X,
  SYSTEM_LABEL_COLOR,
  SYSTEM_LABEL_FONT_FAMILY,
  SYSTEM_LABEL_FONT_SIZE,
  SYSTEM_LABEL_FONT_WEIGHT,
  SYSTEM_LABEL_RENDER_ORDER,
  SYSTEM_LABEL_TEXTURE_SCALE,
} from './constants';

const noop = () => undefined;

export const createLabelSprite = (text: string) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return null;
  }

  ctx.font = `${SYSTEM_LABEL_FONT_WEIGHT} ${SYSTEM_LABEL_FONT_SIZE}px ${SYSTEM_LABEL_FONT_FAMILY}`;
  const textWidth = ctx.measureText(text).width + SYSTEM_LABEL_CANVAS_PADDING_X;
  canvas.width = textWidth;
  canvas.height = SYSTEM_LABEL_FONT_SIZE * 1.8;

  ctx.font = `${SYSTEM_LABEL_FONT_WEIGHT} ${SYSTEM_LABEL_FONT_SIZE}px ${SYSTEM_LABEL_FONT_FAMILY}`;
  ctx.fillStyle = SYSTEM_LABEL_COLOR;
  ctx.fillText(text, SYSTEM_LABEL_CANVAS_INSET_X, SYSTEM_LABEL_FONT_SIZE);

  const texture = markDisposableTexture(new CanvasTexture(canvas));
  texture.needsUpdate = true;
  const material = markDisposableMaterial(
    new SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    }),
  ) as SpriteMaterial;

  const sprite = new Sprite(material);
  sprite.userData.baseWidth = canvas.width / SYSTEM_LABEL_TEXTURE_SCALE;
  sprite.userData.baseHeight = canvas.height / SYSTEM_LABEL_TEXTURE_SCALE;
  sprite.scale.set(sprite.userData.baseWidth, sprite.userData.baseHeight, 1);
  sprite.renderOrder = SYSTEM_LABEL_RENDER_ORDER;
  sprite.raycast = noop;
  sprite.name = 'label';
  return sprite;
};

