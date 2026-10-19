import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';
import type { City, Facility } from '../engine/game';
import { fitCamera, MAP_UNITS, panCamera, screenToWorld, zoomCamera } from './camera';
import type { Camera, Viewport } from './camera';

type Props = { cities: City[]; facilities: Facility[]; selectedCityId: string; onSelect: (id: string) => void };
const layers = ['Market', 'Competition', 'Operations', 'Logistics', 'Economy'] as const;
type Layer = typeof layers[number];
const legends: Record<Layer, string> = {
  Market: 'Population · Value / Mainstream / Premium segments',
  Competition: 'Dark green: NOVA · Slate: VECTRA · Ochre: ATLAS',
  Operations: 'Facility labels show existing assets; production is not simulated',
  Logistics: 'Existing transport links · Lead times and costs not yet simulated',
  Economy: 'Purchasing power relative to national baseline · No live sales yet',
};
const ownerColor = (id: string) => id === 'player' ? 0x24554b : id === 'value' ? 0x6a7e96 : 0x9a7845;

export function CountryMap(props: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const current = useRef(props); current.current = props;
  const [layer, setLayer] = useState<Layer>('Market');
  const layerRef = useRef<Layer>(layer); layerRef.current = layer;
  const draw = useRef<() => void>(() => {});
  const controls = useRef<(action: 'in' | 'out' | 'reset') => void>(() => {});
  const [failure, setFailure] = useState('');

  useEffect(() => {
    const element = mount.current;
    if (!element) return;
    let disposed = false;
    let initialized = false;
    let observer: ResizeObserver | undefined;
    let cleanup = () => {};
    const app = new Application();
    void app.init({ background: '#e9eeec', antialias: true, resolution: window.devicePixelRatio || 1, autoDensity: true }).then(() => {
      initialized = true;
      if (disposed) { app.destroy(true, { children: true }); return; }
      element.appendChild(app.canvas);
      const world = new Container(); app.stage.addChild(world);
      let view: Viewport = { width: element.clientWidth, height: element.clientHeight };
      let camera: Camera = fitCamera(view);
      const applyCamera = () => {
        world.scale.set(camera.scale);
        world.position.set(view.width / 2 - camera.x * camera.scale, view.height / 2 - camera.y * camera.scale);
        element.dataset.camera = JSON.stringify(camera);
        element.dataset.layer = layerRef.current;
      };
      const label = (text: string, x: number, y: number, size = 22, color = 0x41594f) => {
        const caption = new Text({ text, style: { fill: color, fontSize: size, fontFamily: 'Arial', fontWeight: 'bold' } });
        caption.position.set(x, y); world.addChild(caption);
      };
      draw.current = () => {
        for (const child of world.removeChildren()) child.destroy();
        const { cities, facilities, selectedCityId } = current.current;
        const active = layerRef.current;
        const territory = new Graphics();
        territory.poly([280,136,385,78,521,106,611,74,750,141,790,226,746,321,801,420,717,521,586,553,505,496,389,515,317,416,243,360,274,280,226,230].map(n => n * MAP_UNITS)).fill(0xd4ddda).stroke({ color: 0xaebeb8, width: 4 });
        world.addChild(territory);
        const roads = new Graphics();
        for (const city of cities) for (const id of city.links) {
          const other = cities.find(c => c.id === id);
          if (!other || city.id >= id) continue;
          roads.moveTo(city.x * MAP_UNITS, city.y * MAP_UNITS).lineTo(other.x * MAP_UNITS, other.y * MAP_UNITS);
          if (active === 'Logistics') label('TRANSPORT LINK', (city.x + other.x) * MAP_UNITS / 2 + 20, (city.y + other.y) * MAP_UNITS / 2, 16);
        }
        roads.stroke({ color: active === 'Logistics' ? 0x618c80 : 0xf8faf8, width: active === 'Logistics' ? 10 : 7 }); world.addChildAt(roads, 1);
        for (const city of cities) {
          const x = city.x * MAP_UNITS, y = city.y * MAP_UNITS;
          const selected = city.id === selectedCityId;
          if (active === 'Market' || active === 'Economy') {
            const halo = new Graphics().circle(x, y, active === 'Market' ? Math.sqrt(city.population) / 16 : city.power * 50).fill({ color: active === 'Market' ? 0x82a898 : 0xb9ad83, alpha: 0.26 });
            world.addChild(halo);
          }
          if (selected) world.addChild(new Graphics().circle(x, y, 36).stroke({ color: 0x24554b, width: 3 }));
          world.addChild(new Graphics().roundRect(x - 15, y - 15, 30, 30, 6).fill(selected ? 0x24554b : 0x6d8880));
          label(city.name.toUpperCase(), x + 40, y - 18);
          if (active === 'Market') label(`${(city.population / 1000000).toFixed(2)}M · ${Object.values(city.segments).map(v => Math.round(v * 100)).join(' / ')}%`, x + 40, y + 12, 16);
          if (active === 'Economy') label(`PURCHASING POWER ${city.power.toFixed(2)}×`, x + 40, y + 12, 16);
          const assets = facilities.filter(f => f.cityId === city.id);
          assets.forEach((f, index) => {
            const fx = x - 28 + index * 32, fy = y + 52;
            world.addChild(new Graphics().rect(fx - 9, fy - 9, 18, 18).fill(ownerColor(f.companyId)));
            if (active === 'Operations' || active === 'Competition') label(active === 'Operations' ? `${f.name} · ${f.kind.toUpperCase()}` : `${f.companyId === 'player' ? 'NOVA' : f.companyId.toUpperCase()} · ${f.name}`, x + 40, y + 30 + index * 26, 16, ownerColor(f.companyId));
          });
        }
        applyCamera();
      };
      const resize = () => {
        view = { width: element.clientWidth, height: element.clientHeight };
        app.renderer.resize(view.width, view.height); applyCamera();
      };
      resize(); draw.current();
      observer = new ResizeObserver(resize); observer.observe(element);
      const point = (event: PointerEvent | WheelEvent) => { const rect = element.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
      let gesture: { id: number; startX: number; startY: number; lastX: number; lastY: number; dragged: boolean } | undefined;
      const down = (event: PointerEvent) => {
        if (event.button !== 0 || !event.isPrimary || gesture) return;
        const p = point(event); gesture = { id: event.pointerId, startX: p.x, startY: p.y, lastX: p.x, lastY: p.y, dragged: false };
        app.canvas.setPointerCapture(event.pointerId);
      };
      const move = (event: PointerEvent) => {
        if (!gesture || gesture.id !== event.pointerId) return;
        const p = point(event);
        if (Math.hypot(p.x - gesture.startX, p.y - gesture.startY) > 5) gesture.dragged = true;
        if (gesture.dragged) { camera = panCamera(camera, p.x - gesture.lastX, p.y - gesture.lastY); applyCamera(); }
        gesture.lastX = p.x; gesture.lastY = p.y;
        app.canvas.style.cursor = gesture.dragged ? 'grabbing' : 'grab';
      };
      const end = (event: PointerEvent) => {
        if (!gesture || gesture.id !== event.pointerId) return;
        const p = point(event);
        const clicked = event.type === 'pointerup' && !gesture.dragged && Math.hypot(p.x - gesture.startX, p.y - gesture.startY) <= 5;
        gesture = undefined;
        if (app.canvas.hasPointerCapture(event.pointerId)) app.canvas.releasePointerCapture(event.pointerId);
        app.canvas.style.cursor = 'grab';
        if (clicked) {
          const w = screenToWorld(camera, view, p);
          const city = current.current.cities.find(c => Math.hypot(c.x * MAP_UNITS - w.x, c.y * MAP_UNITS - w.y) <= Math.max(20, 12 / camera.scale));
          if (city) current.current.onSelect(city.id);
        }
      };
      const wheel = (event: WheelEvent) => {
        event.preventDefault();
        const pixels = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? view.height : 1);
        camera = zoomCamera(camera, view, point(event), Math.exp(-Math.max(-500, Math.min(500, pixels)) * 0.002)); applyCamera();
      };
      controls.current = action => {
        camera = action === 'reset' ? fitCamera(view) : zoomCamera(camera, view, { x: view.width / 2, y: view.height / 2 }, action === 'in' ? 1.3 : 1 / 1.3); applyCamera();
      };
      app.canvas.addEventListener('pointerdown', down);
      app.canvas.addEventListener('pointermove', move);
      app.canvas.addEventListener('pointerup', end);
      app.canvas.addEventListener('pointercancel', end);
      app.canvas.addEventListener('lostpointercapture', end);
      app.canvas.addEventListener('wheel', wheel, { passive: false });
      cleanup = () => {
        app.canvas.removeEventListener('pointerdown', down); app.canvas.removeEventListener('pointermove', move);
        app.canvas.removeEventListener('pointerup', end); app.canvas.removeEventListener('pointercancel', end);
        app.canvas.removeEventListener('lostpointercapture', end); app.canvas.removeEventListener('wheel', wheel);
      };
    }).catch(error => { if (!disposed) setFailure(String(error)); });
    return () => { disposed = true; observer?.disconnect(); cleanup(); draw.current = () => {}; controls.current = () => {}; if (initialized) app.destroy(true, { children: true }); };
  }, []);
  useEffect(() => { draw.current(); }, [props.cities, props.facilities, props.selectedCityId, layer]);
  return <div className="map" data-error={failure || undefined}>
    <div ref={mount} className="mapSurface" role="img" aria-label="Country strategy map with selectable cities" />
    <div className="mapLayers" role="group" aria-label="Map layers">{layers.map(name => <button key={name} aria-pressed={layer === name} onClick={() => setLayer(name)}>{name}</button>)}</div>
    <div className="mapControls" role="group" aria-label="Map camera"><button aria-label="Zoom in" onClick={() => controls.current('in')}>+</button><button aria-label="Zoom out" onClick={() => controls.current('out')}>−</button><button onClick={() => controls.current('reset')}>Reset view</button></div>
    <p className="mapLegend" aria-live="polite">{failure ? `Map unavailable: ${failure}` : legends[layer]}<span>Drag to pan · Scroll to zoom · Select a city</span></p>
  </div>;
}
