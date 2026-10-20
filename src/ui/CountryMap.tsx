import type { CityMetrics } from '../engine/analytics';
import { useEffect, useRef, useState } from 'react';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { loadArtworkStack } from '../map/artworkLoader';
import { MAP_MODES } from '../map/atlasLayers';
import type { City, Facility, Company, Product } from '../engine/game';
import type { Factory, StockLot } from '../engine/operations';
import { fitCamera, MAP_UNITS, panCamera, screenToWorld, zoomCamera } from './camera';
import type { Camera, Viewport } from './camera';
import type { Selection } from '../engine/entities';
import { resolveLabels } from '../map/labels';

type Props = {
  cities: City[];
  facilities: Facility[];
  companies: Company[];
  selectedCityId: string;
  selection: Selection;
  metrics: CityMetrics[];
  products: Product[];
  stocks: StockLot[];
  factories: Factory[];
  playerId: string;
  activeLayer: Layer;
  onSelect: (selection: Selection) => void;
};
const layers = ['Market', 'Competition', 'Operations', 'Logistics', 'Economy'] as const;
type Layer = (typeof layers)[number];
const legends: Record<Layer, string> = {
  Market: 'Population and last resolved week potential buyers',
  Competition: 'Week 1: company presence by city · after sales: measured market share',
  Operations: 'Facility labels show existing assets; select for operational details',
  Logistics: 'Routes: 100 dispatch + 2 credits/unit/link · 1–3 weeks · incoming player cargo',
  Economy: 'Purchasing power relative to national baseline',
};
const layerColors: Record<Layer, number> = Object.fromEntries(
  Object.entries(MAP_MODES).map(([name, mode]) => [name, mode.color]),
) as Record<Layer, number>;
const layerNames: Record<Layer, string> = {
  Market: 'Demand intensity',
  Competition: 'Company presence / market share',
  Operations: 'Operating facilities',
  Logistics: 'Incoming cargo & routes',
  Economy: 'Purchasing power',
};
const ownerColor = (id: string) =>
  id === 'player' ? 0x24554b : id === 'value' ? 0x6a7e96 : 0x9a7845;

