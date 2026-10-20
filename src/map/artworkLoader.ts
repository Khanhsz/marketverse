import { Assets, Container, Sprite, type Texture } from 'pixi.js';
import { ARTWORK_ORDER, WORLD_SIZE } from './atlasLayers';
export type ArtworkManifest={layers:Array<{id:string;file:string;interactive:boolean}>;fallback:string};
export async function loadArtworkStack(manifest:ArtworkManifest):Promise<Container>{
 const root=new Container();root.eventMode='none';
 const loaded:Sprite[]=[];
 try{
  for(const id of ARTWORK_ORDER){
   const entry=manifest.layers.find(l=>l.id===id);
   if(!entry)continue;
   const available=await fetch(entry.file,{method:'HEAD'}).then(r=>r.ok).catch(()=>false);
   if(!available)throw Error('Missing layer '+entry.file);
   const texture:Texture=await Assets.load(entry.file);
   const sprite=new Sprite(texture);sprite.width=WORLD_SIZE.width;sprite.height=WORLD_SIZE.height;sprite.eventMode='none';
   loaded.push(sprite);
  }
  if(loaded.length!==ARTWORK_ORDER.length)throw Error('Incomplete artwork layer stack');
  loaded.forEach(sprite=>root.addChild(sprite));
 }catch{
  root.removeChildren();
  const fallback:Texture=await Assets.load(manifest.fallback);
  const sprite=new Sprite(fallback);sprite.width=WORLD_SIZE.width;sprite.height=WORLD_SIZE.height;sprite.eventMode='none';
  root.addChild(sprite);
 }
 return root;
}
