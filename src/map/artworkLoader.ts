import { Assets, Container, Sprite, type Texture } from 'pixi.js';
import { WORLD_SIZE } from './atlasLayers';

/** The UI-free country artwork is required. Game markers remain separate Pixi children. */
export async function loadArtworkStack():Promise<Container>{
 const path='/marketverse-v6-map-clean.png';
 const response=await fetch(path,{method:'GET'});
 if(!response.ok || !(response.headers.get('content-type')||'').startsWith('image/'))
  throw new Error('Required country artwork is missing: '+path);
 const texture:Texture=await Assets.load(path);
 const sprite=new Sprite(texture);
 sprite.width=WORLD_SIZE.width;
 sprite.height=WORLD_SIZE.height;
 sprite.eventMode='none';
 const root=new Container();
 root.eventMode='none';
 root.addChild(sprite);
 return root;
}
