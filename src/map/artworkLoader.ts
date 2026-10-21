import { Container, Sprite, Text, Texture } from 'pixi.js';
import { ARTWORK_SIZE, WORLD_SIZE } from './atlasLayers';
import { ENTITY_TEXTURES, MAP_ENTITIES, type EntityKind } from './entityLayout';
import { COUNTRIES } from '../data/countries';
import { COUNTRY_ARTWORK_LAYOUT, countryArtworkPath } from './countryArtwork';

export type ArtworkStack = Container & {
  entityTextures: Record<EntityKind, Texture>;
  countrySprites: Record<string, Sprite>;
  setSelectedCountry: (countryId?: string) => void;
};

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
  const decoded = await Promise.all([
    decode('/marketverse-ocean.png'),
    ...COUNTRIES.map((country) => decode(countryArtworkPath(country))),
    ...kinds.map((kind) => decode(`/maps/entities/${kind}.png`)),
  ]);
  const source = decoded[0];
  const countryImages = decoded.slice(1, 1 + COUNTRIES.length);
  const images = decoded.slice(1 + COUNTRIES.length);
  if (source.naturalWidth !== ARTWORK_SIZE.width || source.naturalHeight !== ARTWORK_SIZE.height)
    throw new Error('The ocean image has unexpected dimensions.');
  const entityTextures = Object.fromEntries(
    kinds.map((kind, i) => [kind, Texture.from(images[i])]),
  ) as Record<EntityKind, Texture>;
  const countrySprites: Record<string, Sprite> = {};
  const countryHighlights: Record<string, Sprite> = {};
  const root = Object.assign(new Container(), {
    entityTextures,
    countrySprites,
    setSelectedCountry: (countryId?: string) => {
      for (const country of COUNTRIES) {
        const selected = country.id === countryId;
        const sprite = countrySprites[country.id];
        const highlight = countryHighlights[country.id];
        sprite.alpha = 1;
        sprite.zIndex = selected ? 13 : 10;
        highlight.visible = selected;
      }
      root.sortChildren();
    },
  });
  root.label = 'world-artwork';
  root.eventMode = 'none';
  root.sortableChildren = true;
  const sprite = new Sprite(Texture.from(source));
  sprite.label = 'world-ocean-image';
  sprite.width = WORLD_SIZE.width;
  sprite.height = WORLD_SIZE.height;
  sprite.alpha = 1;
  sprite.zIndex = 0;
  root.addChild(sprite);
  for (const [index, country] of [...COUNTRIES].sort((a, b) => a.center.y - b.center.y).entries()) {
    const texture = Texture.from(countryImages[COUNTRIES.indexOf(country)]);
    const placement = COUNTRY_ARTWORK_LAYOUT[country.id];
    const x = country.center.x + (placement.offsetX ?? 0);
    const y = country.center.y + (placement.offsetY ?? 0);
    const scale = placement.width / texture.width;
    const highlight = new Sprite(texture);
    highlight.label = `country-highlight-${country.id}`;
    highlight.anchor.set(0.5);
    highlight.position.set(x, y);
    highlight.rotation = placement.rotation ?? 0;
    highlight.scale.set(scale * 1.08);
    highlight.tint = 0xffc54d;
    highlight.alpha = 0.5;
    highlight.visible = false;
    highlight.zIndex = 11;
    highlight.eventMode = 'none';
    countryHighlights[country.id] = highlight;
    const countrySprite = new Sprite(texture);
    countrySprite.label = `country-artwork-${country.id}`;
    countrySprite.anchor.set(0.5);
    countrySprite.position.set(x, y);
    countrySprite.rotation = placement.rotation ?? 0;
    countrySprite.scale.set(scale);
    countrySprite.alpha = 1;
    countrySprite.zIndex = 10 + index / 1000;
    countrySprite.eventMode = 'none';
    countrySprites[country.id] = countrySprite;
    root.addChild(highlight, countrySprite);
    const countryLabel = new Text({
      text: country.name.toUpperCase(),
      style: {
        fill: 0x213f39,
        fontSize: 11,
        fontFamily: 'Arial',
        fontWeight: 'bold',
        letterSpacing: 1.2,
        stroke: { color: 0xf4f0df, width: 2 },
      },
    });
    countryLabel.label = `country-label-${country.id}`;
    countryLabel.anchor.set(0.5);
    countryLabel.position.set(country.center.x, country.center.y);
    countryLabel.zIndex = 20;
    countryLabel.eventMode = 'none';
    root.addChild(countryLabel);
  }
  for (const entity of [...MAP_ENTITIES].sort((a, b) => a.y - b.y)) {
    const landmark = new Sprite(entityTextures[entity.kind]);
    landmark.label = `landmark-${entity.kind}`;
    landmark.anchor.set(0.5, 1);
    landmark.scale.set(entity.width / landmark.texture.width);
    landmark.position.set(entity.x, entity.y);
    landmark.eventMode = 'none';
    landmark.zIndex = 30;
    root.addChild(landmark);
  }
  root.setSelectedCountry();
  return root;
}
