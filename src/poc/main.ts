import { Application, Container, Graphics, Text } from 'pixi.js';
import './style.css';
import {
  MAP_SIZE, ISLAND, DISTRICTS, generateBuildings, pointInPolygon,
} from './geometry';
import type { Point, District, Building, BuildingKind } from './geometry';

const mount = document.querySelector<HTMLElement>('#poc-map')!;
const inspector = document.querySelector<HTMLElement>('#poc-inspector')!;
const countLabel = document.querySelector<HTMLElement>('#poc-render-count')!;
const zoomLabel = document.querySelector<HTMLElement>('#poc-zoom-label')!;
const buildings = generateBuildings();
const overrides = new Map<string, 'available' | 'active'>();
type Selected = { type: 'district' | 'building'; id: string };
let selected: Selected = { type: 'district', id: 'central' };
let hovered: Selected | null = null;
let layerMode: 'all' | 'districts' | 'buildings' = 'all';
const px = (points: Point[]) => points.flatMap((p) => [p.x, p.y]);
const poly = (graphics: Graphics, points: Point[], color: number, alpha = 1) =>
  graphics.poly(px(points)).fill({ color, alpha });
const c = (x: number, y: number): Point => ({ x, y });
const colors = {
  forest: 0x32764c, land: 0x7ca66b, darkLand: 0x638e61, beach: 0xebdfa6,
  ocean: 0x116a83, river: 0x3ab3c9,
  northport: 0xd5b15f, central: 0x8fc4bc, southbay: 0xe1a878,
};
const districtColors: Record<string, number> = {
  northport: 0xe1b35a, central: 0x94d2ce, southbay: 0xe2a373,
};
const buildingColors: Record<BuildingKind, [number, number, number, number]> = {
  office: [0xb9d6d4, 0x5d8c9b, 0x426b82, 0xb3e5e4],
  retail: [0xeedbbd, 0xc48163, 0x9a5f50, 0xf0e8c9],
  housing: [0xf0dfc5, 0xc69f8b, 0x97766c, 0xf1e8c6],
  warehouse: [0xc9d4d2, 0x778b94, 0x536b77, 0xaed2d2],
  factory: [0xc6d1d6, 0x647e8b, 0x3c5c68, 0x9fc7ce],
};

