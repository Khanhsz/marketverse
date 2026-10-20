import { Container, Sprite, Texture } from 'pixi.js';
import { ARTWORK_SIZE, WORLD_SIZE } from './atlasLayers';

/** Decode the required artwork once; interaction stays in separate Pixi overlays. */
export async function loadArtworkStack(): Promise<Container> {
  const source = new Image();
  source.decoding = 'async';
  source.src = '/marketverse-v6-map-clean.png';
  try {
    await source.decode();
  } catch {
    throw new Error('The country map image could not load. Please retry.');
  }
  if (source.naturalWidth !== ARTWORK_SIZE.width || source.naturalHeight !== ARTWORK_SIZE.height)
    throw new Error('The country map image has unexpected dimensions.');
  const sprite = new Sprite(Texture.from(source));
  sprite.label = 'country-artwork-image';
  sprite.width = WORLD_SIZE.width;
  sprite.height = WORLD_SIZE.height;
  sprite.eventMode = 'none';
  const root = new Container();
  root.label = 'country-artwork';
  root.eventMode = 'none';
  root.addChild(sprite);
  return root;
}
