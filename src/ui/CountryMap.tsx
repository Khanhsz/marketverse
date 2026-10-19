import { useEffect,useRef } from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';
import type { City, Facility } from '../engine/game';
type Props={cities:City[];facilities:Facility[];selectedCityId:string;onSelect:(id:string)=>void};
const W=960,H=640;
export function CountryMap({cities,facilities,selectedCityId,onSelect}:Props){
 const mount=useRef<HTMLDivElement>(null),callback=useRef(onSelect);callback.current=onSelect;
 useEffect(()=>{
  const element=mount.current;if(!element)return;
  let disposed=false,ready=false;const app=new Application();let ro:ResizeObserver|undefined;
  void app.init({background:'#e9eeec',antialias:true,resizeTo:element}).then(()=>{
   ready=true;if(disposed){app.destroy(true,{children:true});return;}
   element.appendChild(app.canvas);
   const world=new Container();app.stage.addChild(world);
   const backdrop=new Graphics();backdrop.rect(0,0,W,H).fill(0xe9eeec);world.addChild(backdrop);
   const territory=new Graphics();
   territory.poly([280,136,385,78,521,106,611,74,750,141,790,226,746,321,801,420,717,521,586,553,505,496,389,515,317,416,243,360,274,280,226,230]).fill(0xd4ddda).stroke({color:0xaebeb8,width:2});
   world.addChild(territory);
   const roads=new Graphics();
   for(const city of cities)for(const id of city.links){const n=cities.find(x=>x.id===id);if(n&&city.id<id)roads.moveTo(city.x,city.y).lineTo(n.x,n.y);}
   roads.stroke({color:0xf8faf8,width:8});world.addChild(roads);
   for(const city of cities){
    const x=city.x,y=city.y,selected=city.id===selectedCityId;
    if(selected){const ring=new Graphics();ring.circle(x,y,29).stroke({color:0x2f6258,width:1.5});world.addChild(ring);}
    const pin=new Graphics();pin.roundRect(x-10,y-10,20,20,4).fill(selected?0x24554b:0x6d8880);
    pin.eventMode='static';pin.cursor='pointer';pin.on('pointertap',()=>callback.current(city.id));world.addChild(pin);
    const caption=new Text({text:city.name.toUpperCase(),style:{fill:0x41594f,fontSize:12,fontFamily:'Arial',fontWeight:'bold'}});
    caption.position.set(x+18,y-8);world.addChild(caption);
   }
   for(const f of facilities){const c=cities.find(x=>x.id===f.cityId);if(!c)continue;const dot=new Graphics();dot.circle(c.x+(f.companyId==='player'?-20:20),c.y+24,5).fill(f.companyId==='player'?0x21493f:0x91a49d);world.addChild(dot);}
   const resize=()=>{const scale=Math.min(app.renderer.width/W,app.renderer.height/H);world.scale.set(scale);world.position.set((app.renderer.width-W*scale)/2,(app.renderer.height-H*scale)/2);};
   resize();ro=new ResizeObserver(resize);ro.observe(element);
  }).catch(error=>{if(!disposed)element.setAttribute('data-error',String(error));});
  return ()=>{disposed=true;ro?.disconnect();if(ready)app.destroy(true,{children:true});};
 },[cities,facilities,selectedCityId]);
 return <div ref={mount} className="map" role="img" aria-label="Country strategy map with selectable cities"/>;
}