function seeded(n: number) {
  const x = Math.sin(n * 45.971 + 3.71) * 44661.353;
  return x - Math.floor(x);
}
function polygonScaled(polyPoints: Point[], factor: number): Point[] {
  const cx = polyPoints.reduce((s, p) => s + p.x, 0) / polyPoints.length;
  const cy = polyPoints.reduce((s, p) => s + p.y, 0) / polyPoints.length;
  return polyPoints.map((p) => c(cx + (p.x - cx) * factor, cy + (p.y - cy) * factor));
}
function pathStroke(g: Graphics, points: Point[], width: number, color: number, alpha = 1) {
  if (!points.length) return;
  g.moveTo(points[0].x, points[0].y);
  for (const point of points.slice(1)) g.lineTo(point.x, point.y);
  g.stroke({ width, color, alpha, cap: 'round', join: 'round' });
}
function addText(parent: Container, value: string, x: number, y: number, size: number, color = 0xffffff, weight = '700') {
  const text = new Text({ text: value, style: { fontSize: size, fontFamily: 'Arial', fontWeight: weight, fill: color, letterSpacing: 0.4 } });
  text.position.set(x, y);
  parent.addChild(text);
  return text;
}
function paintWater(parent: Container) {
  const sea = new Graphics();
  sea.rect(-50, -50, MAP_SIZE.width + 100, MAP_SIZE.height + 100).fill(0x086b85);
  for (let row = 0; row < 14; row++) {
    for (let col = 0; col < 21; col++) {
      const n = row * 31 + col * 17;
      const x = col * 79 - 28, y = row * 79 - 24;
      const f = seeded(n);
      poly(sea, [c(x, y), c(x + 83, y - 4), c(x + 84, y + 79)], f > 0.52 ? 0x0b637d : 0x197891, 0.18 + f * 0.18);
      poly(sea, [c(x, y), c(x + 84, y + 79), c(x, y + 81)], f > 0.43 ? 0x3197aa : 0x075870, 0.12 + f * 0.2);
    }
  }
  parent.addChild(sea);
  const coast = new Graphics();
  poly(coast, polygonScaled(ISLAND, 1.065), 0x229bb1, 0.48);
  poly(coast, polygonScaled(ISLAND, 1.038), 0x5ac9d5, 0.68);
  poly(coast, polygonScaled(ISLAND, 1.011), colors.beach, 1);
  poly(coast, ISLAND, colors.land);
  coast.poly(px(ISLAND)).stroke({ width: 3, color: 0x476f56, alpha: 0.6, join: 'round' });
  parent.addChild(coast);
  const islands = new Graphics();
  for (const [x, y, r] of [[125,298,36],[96,348,20],[1369,313,31],[1431,808,34],[288,865,21],[690,927,24]]) {
    poly(islands, [c(x-r,y),c(x-r*.46,y-r*.75),c(x+.35*r,y-r*.9),c(x+r,y-r*.15),c(x+.65*r,y+r*.66),c(x-r*.35,y+r*.8)],0x42b2ba);
    poly(islands, [c(x-r*.82,y),c(x-r*.35,y-r*.66),c(x+.27*r,y-r*.69),c(x+.8*r,y-r*.08),c(x+.52*r,y+r*.57),c(x-r*.25,y+r*.61)],0x91b275);
  }
  parent.addChild(islands);
}
function paintTerrain(parent: Container) {
  const land = new Graphics();
  const zones: Point[][] = [
    [c(395,215),c(515,230),c(665,345),c(555,400),c(480,343)],
    [c(830,170),c(980,175),c(1190,270),c(1090,363),c(910,325)],
    [c(180,578),c(340,575),c(540,730),c(399,817),c(249,730)],
    [c(580,750),c(720,715),c(875,830),c(770,883),c(602,858)],
  ];
  for(const z of zones) poly(land,z,0x4a8259,0.65);
  for(const field of [
    [430,621,95,82],[515,631,93,70],[830,736,120,63],[1094,479,110,71],[1240,502,74,75],[674,239,101,68],
  ]) {
    const [x,y,w,h]=field;
    poly(land,[c(x,y),c(x+w-11,y-4),c(x+w,y+h-12),c(x+10,y+h)],0xb0b46b,0.7);
    for(let r=1;r<4;r++)pathStroke(land,[c(x+8,y+r*h/4),c(x+w-9,y+r*h/4-3)],1,0xe5df9a,.5);
    for(let j=1;j<4;j++)pathStroke(land,[c(x+j*w/4,y),c(x+j*w/4+5,y+h)],1,0x657f51,.35);
  }
  parent.addChild(land);
  const mountains = new Graphics();
  const peaks: Array<[number,number,number,number]>=[
    [749,248,75,88],[828,257,63,102],[920,231,86,122],[1002,271,69,93],[589,305,48,56],
    [306,627,48,64],[394,685,52,74],[544,774,68,81],[665,803,42,52],[1273,422,53,64],
  ];
  for (const [x,y,w,h] of peaks) {
    poly(mountains,[c(x-w,y+15),c(x,y-h),c(x+w*.2,y+21)],0x4c7958);
    poly(mountains,[c(x,y-h),c(x+w*.2,y+21),c(x+w,y+10)],0x285943);
    poly(mountains,[c(x-w*.35,y-h*.25),c(x,y-h),c(x+w*.33,y-h*.27),c(x+w*.02,y-h*.36)],0xf0dfc0);
    poly(mountains,[c(x,y-h),c(x+w*.33,y-h*.27),c(x+w*.12,y-h*.48)],0xd2d4c4);
    pathStroke(mountains,[c(x-w,y+15),c(x,y-h),c(x+w,y+10)],1.5,0x2d5145,.4);
  }
  parent.addChild(mountains);
}
function paintWaterways(parent: Container) {
  const river = new Graphics();
  const pts=[c(620,186),c(599,252),c(629,318),c(607,385),c(620,460),c(684,539),c(721,597),c(745,668),c(735,754),c(769,891)];
  pathStroke(river,pts,52,0xc2e0b8,.62);
  pathStroke(river,pts,39,0x217f9b);
  pathStroke(river,pts,29,0x39b5c8);
  pathStroke(river,[c(749,590),c(818,625),c(903,693),c(995,742),c(1126,814)],31,0x258ba6);
  pathStroke(river,[c(749,590),c(818,625),c(903,693),c(995,742),c(1126,814)],22,0x42b4cc);
  poly(river,[c(579,503),c(625,482),c(671,507),c(694,552),c(659,574),c(604,564)],0x52bdc7,.9);
  parent.addChild(river);
}
function paintRoads(parent: Container) {
  const roads = new Graphics();
  const main: Point[][]=[
    [c(212,493),c(384,504),c(535,519),c(625,493),c(734,492),c(915,516),c(1166,536),c(1349,505)],
    [c(326,321),c(445,403),c(612,413),c(719,392),c(915,362),c(1184,427),c(1330,533)],
    [c(408,536),c(462,658),c(671,705),c(863,692),c(1040,698),c(1220,742)],
    [c(793,315),c(793,428),c(846,549),c(885,672)],
    [c(1082,419),c(1130,549),c(1176,688)],
  ];
  for(const road of main){pathStroke(roads,road,21,0x425e57,.78);pathStroke(roads,road,17,0xd6d5c1);pathStroke(roads,road,11,0x777a6f);pathStroke(roads,road,1.5,0xe9db9d,.8);}
  // Straight local roads show that the districts are built on structured street networks.
  const local:Point[][]=[
    [c(255,389),c(539,421)],[c(283,450),c(568,488)],[c(350,303),c(357,541)],[c(432,304),c(450,545)],
    [c(672,452),c(1075,448)],[c(695,555),c(1087,575)],[c(732,344),c(737,653)],[c(930,330),c(929,658)],
    [c(1019,681),c(1324,716)],[c(1036,752),c(1280,773)],[c(1108,603),c(1114,790)],[c(1224,604),c(1233,782)],
  ];
  for(const road of local){pathStroke(roads,road,12,0xbdd2b9);pathStroke(roads,road,9,0x7b8680);}
  // Bridge deck crossing the central river.
  pathStroke(roads,[c(573,465),c(689,494)],24,0x47615b);
  pathStroke(roads,[c(573,465),c(689,494)],17,0xc7c8b8);
  pathStroke(roads,[c(573,465),c(689,494)],10,0x687877);
  parent.addChild(roads);
}
function paintNature(parent: Container) {
  const trees = new Graphics();
  let painted=0;
  for(let i=0;i<380;i++) {
    const x=135+seeded(i*19+1)*1265, y=206+seeded(i*31+3)*657;
    if(!pointInPolygon(c(x,y),ISLAND)||DISTRICTS.some(d=>pointInPolygon(c(x,y),d.points))) continue;
    const size=6+seeded(i*7+2)*10;
    poly(trees,[c(x-5,y+6),c(x+3,y+6),c(x+2,y+size*.4),c(x-3,y+size*.4)],0x785d40);
    poly(trees,[c(x-size*.67,y+2),c(x,y-size),c(x+size*.65,y+2)],i%3?0x266346:0x397a4e);
    poly(trees,[c(x-size*.5,y-4),c(x,y-size),c(x+size*.19,y-3)],i%2?0x4a9461:0x2d7b4c,.65);
    painted++;
  }
  parent.addChild(trees);
  return painted;
}
function paintDocks(parent: Container) {
  const docks = new Graphics();
  for(let i=0;i<5;i++){
    const x=219+i*31,y=378-i*18;
    poly(docks,[c(x,y),c(x+46,y-16),c(x+52,y-7),c(x+5,y+9)],0x81999b);
    pathStroke(docks,[c(x+25,y-8),c(x+25,y-38),c(x+37,y-46)],2,0xe1b456);
  }
  for(let i=0;i<4;i++){
    const x=1265+i*26,y=748-i*16;
    poly(docks,[c(x,y),c(x+60,y+4),c(x+60,y+14),c(x,y+8)],0x849d9b);
    pathStroke(docks,[c(x+29,y+3),c(x+29,y-21),c(x+44,y-26)],2,0xe8ad62);
  }
  for(const [x,y] of [[137,410],[1378,665],[1402,840]]){
    poly(docks,[c(x-21,y+5),c(x-9,y-6),c(x+15,y-6),c(x+29,y+5),c(x+17,y+13),c(x-10,y+13)],0xf7f1d5);
    pathStroke(docks,[c(x,y-5),c(x,y+13)],2,0x265465);
  }
  parent.addChild(docks);
}
function makeBuilding(b: Building) {
  const group = new Container();
  group.position.set(b.x,b.y);
  const graphic=new Graphics();
  const selectedOutline=new Graphics();
  const [roof,front,right,glass]=buildingColors[b.kind];
  const h=b.height;
  // Isometric left/right elevations, roof and cast shadow are each independent polygons.
  poly(graphic,[c(-25,5),c(2,22),c(33,8),c(5,-8)],0x203c36,.25);
  poly(graphic,[c(-24,-h-11),c(0,-h),c(0,0),c(-24,-12)],front);
  poly(graphic,[c(0,-h),c(29,-h-14),c(29,-13),c(0,0)],right);
  poly(graphic,[c(-24,-h-11),c(5,-h-26),c(29,-h-14),c(0,-h)],roof);
  graphic.poly([-24,-h-11,5,-h-26,29,-h-14,0,-h]).stroke({width:1.2,color:0x375964,alpha:.6});
  if(b.kind==='warehouse'||b.kind==='factory'){
    for(let i=0;i<3;i++)poly(graphic,[c(-19+i*7,-h-13),c(-11+i*7,-h-17),c(-8+i*7,-h-14),c(-16+i*7,-h-10)],0xa1b2b4);
    poly(graphic,[c(-18,-17),c(-4,-10),c(-4,-1),c(-18,-8)],0xcedee0,.9);
  }else{
    for(let row=0;row<Math.min(6,Math.floor((h-5)/14));row++){
      for(let col=0;col<2;col++){
        const ry=-h+7+row*13;
        poly(graphic,[c(-20+col*9,ry-8+col*4),c(-14+col*9,ry-5+col*4),c(-14+col*9,ry+3+col*4),c(-20+col*9,ry+0+col*4)],glass,.86);
        poly(graphic,[c(4+col*10,ry+6-col*5),c(11+col*10,ry+2-col*5),c(11+col*10,ry+9-col*5),c(4+col*10,ry+13-col*5)],glass,.73);
      }
    }
    if(b.kind==='retail')poly(graphic,[c(-21,-18),c(-3,-9),c(-3,-3),c(-21,-12)],0xe4a357);
  }
  selectedOutline.poly([-29,-h-14,5,-h-32,34,-h-16,34,-11,0,7,-29,-10,-29,-h-14]).stroke({width:3,color:0xe8ffff,alpha:0.96});
  selectedOutline.visible=false;
  const hit=new Graphics().rect(-28,-h-29,64,h+40).fill({color:0xffffff,alpha:.001});
  hit.eventMode='static';hit.cursor='pointer';
  group.addChild(graphic,selectedOutline,hit);
  return {group,outline:selectedOutline,hit};
}
function paintDistrict(parent: Container,d: District){
  const gfx=new Graphics();
  gfx.eventMode='static';
  gfx.cursor='pointer';
  parent.addChild(gfx);
  return gfx;
}
function paintCityLabel(parent:Container, district:District) {
  const label=new Container();
  const x = district.id==='northport'?337: district.id==='central'?806:1131;
  const y = district.id==='northport'?291:district.id==='central'?329:589;
  const name = district.id==='northport'?'NORTHPORT':district.id==='central'?'CENTRAL CITY':'SOUTH BAY';
  const width = name.length*10+43;
  const bg=new Graphics().roundRect(-10,-9,width,34,6).fill({color:0x1c342b,alpha:.96})
    .roundRect(-10,-9,width,34,6).stroke({color:0x7bb4a0,width:1,alpha:.7});
  label.addChild(bg);
  addText(label,name,1,0,17,0xffffff);
  label.position.set(x,y);
  parent.addChild(label);
}
function inspectorMarkup() {
  const building=selected.type==='building'?buildings.find(b=>b.id===selected.id):undefined;
  const district=selected.type==='district'
    ?DISTRICTS.find(d=>d.id===selected.id)
    :DISTRICTS.find(d=>d.id===building?.districtId);
  if(!district)return;
  const status = building ? (overrides.get(building.id)??building.state) : null;
  const title=building?.name??district.name;
  const type=building?'BUILDING ENTITY':'DISTRICT POLYGON';
  const desc=building
    ?'Một tòa nhà 2.5D có geometry và hitbox độc lập. Trạng thái có thể đổi thử trong sandbox.'
    :district.purpose;
  const rows=building?[
    ['Entity ID',building.id],['Loại',building.kind],['Tầng',String(building.floors)],
    ['Chiều cao',Math.round(building.height)+' units'],['District',district.name],
  ]:[
    ['District ID',district.id],['Loại',district.kind],['Đỉnh polygon',String(district.points.length)],
    ['Land value',new Intl.NumberFormat('vi-VN').format(district.landValue)+' CR/m²'],
    ['Lượt tiếp cận mẫu',new Intl.NumberFormat('vi-VN').format(district.visitors)],
  ];
  inspector.innerHTML=`
  <div class="poc-inspector-kicker">${type}</div>
  <h1 class="poc-inspector-title">${title}</h1>
  <p class="poc-inspector-description">${desc}</p>
  <div class="poc-inspector-status"><i></i>${status ? (status==='active'?'Đang hoạt động':'Chưa sử dụng') : 'Vùng được chọn'}</div>
  <dl class="poc-property-list">${rows.map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
  ${building?`<button id="poc-state-action" class="poc-inspector-action">Đổi trạng thái công trình ↔</button>
  <div class="poc-inspector-note">Chỉ thay đổi trạng thái hiển thị trong POC, không ghi vào save.</div>`:
  `<p class="poc-inspector-note">Click vào từng tòa nhà để xem dữ liệu và đổi trạng thái.</p>`}
  `;
  inspector.querySelector('#poc-state-action')?.addEventListener('click',()=>{
    if(!building)return;
    const current=overrides.get(building.id)??building.state;
    overrides.set(building.id,current==='active'?'available':'active');
    mount.dataset.changedBuilding=building.id;
    inspectorMarkup();
    redraw();
  });
}
const app=new Application();
let world:Container;
let districtViews:Map<string,Graphics>;
let buildingViews:Map<string,ReturnType<typeof makeBuilding>>;
let camera={x:MAP_SIZE.width/2,y:MAP_SIZE.height/2,scale:1};
let width=1,height=1,fitScale=1;
let drawReady=false;
function redraw(){
  if(!drawReady)return;
  for(const [id,g] of districtViews){
    const district=DISTRICTS.find(d=>d.id===id)!;
    const active=selected.type==='district'&&selected.id===id;
    const hover=hovered?.type==='district'&&hovered.id===id;
    g.clear();
    const alpha=layerMode==='buildings'?.06:active?.28:layerMode==='districts'?.33:.17;
    poly(g,district.points,districtColors[id],alpha);
    g.poly(px(district.points)).stroke({width:active?5:hover?4:layerMode==='districts'?3:2,color:active?0xb4fff0:hover?0xf7e8ae:0xe4f3dd,alpha:active?1:.78});
  }
  for(const [id,obj] of buildingViews){
    const building=buildings.find(b=>b.id===id)!;
    const active=selected.type==='building'&&selected.id===id;
    const hover=hovered?.type==='building'&&hovered.id===id;
    obj.outline.visible=active||hover;
    obj.outline.alpha=active?1:.65;
    if((overrides.get(id)??building.state)==='active')obj.group.alpha=1;
    else obj.group.alpha=layerMode==='districts'?.56:.84;
  }
  mount.dataset.selected=`${selected.type}:${selected.id}`;
  mount.dataset.layer=layerMode;
  requestAnimationFrame(()=>app.render());
}
function select(selection:Selected){
  selected=selection;
  inspectorMarkup();
  redraw();
}
function cameraApply(){
  world.scale.set(camera.scale);
  world.position.set(width/2-camera.x*camera.scale,height/2-camera.y*camera.scale);
  zoomLabel.textContent=Math.round(camera.scale/fitScale*100)+'%';
  mount.dataset.camera=JSON.stringify(camera);
  app.render();
}
function fit(){
  fitScale=Math.min(width/MAP_SIZE.width,height/MAP_SIZE.height)*.98;
  camera={x:MAP_SIZE.width/2,y:MAP_SIZE.height/2,scale:fitScale};
  cameraApply();
}
function zoom(factor:number,screenX=width/2,screenY=height/2){
  const next=Math.max(fitScale*.75,Math.min(fitScale*5,camera.scale*factor));
  const wX=camera.x+(screenX-width/2)/camera.scale;
  const wY=camera.y+(screenY-height/2)/camera.scale;
  camera.x=wX-(screenX-width/2)/next;
  camera.y=wY-(screenY-height/2)/next;
  camera.scale=next;
  cameraApply();
}
async function initialize() {
  await app.init({background:'#0b667e',antialias:true,resolution:Math.min(2,window.devicePixelRatio||1),autoDensity:true});
  mount.appendChild(app.canvas);
  app.canvas.tabIndex=0;
  app.canvas.setAttribute('role','application');
  app.canvas.setAttribute('aria-label','Bản đồ polygon PixiJS — kéo để di chuyển, cuộn để phóng to');
  app.stop();
  world=new Container();
  app.stage.addChild(world);
  const back=new Container();world.addChild(back);
  paintWater(back);paintTerrain(back);paintWaterways(back);
  const landZone=new Container();world.addChild(landZone);
  districtViews=new Map();
  for(const d of DISTRICTS){
    const gfx=paintDistrict(landZone,d);
    districtViews.set(d.id,gfx);
    gfx.on('pointertap',()=>{if(!pointerMoved)select({type:'district',id:d.id});});
    gfx.on('pointerover',()=>{hovered={type:'district',id:d.id};redraw();});
    gfx.on('pointerout',()=>{if(hovered?.id===d.id){hovered=null;redraw();}});
  }
  const infrastructure=new Container();world.addChild(infrastructure);
  paintRoads(infrastructure);paintDocks(infrastructure);
  const foliage=new Container();world.addChild(foliage);
  const treeCount=paintNature(foliage);
  const blocks=new Container();world.addChild(blocks);
  buildingViews=new Map();
  for(const b of [...buildings].sort((a,b)=>a.y-b.y)){
    const obj=makeBuilding(b);
    obj.hit.on('pointertap',()=>{if(!pointerMoved)select({type:'building',id:b.id});});
    obj.hit.on('pointerover',()=>{hovered={type:'building',id:b.id};redraw();});
    obj.hit.on('pointerout',()=>{if(hovered?.id===b.id){hovered=null;redraw();}});
    buildingViews.set(b.id,obj);
    blocks.addChild(obj.group);
  }
  const labels=new Container();world.addChild(labels);
  for(const d of DISTRICTS)paintCityLabel(labels,d);
  const stats=buildings.length+DISTRICTS.length+treeCount+ISLAND.length;
  countLabel.textContent=stats.toLocaleString('vi-VN');
  mount.dataset.buildings=String(buildings.length);
  mount.dataset.districts=String(DISTRICTS.length);
  mount.dataset.geometryOnly='true';
  drawReady=true;
  const measure=()=>{
    const rect=mount.getBoundingClientRect();
    width=Math.max(1,Math.round(rect.width));
    height=Math.max(1,Math.round(rect.height));
    app.renderer.resize(width,height);
    fit();
  };
  const observer=new ResizeObserver(measure);
  observer.observe(mount);
  measure();redraw();
  mount.dataset.ready='true';
  let drag:{x:number;y:number;cx:number;cy:number}|null=null;
  const canvas=app.canvas;
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;
    drag={x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y};
    pointerMoved=false;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!drag)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(Math.hypot(dx,dy)>5)pointerMoved=true;
    if(!pointerMoved)return;
    camera.x=drag.cx-dx/camera.scale;
    camera.y=drag.cy-dy/camera.scale;
    cameraApply();
  });
  canvas.addEventListener('pointerup',()=>{drag=null;setTimeout(()=>pointerMoved=false,0);});
  canvas.addEventListener('pointercancel',()=>{drag=null;pointerMoved=false;});
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    const rect=canvas.getBoundingClientRect();
    zoom(e.deltaY<0?1.15:1/1.15,e.clientX-rect.left,e.clientY-rect.top);
  },{passive:false});
  canvas.addEventListener('keydown',e=>{
    if(e.key==='+'||e.key==='='){e.preventDefault();zoom(1.2);}
    if(e.key==='-'){e.preventDefault();zoom(1/1.2);}
    if(e.key==='Home'){e.preventDefault();fit();}
    const move=38/camera.scale;
    if(e.key==='ArrowLeft')camera.x-=move;
    else if(e.key==='ArrowRight')camera.x+=move;
    else if(e.key==='ArrowUp')camera.y-=move;
    else if(e.key==='ArrowDown')camera.y+=move;
    else return;
    e.preventDefault();cameraApply();
  });
  document.getElementById('poc-zoom-in')?.addEventListener('click',()=>zoom(1.25));
  document.getElementById('poc-zoom-out')?.addEventListener('click',()=>zoom(1/1.25));
  document.getElementById('poc-fit')?.addEventListener('click',fit);
  document.querySelectorAll<HTMLButtonElement>('[data-layer]').forEach(button=>{
    button.addEventListener('click',()=>{
      layerMode=button.dataset.layer as typeof layerMode;
      document.querySelectorAll<HTMLButtonElement>('[data-layer]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      redraw();
    });
  });
}
let pointerMoved=false;
inspectorMarkup();
void initialize().catch(error=>{
  mount.dataset.error=error instanceof Error?error.message:String(error);
  inspector.innerHTML='<h1 class="poc-inspector-title">Không tải được bản đồ</h1><p class="poc-inspector-description">Thử tải lại trang để khởi động PixiJS.</p>';
});