export function CountryMap(props: Props) {
  const mount = useRef<HTMLDivElement>(null);
  const current = useRef(props);
  current.current = props;
  const [layer, setLayer] = useState<Layer>(props.activeLayer);
  useEffect(() => {
    setLayer(props.activeLayer);
  }, [props.activeLayer]);
  const [layerMenuOpen, setLayerMenuOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'National' | 'Regional' | 'Business'>('National');
  const layerRef = useRef<Layer>(layer);
  layerRef.current = layer;
  const draw = useRef<() => void>(() => {});
  const controls = useRef<(action: 'in' | 'out' | 'reset' | 'focus') => void>(() => {});
  const [failure, setFailure] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [selectedLegend, setSelectedLegend] = useState(true);

  useEffect(() => {
    const element = mount.current;
    if (!element) return;
    setFailure('');
    delete element.dataset.camera;
    delete element.dataset.artwork;
    let disposed = false;
    let initialized = false;
    let destroyed = false;
    let artwork: Container | undefined;
    const destroyApplication = () => {
      artwork?.destroy({ children: true, texture: true, textureSource: true });
      artwork = undefined;
      if (initialized && !destroyed) {
        destroyed = true;
        app.destroy(true, { children: true });
      }
    };
    let renderFrame = 0;
    let observer: ResizeObserver | undefined;
    let cleanup = () => {};
    const app = new Application();
    void app
      .init({
        background: '#edf1ee',
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      .then(async () => {
        initialized = true;
        if (disposed) {
          destroyApplication();
          return;
        }
        app.stop(); // The map is static between interactions; render only when dirty.
        const artworkStack = await loadArtworkStack();
        artwork = artworkStack;
        if (disposed) {
          destroyApplication();
          return;
        }
        element.dataset.artwork = 'ready';
        element.appendChild(app.canvas);
        app.canvas.tabIndex = 0;
        app.canvas.setAttribute('role', 'application');
        app.canvas.setAttribute(
          'aria-label',
          'Country map: arrow keys pan, plus or minus zoom, Home fits view',
        );
        const labels: {
          caption: Text;
          size: number;
          selected: boolean;
          id: string;
          anchorX: number;
          anchorY: number;
        }[] = [];
        let selectedLabel = false;
        const world = new Container();
        const overlays = new Container();
        world.addChild(artworkStack, overlays);
        app.stage.addChild(world);
        let renderedDetailBand = -1;
        let view: Viewport = { width: element.clientWidth, height: element.clientHeight };
        let camera: Camera = fitCamera(view);
        const applyCamera = () => {
          const relative = camera.scale / fitCamera(view).scale;
          const detailBand = relative >= 3 ? 2 : relative >= 2.6 ? 1 : 0;
          if (renderedDetailBand >= 0 && renderedDetailBand !== detailBand) {
            draw.current();
            return;
          }
          const nextLevel = relative < 1.55 ? 'National' : relative < 3 ? 'Regional' : 'Business';
          setZoomLevel((old) => (old === nextLevel ? old : nextLevel));
          world.scale.set(camera.scale);
          world.position.set(
            view.width / 2 - camera.x * camera.scale,
            view.height / 2 - camera.y * camera.scale,
          );
          element.dataset.camera = JSON.stringify(camera);
          element.dataset.layer = layerRef.current;
          const detail = camera.scale / fitCamera(view).scale;
          const candidates = labels
            .filter((item) => item.selected || item.size >= 22 || detail >= 2.6)
            .map((item) => {
              const targetScale = Math.max(
                1,
                (item.size >= 22 ? 12 : 10) / (item.size * camera.scale),
              );
              const width = item.caption.width * targetScale * camera.scale;
              const height = item.caption.height * targetScale * camera.scale;
              return {
                id: item.id,
                x: view.width / 2 + (item.anchorX - camera.x) * camera.scale,
                y: view.height / 2 + (item.anchorY - camera.y) * camera.scale,
                width,
                height,
                priority: (item.selected ? 100 : 0) + (item.size >= 22 ? 20 : 0),
              };
            });
          const visibleLabels = resolveLabels(candidates, view, 6);
          for (const item of labels) {
            item.caption.visible = visibleLabels.has(item.id);
            item.caption.scale.set(
              Math.max(1, (item.size >= 22 ? 12 : 10) / (item.size * camera.scale)),
            );
          }
          if (!renderFrame)
            renderFrame = requestAnimationFrame(() => {
              renderFrame = 0;
              if (!disposed) app.render();
            });
        };
        const label = (text: string, x: number, y: number, size = 22, color = 0x41594f) => {
          const caption = new Text({
            text,
            style: { fill: color, fontSize: size, fontFamily: 'Arial', fontWeight: 'bold' },
          });
          caption.position.set(x, y);
          overlays.addChild(caption);
          labels.push({
            caption,
            size,
            selected: selectedLabel,
            id: `label-${labels.length}`,
            anchorX: x,
            anchorY: y,
          });
        };
        draw.current = () => {
          labels.length = 0;
          selectedLabel = false;
          const detail = camera.scale / fitCamera(view).scale;
          renderedDetailBand = detail >= 3 ? 2 : detail >= 2.6 ? 1 : 0;
          element.dataset.detailBand = String(renderedDetailBand);
          for (const child of overlays.removeChildren()) child.destroy();
          const { cities, facilities, companies, selectedCityId, selection } = current.current;
          const active = layerRef.current;
          // Illustrated cartography is loaded from a clean PNG artwork.
          // All dynamic game entities and routes are rendered separately above it.
          // Keep the decoded artwork mounted while only the data overlays are rebuilt.
          const roads = new Graphics();
          for (const city of cities)
            for (const id of city.links) {
              const other = cities.find((c) => c.id === id);
              if (!other || city.id >= id) continue;
              roads
                .moveTo(city.x * MAP_UNITS, city.y * MAP_UNITS)
                .lineTo(other.x * MAP_UNITS, other.y * MAP_UNITS);
              if (active === 'Logistics')
                label(
                  'TRANSPORT LINK',
                  ((city.x + other.x) * MAP_UNITS) / 2 + 20,
                  ((city.y + other.y) * MAP_UNITS) / 2,
                  16,
                );
            }
          // The illustrated map already contains its own permanent roads.
          // Show simulation connectivity only in the logistics layer.
          if (active === 'Logistics') {
            roads.stroke({ color: 0x167f96, width: 8, alpha: 0.82 });
            overlays.addChild(roads);
          } else roads.destroy();
          for (const city of cities) {
            const x = city.x * MAP_UNITS,
              y = city.y * MAP_UNITS;
            selectedLabel = city.id === selectedCityId;
            const selected = city.id === selectedCityId,
              metric = current.current.metrics.find((m) => m.cityId === city.id);
            if (
              active === 'Market' ||
              active === 'Economy' ||
              active === 'Competition' ||
              active === 'Logistics'
            ) {
              const measured =
                active === 'Market'
                  ? (metric?.potential ?? city.population / 100)
                  : active === 'Competition'
                    ? (metric?.playerShare ?? 0)
                    : active === 'Logistics'
                      ? (metric?.incoming ?? 0)
                      : city.power;
              const intensity =
                active === 'Competition'
                  ? Math.max(0, Math.min(1, measured))
                  : active === 'Economy'
                    ? Math.max(0, Math.min(1, measured / 2))
                    : active === 'Logistics'
                      ? Math.min(1, Math.log1p(measured) / 8)
                      : Math.min(1, Math.log1p(measured) / 13);
              const halo = new Graphics()
                .circle(
                  x,
                  y,
                  active === 'Market'
                    ? 60 + intensity * 65
                    : active === 'Economy'
                      ? 65 + intensity * 40
                      : 48 + intensity * 50,
                )
                .fill({ color: layerColors[active], alpha: 0.1 + intensity * 0.29 })
                .stroke({ color: layerColors[active], alpha: 0.18 + intensity * 0.3, width: 2 });
              overlays.addChild(halo);
            }
            if (active === 'Competition' && metric?.playerShare != null) {
              const share = Math.max(0, Math.min(1, metric.playerShare));
              overlays.addChild(
                new Graphics().circle(x, y, 31).stroke({ color: 0xcdd9d5, width: 9 }),
              );
              if (share > 0)
                overlays.addChild(
                  new Graphics()
                    .arc(x, y, 31, -Math.PI / 2, -Math.PI / 2 + share * Math.PI * 2)
                    .stroke({ color: layerColors.Competition, width: 9 }),
                );
            }
            if (active === 'Competition' && metric?.playerShare == null) {
              const owners = [
                ...new Set(facilities.filter((f) => f.cityId === city.id).map((f) => f.companyId)),
              ];
              const presence = new Graphics();
              owners.forEach((owner, i) => {
                presence
                  .circle(x - 18 + i * 17, y + 36, 7)
                  .fill(ownerColor(owner))
                  .stroke({ color: 0xffffff, width: 2 });
              });
              overlays.addChild(presence);
            }
            if (active === 'Operations') {
              const count = facilities.filter((f) => f.cityId === city.id).length;
              overlays.addChild(
                new Graphics()
                  .roundRect(x - 28, y - 28, 56, 56, 8)
                  .fill({
                    color: layerColors.Operations,
                    alpha: Math.min(0.65, 0.13 + count * 0.09),
                  })
                  .stroke({ color: layerColors.Operations, alpha: 0.6, width: 2 }),
              );
            }
            if (selected) {
              overlays.addChild(
                new Graphics().circle(x, y, 44).fill({ color: 0x24554b, alpha: 0.09 }),
              );
              overlays.addChild(
                new Graphics().circle(x, y, 36).stroke({ color: 0x24554b, width: 3 }),
              );
            }
            overlays.addChild(
              new Graphics()
                .roundRect(x - 15, y - 15, 30, 30, 6)
                .fill(selected ? 0x24554b : 0x6d8880),
            );
            if (active !== 'Operations') label(city.name.toUpperCase(), x + 40, y - 18);
            if (active === 'Market')
              label(
                `${(city.population / 1000000).toFixed(2)}M · ${metric?.potential == null ? 'DEMAND AFTER FIRST WEEK' : metric.potential + ' potential buyers'}`,
                x + 40,
                y + 12,
                16,
              );
            if (active === 'Economy')
              label(`PURCHASING POWER ${city.power.toFixed(2)}×`, x + 40, y + 12, 16);

            if (active === 'Logistics')
              label(`INCOMING ${metric?.incoming || 0} UNITS`, x + 40, y + 12, 16);
            if (active === 'Competition')
              label(
                metric?.playerShare == null
                  ? `${new Set(facilities.filter((f) => f.cityId === city.id).map((f) => f.companyId)).size} COMPANIES PRESENT`
                  : `PLAYER SHARE ${((metric.playerShare || 0) * 100).toFixed(1)}%`,
                x + 40,
                y + 12,
                16,
              );
            const assets = facilities.filter((f) => f.cityId === city.id);

            assets.forEach((f, index) => {
              if (
                camera.scale / fitCamera(view).scale < 2.6 ||
                (active !== 'Operations' && active !== 'Competition')
              )
                return;
              const fx = x - 28 + index * 32,
                fy = y + 52;
              const selectedAsset =
                (selection.kind === 'facility' && selection.id === f.id) ||
                (selection.kind === 'company' && selection.id === f.companyId);
              if (selectedAsset)
                overlays.addChild(
                  new Graphics()
                    .rect(fx - 14, fy - 14, 28, 28)
                    .stroke({ color: 0x24554b, width: 3 }),
                );
              overlays.addChild(
                new Graphics().rect(fx - 9, fy - 9, 18, 18).fill(ownerColor(f.companyId)),
              );
              if (
                (active === 'Operations' || active === 'Competition') &&
                camera.scale / fitCamera(view).scale >= 3
              )
                label(
                  active === 'Operations'
                    ? `${f.name} · ${f.kind.toUpperCase()}`
                    : `${f.companyId === 'player' ? 'NOVA' : f.companyId.toUpperCase()} · ${f.name}`,
                  x + 40,
                  y + 30 + index * 26,
                  16,
                  ownerColor(f.companyId),
                );
            });
            if (active === 'Competition' && camera.scale / fitCamera(view).scale >= 3) {
              [...new Set(assets.map((f) => f.companyId))].forEach((id, index) => {
                const cx = x - 28 + index * 40,
                  cy = y + 96;
                overlays.addChild(
                  new Graphics()
                    .poly([cx, cy - 13, cx + 13, cy, cx, cy + 13, cx - 13, cy])
                    .fill(ownerColor(id)),
                );
                label(
                  companies.find((c) => c.id === id)?.name || id,
                  x + 40,
                  y + 90 + index * 25,
                  16,
                  ownerColor(id),
                );
              });
            }
            if (active === 'Operations') {
              const prioritized = [...assets].sort(
                (a, b) =>
                  Number(b.companyId === current.current.playerId) -
                  Number(a.companyId === current.current.playerId),
              );
              const mainAsset =
                prioritized.find((f) => f.kind === 'factory') ||
                prioritized.find((f) => f.kind === 'warehouse') ||
                prioritized.find((f) => f.kind === 'store') ||
                prioritized[0];
              const isOwned = mainAsset?.companyId === current.current.playerId;
              const locationStock = current.current.stocks
                .filter(
                  (lot) =>
                    lot.cityId === city.id &&
                    current.current.products.some(
                      (product) =>
                        product.id === lot.productId &&
                        product.companyId === current.current.playerId,
                    ),
                )
                .reduce((sum, lot) => sum + lot.quantity, 0);
              const facilityName = mainAsset
                ? (
                    {
                      factory: 'NHÀ MÁY',
                      warehouse: 'KHO HÀNG',
                      store: 'CỬA HÀNG',
                      hq: 'TRỤ SỞ',
                      rd: 'R&D',
                    } as const
                  )[mainAsset.kind]
                : 'CHƯA CÓ CƠ SỞ';
              const factory =
                mainAsset?.kind === 'factory'
                  ? current.current.factories.find((f) => f.facilityId === mainAsset.id)
                  : undefined;
              const subtitle =
                mainAsset?.kind === 'factory'
                  ? 'Công suất ' + (factory?.capacity ?? 0) + ' SP / tuần'
                  : 'Tồn kho của bạn: ' + locationStock + ' SP';
              const cardY = y - 138;
              const cardX = x - 16;
              const cardWidth = 284;
              const cardHeight = 91;
              overlays.addChild(
                new Graphics()
                  .roundRect(cardX, cardY, cardWidth, cardHeight, 13)
                  .fill({ color: selected ? 0x122820 : 0x1b3329, alpha: 0.98 })
                  .stroke({ color: selected ? 0xa9dac2 : 0x4d6e60, width: selected ? 3 : 2 }),
              );
              overlays.addChild(
                new Text({
                  text: city.name + ' · ' + facilityName,
                  style: { fill: 0xffffff, fontFamily: 'Arial', fontSize: 21, fontWeight: 'bold' },
                  x: cardX + 15,
                  y: cardY + 11,
                }),
              );
              overlays.addChild(
                new Text({
                  text: subtitle,
                  style: {
                    fill: locationStock ? 0xa3d8b7 : 0xf0ba87,
                    fontFamily: 'Arial',
                    fontSize: 16,
                  },
                  x: cardX + 15,
                  y: cardY + 52,
                }),
              );
              if (isOwned) {
                overlays.addChild(
                  new Graphics().circle(cardX + cardWidth - 17, cardY + 18, 6).fill(0x9ddac0),
                );
              }
            }
          }
          applyCamera();
        };
        const resize = () => {
          view = { width: element.clientWidth, height: element.clientHeight };
          app.renderer.resize(view.width, view.height);
          applyCamera();
        };
        resize();
        draw.current();
        observer = new ResizeObserver(resize);
        observer.observe(element);
        const point = (event: PointerEvent | WheelEvent) => {
          const rect = element.getBoundingClientRect();
          return { x: event.clientX - rect.left, y: event.clientY - rect.top };
        };
        let gesture:
          | {
              id: number;
              startX: number;
              startY: number;
              lastX: number;
              lastY: number;
              dragged: boolean;
            }
          | undefined;
        const down = (event: PointerEvent) => {
          if (event.button !== 0 || !event.isPrimary || gesture) return;
          const p = point(event);
          gesture = {
            id: event.pointerId,
            startX: p.x,
            startY: p.y,
            lastX: p.x,
            lastY: p.y,
            dragged: false,
          };
          app.canvas.setPointerCapture(event.pointerId);
        };
        const move = (event: PointerEvent) => {
          if (!gesture || gesture.id !== event.pointerId || touches.size > 1) return;
          const p = point(event);
          if (Math.hypot(p.x - gesture.startX, p.y - gesture.startY) > 5) gesture.dragged = true;
          if (gesture.dragged) {
            camera = panCamera(camera, p.x - gesture.lastX, p.y - gesture.lastY);
            applyCamera();
          }
          gesture.lastX = p.x;
          gesture.lastY = p.y;
          app.canvas.style.cursor = gesture.dragged ? 'grabbing' : 'grab';
        };
        const end = (event: PointerEvent) => {
          if (!gesture || gesture.id !== event.pointerId) return;
          const p = point(event);
          const clicked =
            event.type === 'pointerup' &&
            !gesture.dragged &&
            Math.hypot(p.x - gesture.startX, p.y - gesture.startY) <= 5;
          gesture = undefined;
          if (app.canvas.hasPointerCapture(event.pointerId))
            app.canvas.releasePointerCapture(event.pointerId);
          app.canvas.style.cursor = 'grab';
          if (clicked) {
            const w = screenToWorld(camera, view, p);
            if (layerRef.current === 'Operations') {
              for (const c of current.current.cities) {
                const x = c.x * MAP_UNITS;
                const y = c.y * MAP_UNITS;
                if (w.x >= x - 16 && w.x <= x + 268 && w.y >= y - 138 && w.y <= y - 47) {
                  const assets = current.current.facilities.filter((f) => f.cityId === c.id);
                  const prioritized = [...assets].sort(
                    (a, b) =>
                      Number(b.companyId === current.current.playerId) -
                      Number(a.companyId === current.current.playerId),
                  );
                  const mainAsset =
                    prioritized.find((f) => f.kind === 'factory') ||
                    prioritized.find((f) => f.kind === 'warehouse') ||
                    prioritized.find((f) => f.kind === 'store') ||
                    prioritized[0];
                  current.current.onSelect(
                    mainAsset ? { kind: 'facility', id: mainAsset.id } : { kind: 'city', id: c.id },
                  );
                  return;
                }
              }
            }
            const city = current.current.cities.find(
              (c) =>
                Math.hypot(c.x * MAP_UNITS - w.x, c.y * MAP_UNITS - w.y) <=
                Math.max(20, 12 / camera.scale),
            );
            // Assets take priority over the wider city hit area. Positions match the rendered slots.
            for (const c of current.current.cities) {
              if (
                camera.scale / fitCamera(view).scale < 2.6 ||
                (layerRef.current !== 'Operations' && layerRef.current !== 'Competition')
              )
                break;
              const assets = current.current.facilities.filter((f) => f.cityId === c.id);
              const facility = assets.find(
                (_, i) =>
                  Math.abs(w.x - (c.x * MAP_UNITS - 28 + i * 32)) <= 12 &&
                  Math.abs(w.y - (c.y * MAP_UNITS + 52)) <= 12,
              );
              if (facility) {
                current.current.onSelect({ kind: 'facility', id: facility.id });
                return;
              }
              if (layerRef.current === 'Competition') {
                const owner = [...new Set(assets.map((f) => f.companyId))].find(
                  (_, i) =>
                    Math.hypot(
                      w.x - (c.x * MAP_UNITS - 28 + i * 40),
                      w.y - (c.y * MAP_UNITS + 96),
                    ) <= 16,
                );
                if (owner) {
                  current.current.onSelect({ kind: 'company', id: owner });
                  return;
                }
              }
            }
            if (city) current.current.onSelect({ kind: 'city', id: city.id });
          }
        };
        let touchPinch: { distance: number; center: { x: number; y: number } } | undefined;
        const touches = new Map<number, { x: number; y: number }>();
        const touchDown = (event: PointerEvent) => {
          if (event.pointerType !== 'touch') return;
          touches.set(event.pointerId, point(event));
          if (touches.size === 2) {
            const [a, b] = [...touches.values()];
            touchPinch = {
              distance: Math.hypot(a.x - b.x, a.y - b.y),
              center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
            };
            gesture = undefined;
          }
        };
        const touchMove = (event: PointerEvent) => {
          if (!touches.has(event.pointerId)) return;
          touches.set(event.pointerId, point(event));
          if (touches.size !== 2 || !touchPinch) return;
          const [a, b] = [...touches.values()];
          const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (touchPinch.distance > 0)
            camera = zoomCamera(camera, view, center, distance / touchPinch.distance);
          camera = panCamera(
            camera,
            center.x - touchPinch.center.x,
            center.y - touchPinch.center.y,
          );
          touchPinch = { distance, center };
          applyCamera();
        };
        const touchEnd = (event: PointerEvent) => {
          touches.delete(event.pointerId);
          if (touches.size < 2) touchPinch = undefined;
        };
        const wheel = (event: WheelEvent) => {
          event.preventDefault();
          const pixels =
            event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? view.height : 1);
          camera = zoomCamera(
            camera,
            view,
            point(event),
            Math.exp(-Math.max(-500, Math.min(500, pixels)) * 0.002),
          );
          applyCamera();
        };
        controls.current = (action) => {
          camera =
            action === 'focus'
              ? {
                  ...camera,
                  x:
                    (current.current.cities.find((c) => c.id === current.current.selectedCityId)
                      ?.x || 480) * MAP_UNITS,
                  y:
                    (current.current.cities.find((c) => c.id === current.current.selectedCityId)
                      ?.y || 320) * MAP_UNITS,
                }
              : action === 'reset'
                ? fitCamera(view)
                : zoomCamera(
                    camera,
                    view,
                    { x: view.width / 2, y: view.height / 2 },
                    action === 'in' ? 1.3 : 1 / 1.3,
                  );
          applyCamera();
        };
        const keydown = (event: KeyboardEvent) => {
          if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
            event.preventDefault();
            event.stopPropagation();
            const dx = event.key === 'ArrowLeft' ? 40 : event.key === 'ArrowRight' ? -40 : 0,
              dy = event.key === 'ArrowUp' ? 40 : event.key === 'ArrowDown' ? -40 : 0;
            camera = panCamera(camera, dx, dy);
            applyCamera();
          }
          if (['+', '=', '-', 'Home'].includes(event.key)) {
            event.preventDefault();
            event.stopPropagation();
            controls.current(event.key === 'Home' ? 'reset' : event.key === '-' ? 'out' : 'in');
          }
        };
        app.canvas.addEventListener('keydown', keydown);
        app.canvas.addEventListener('pointerdown', touchDown);
        app.canvas.addEventListener('pointermove', touchMove);
        app.canvas.addEventListener('pointerup', touchEnd);
        app.canvas.addEventListener('pointercancel', touchEnd);
        app.canvas.addEventListener('pointerdown', down);
        app.canvas.addEventListener('pointermove', move);
        app.canvas.addEventListener('pointerup', end);
        app.canvas.addEventListener('pointercancel', end);
        app.canvas.addEventListener('lostpointercapture', end);
        app.canvas.addEventListener('wheel', wheel, { passive: false });
        cleanup = () => {
          app.canvas.removeEventListener('keydown', keydown);
          app.canvas.removeEventListener('pointerdown', touchDown);
          app.canvas.removeEventListener('pointermove', touchMove);
          app.canvas.removeEventListener('pointerup', touchEnd);
          app.canvas.removeEventListener('pointercancel', touchEnd);
          app.canvas.removeEventListener('pointerdown', down);
          app.canvas.removeEventListener('pointermove', move);
          app.canvas.removeEventListener('pointerup', end);
          app.canvas.removeEventListener('pointercancel', end);
          app.canvas.removeEventListener('lostpointercapture', end);
          app.canvas.removeEventListener('wheel', wheel);
        };
      })
      .catch((error) => {
        destroyApplication();
        if (!disposed) setFailure(error instanceof Error ? error.message : String(error));
      });
    return () => {
      disposed = true;
      cancelAnimationFrame(renderFrame);
      observer?.disconnect();
      cleanup();
      draw.current = () => {};
      controls.current = () => {};
      destroyApplication();
    };
  }, [attempt]);
  useEffect(() => {
    draw.current();
  }, [
    props.cities,
    props.facilities,
    props.companies,
    props.selectedCityId,
    props.selection,
    props.metrics,
    props.stocks,
    props.products,
    props.factories,
    props.playerId,
    layer,
  ]);
  return (
    <div className="map" data-error={failure || undefined}>
      <div ref={mount} className="mapSurface" role="group" aria-label="Interactive country map" />
      <label className="cityPicker">
        City
        <select
          aria-label="Select city"
          value={props.selectedCityId}
          onChange={(e) => props.onSelect({ kind: 'city', id: e.target.value })}
        >
          {props.cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className="mobileLayerToggle"
        aria-expanded={layerMenuOpen}
        onClick={() => setLayerMenuOpen((v) => !v)}
      >
        Layers · {layer} ▾
      </button>
      <div
        className={`mapLayers ${layerMenuOpen ? 'mobileLayersOpen' : ''}`}
        role="group"
        aria-label="Map layers"
      >
        {layers.map((name) => (
          <button
            key={name}
            aria-pressed={layer === name}
            onClick={() => {
              setLayer(name);
              setLayerMenuOpen(false);
            }}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="mapControls" role="group" aria-label="Map camera">
        <button aria-label="Zoom in" onClick={() => controls.current('in')}>
          +
        </button>
        <button aria-label="Zoom out" onClick={() => controls.current('out')}>
          −
        </button>
        <button className="wide" onClick={() => controls.current('reset')}>
          Reset view
        </button>
        <button className="wide" onClick={() => controls.current('focus')}>
          Center selection
        </button>
      </div>
      <div className="mapZoomBadge" aria-live="polite">
        {zoomLevel} view
      </div>
      <div className="atlasLegend" aria-label={layerNames[layer]}>
        <button aria-expanded={selectedLegend} onClick={() => setSelectedLegend((v) => !v)}>
          {layerNames[layer]} {selectedLegend ? '−' : '+'}
        </button>
        {selectedLegend && (
          <div className="atlasLegendContent">
            <span>Low</span>
            <div className={`atlasScale atlasScale-${layer}`} />
            <span>High</span>
            <small>
              {layer === 'Competition'
                ? 'Company presence before first sales; measured share afterward'
                : layer === 'Market'
                  ? 'Potential buyers after week resolution; population proxy before first week'
                  : layer === 'Logistics'
                    ? 'Incoming units and transport connections'
                    : layer === 'Operations'
                      ? 'Facility counts and owners'
                      : 'Relative city purchasing power'}
            </small>
          </div>
        )}
      </div>
      <p className="mapLegend" aria-live="polite">
        {failure ? `Map unavailable: ${failure}` : legends[layer]}
        {failure && <button onClick={() => setAttempt((value) => value + 1)}>Retry map</button>}
        <span>Drag to pan · Scroll to zoom · Select a city</span>
      </p>
    </div>
  );
}
