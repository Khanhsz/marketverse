import { Assets, Container, Sprite, type Texture } from 'pixi.js';
import { ARTWORK_ORDER, WORLD_SIZE } from './atlasLayers';
export type ArtworkManifest={primary?:string;layers:Array<{id:string;file:string;interactive:boolean}>;fallback:string};
async function loadSprite(path:string):Promise<Sprite>{
 const response=await fetch(path,{method:'GET'});
 if(!response.ok || !(response.headers.get('content-type')||'').startsWith('image/')) throw new Error('Artwork unavailable: '+path);
 const texture:Texture=await Assets.load(path);
 const sprite=new Sprite(texture);
 sprite.width=WORLD_SIZE.width;sprite.height=WORLD_SIZE.height;sprite.eventMode='none';
 return sprite;
}
export async function loadArtworkStack(manifest:ArtworkManifest):Promise<Container>{
 const root=new Container();root.eventMode='none';
 // The approved UI-free map is the first-choice artwork. Game entities stay interactive above it.
 if(manifest.primary){
  try{root.addChild(await loadSprite(manifest.primary));return root;}catch(error){console.warn('Primary artwork not yet deployed',error);}
 }
 const sprites:Sprite[]=[];
 try{
  for(const id of ARTWORK_ORDER){
   const entry=manifest.layers.find(l=>l.id===id);
   if(!entry)throw new Error('Missing artwork layer '+id);
   sprites.push(await loadSprite(entry.file));
  }
  sprites.forEach(sprite=>root.addChild(sprite));
 }catch{
  sprites.forEach(sprite=>sprite.destroy());
  root.addChild(await loadSprite(manifest.fallback));
 }
 return root;
}
