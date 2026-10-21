import { Container, Sprite, Texture } from 'pixi.js';
import { ARTWORK_SIZE, WORLD_SIZE } from './atlasLayers';
import { ENTITY_TEXTURES, MAP_ENTITIES, type EntityKind } from './entityLayout';

export type ArtworkStack = Container & { entityTextures: Record<EntityKind, Texture> };

/** Decode all required images before mounting; failures use the existing retry path. */
export async function loadArtworkStack(): Promise<ArtworkStack> {
  const decode = async (url: string) => {
    const source = new Image();
    source.decoding = 'async';
    source.src = url;
    try {
      await source.decode();
    } catch {
      throw new Error('The map artwork could not load. Please retry.');
    }
    return source;
  };
  const kinds = Object.keys(ENTITY_TEXTURES) as EntityKind[];
  const [source, ...images] = await Promise.all([
    decode('/marketverse-v6-map-clean.png'),
    ...kinds.map((kind) => decode(`/maps/entities/${kind}.png`)),
  ]);
  if (source.naturalWidth !== ARTWORK_SIZE.width || source.naturalHeight !== ARTWORK_SIZE.height)
    throw new Error('The world map image has unexpected dimensions.');
  const entityTextures = Object.fromEntries(
    kinds.map((kind, i) => [kind, Texture.from(images[i])]),
  ) as Record<EntityKind, Texture>;
  const root = Object.assign(new Container(), { entityTextures });
  root.label = 'world-artwork';
  root.eventMode = 'none';
  const sprite = new Sprite(Texture.from(source));
  sprite.label = 'world-artwork-image';
  sprite.width = WORLD_SIZE.width;
  sprite.height = WORLD_SIZE.height;
  root.addChild(sprite);
  for (const entity of [...MAP_ENTITIES].sort((a, b) => a.y - b.y)) {
    const landmark = new Sprite(entityTextures[entity.kind]);
    landmark.label = `landmark-${entity.kind}`;
    landmark.anchor.set(0.5, 1);
    landmark.scale.set(entity.width / landmark.texture.width);
    landmark.position.set(entity.x, entity.y);
    landmark.eventMode = 'none';
    root.addChild(landmark);
  }
  return root;
}
