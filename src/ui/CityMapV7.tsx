import { useMemo, useState } from 'react';
import type { City, Facility, Company } from '../engine/game';
import type { Selection } from '../engine/entities';

type SiteType = 'retail' | 'office' | 'industrial' | 'residential';
type Site = {
  id: string;
  label: string;
  subtitle: string;
  grid: [number, number];
  kind: SiteType;
  facilityId?: string;
};

const SITES: Site[] = [
  {
    id: 'central-hq',
    label: 'NOVA HQ',
    subtitle: 'Trụ sở đang hoạt động',
    grid: [6, 3],
    kind: 'office',
    facilityId: 'hq',
  },
  {
    id: 'flagship',
    label: 'NOVA Flagship',
    subtitle: 'Cửa hàng đang hoạt động',
    grid: [4, 6],
    kind: 'retail',
    facilityId: 'store',
  },
  {
    id: 'plaza',
    label: 'Central Plaza',
    subtitle: 'Địa điểm mẫu · Chưa mở cho thuê',
    grid: [3, 3],
    kind: 'retail',
  },
  {
    id: 'north-business',
    label: 'North Business Center',
    subtitle: 'Địa điểm mẫu · Chưa mở cho thuê',
    grid: [8, 2],
    kind: 'office',
  },
  {
    id: 'east-depot',
    label: 'East Logistics Park',
    subtitle: 'Địa điểm mẫu · Chưa mở cho thuê',
    grid: [9, 7],
    kind: 'industrial',
  },
];

const palette = {
  office: { front: '#648fa0', side: '#456979', top: '#c0d7d8', windows: '#d3e6e6' },
  retail: { front: '#be836c', side: '#9a6756', top: '#f5dfca', windows: '#bfdfdf' },
  residential: { front: '#bb9987', side: '#987c70', top: '#eee1d3', windows: '#b1d0cf' },
  industrial: { front: '#7a8a91', side: '#65747a', top: '#c7d0d0', windows: '#c2dcdd' },
};
const point = (c: number, r: number) => ({ x: 610 + (c - r) * 49, y: 20 + (c + r) * 29 });
const rng = (i: number) => ((i * 73 + 41) % 101) / 101;
const classification = (c: number, r: number): SiteType => {
  if (c > 8 && r > 5) return 'industrial';
  if (c < 3 || r > 7) return 'residential';
  return (c + r) % 4 === 0 ? 'retail' : 'office';
};

function IsoBuilding({
  c,
  r,
  type,
  height,
}: {
  c: number;
  r: number;
  type: SiteType;
  height: number;
}) {
  const p = point(c, r);
  const color = palette[type];
  const w = 40,
    h = 22,
    top = p.y - height;
  return (
    <g aria-hidden="true">
      <path d={`M${p.x} ${p.y - 27} l${w} ${h} l-${w} ${h} l-${w} -${h} Z`} fill="#b9c8b7" />
      <path
        d={`M${p.x - w} ${top} l${w} -${h} l${w} ${h} l-${w} ${h} Z`}
        fill={color.top}
        stroke="#71888c"
        strokeWidth="1"
      />
      <path
        d={`M${p.x - w} ${top} l${w} ${h} v${height} l-${w} -${h} Z`}
        fill={color.front}
        stroke="#536d71"
        strokeWidth="1"
      />
      <path
        d={`M${p.x} ${top + h} l${w} -${h} v${height} l-${w} ${h} Z`}
        fill={color.side}
        stroke="#536d71"
        strokeWidth="1"
      />
      {[0, 1, 2]
        .filter((i) => (i + 1) * 15 < height - 4)
        .map((i) => (
          <g key={i}>
            {[0, 1, 2].map((j) => (
              <g key={j}>
                <path
                  d={`M${p.x - 33 + j * 11} ${top + 13 + i * 15 + j * 6} l7 4 v8 l-7 -4 Z`}
                  fill={color.windows}
                  opacity=".88"
                />
                <path
                  d={`M${p.x + 5 + j * 11} ${top + 23 + i * 15 - j * 6} l7 -4 v8 l-7 4 Z`}
                  fill={color.windows}
                  opacity=".75"
                />
              </g>
            ))}
          </g>
        ))}
      {type === 'retail' && (
        <path d={`M${p.x - 30} ${p.y - 3} l26 15 v6 l-26 -15 Z`} fill="#e2b56c" />
      )}
      <path d={`M${p.x - 15} ${top - 10} l11 -6 l13 7 l-12 6 Z`} fill="#a8b8b7" />
    </g>
  );
}

function IsoScene({ onSite, selected }: { onSite: (id: string) => void; selected: string }) {
  const blocks = useMemo(() => {
    const result: { c: number; r: number; type: SiteType; height: number }[] = [];
    for (let r = 0; r < 11; r++)
      for (let c = 0; c < 12; c++) {
        if ((c === 1 && r === 6) || (c === 6 && r === 8) || (c === 2 && r === 2)) continue;
        const type = classification(c, r);
        const height =
          type === 'industrial'
            ? 18 + rng(c * 19 + r * 31) * 22
            : 23 + rng(c * 11 + r * 7) * (type === 'office' ? 92 : 40);
        result.push({ c, r, type, height: Math.round(height) });
      }
    return result.sort((a, b) => a.r + a.c - (b.r + b.c));
  }, []);
  return (
    <svg
      viewBox="0 0 1260 780"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Bản đồ isometric Central City, thử nghiệm phong cách bản đồ đô thị dày đặc"
    >
      <defs>
        <linearGradient id="mv-city-ground" x2="0" y2="1">
          <stop stopColor="#a6c3ae" />
          <stop offset="1" stopColor="#8dac97" />
        </linearGradient>
      </defs>
      <rect width="1260" height="780" fill="#b8cdbb" />
      <path d="M1080 380 L1260 255 V780 H905 L825 650Z" fill="#72afc1" />
      <path
        d="M1091 395 L1260 286 M950 678 L1260 443"
        stroke="#abd7dd"
        strokeWidth="4"
        fill="none"
      />
      <path d="M0 480 L325 685 L750 780 H0Z" fill="#9cbea2" />
      <path d="M20 150 L600 -188 L1310 240 L730 578Z" fill="url(#mv-city-ground)" opacity=".65" />
      {Array.from({ length: 14 }, (_, i) => {
        const p = point(i - 1, 0);
        const q = point(i - 1, 11);
        return (
          <path
            key={'c' + i}
            d={`M${p.x} ${p.y} L${q.x} ${q.y}`}
            stroke="#697575"
            strokeWidth="15"
            strokeLinecap="square"
          />
        );
      })}
      {Array.from({ length: 13 }, (_, i) => {
        const p = point(0, i - 1);
        const q = point(12, i - 1);
        return (
          <path
            key={'r' + i}
            d={`M${p.x} ${p.y} L${q.x} ${q.y}`}
            stroke="#6f7775"
            strokeWidth="15"
            strokeLinecap="square"
          />
        );
      })}
      {blocks.map((b) => (
        <IsoBuilding key={b.c + '-' + b.r} {...b} />
      ))}
      {SITES.map((site) => {
        const p = point(...site.grid);
        const active = selected === site.id;
        const fill = site.facilityId ? '#238b6b' : '#d17157';
        return (
          <g
            key={site.id}
            role="button"
            tabIndex={0}
            aria-label={site.label}
            onClick={() => onSite(site.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSite(site.id);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <path
              d={`M${p.x} ${p.y - 110} V${p.y - 25}`}
              stroke={fill}
              strokeWidth="3"
              strokeDasharray="4 4"
            />
            <path
              d={`M${p.x} ${p.y - 145} l30 0 q10 0 10 10 v21 q0 10 -10 10 h-17 l-13 14 l-13 -14 h-17 q-10 0 -10 -10 v-21 q0 -10 10 -10Z`}
              fill={active ? '#183c31' : fill}
              stroke="#ffffff"
              strokeWidth={active ? 3 : 1.5}
            />
            <text
              x={p.x}
              y={p.y - 118}
              textAnchor="middle"
              fill="white"
              fontSize="19"
              fontWeight="700"
            >
              {site.facilityId ? '✓' : '+'}
            </text>
            <circle
              cx={p.x}
              cy={p.y - 25}
              r={active ? 9 : 5}
              fill={fill}
              stroke="#fff"
              strokeWidth="2"
            />
          </g>
        );
      })}
      <rect x="16" y="729" width="408" height="34" rx="7" fill="#20372d" opacity=".92" />
      <text x="29" y="750" fontSize="14" fill="#d8e8dd" fontWeight="600">
        CENTRAL CITY · ISOMETRIC BUSINESS MAP · CONCEPT V7
      </text>
    </svg>
  );
}

type Props = {
  city: City;
  facilities: Facility[];
  companies: Company[];
  playerId: string;
  onSelect: (selection: Selection) => void;
};

export function CityMapV7({ city, facilities, companies, playerId, onSelect }: Props) {
  const [selected, setSelected] = useState('flagship');
  const site = SITES.find((s) => s.id === selected)!;
  const existing = site.facilityId
    ? facilities.find((f) => f.id === site.facilityId && f.cityId === city.id)
    : undefined;
  const owner = existing ? companies.find((c) => c.id === existing.companyId) : undefined;
  const actual = !!existing;
  return (
    <div className="cityV7Preview" data-view="city-v7">
      <div className="cityV7Canvas">
        <IsoScene selected={selected} onSite={setSelected} />
      </div>
      <div className="cityV7Title">
        <strong>CENTRAL CITY · BUSINESS DISTRICT</strong>
        <span>Chọn marker để xem địa điểm</span>
      </div>
      <section className="cityV7Site" aria-label="Thông tin địa điểm trên bản đồ">
        <div className="cityV7SiteHead">
          <div>
            <small>LOCATION INTELLIGENCE</small>
            <h2>{site.label}</h2>
          </div>
          <span className={actual ? 'siteOperational' : 'siteConcept'}>
            {actual ? 'ĐANG HOẠT ĐỘNG' : 'CONCEPT'}
          </span>
        </div>
        <p>
          {actual
            ? site.subtitle
            : 'Vị trí minh họa phong cách Coffee Inc 2; chưa có hệ thống thuê mặt bằng.'}
        </p>
        <div className="cityV7Meta">
          <span>Thành phố</span>
          <strong>{city.name}</strong>
          <span>Phân loại</span>
          <strong>{site.kind.toUpperCase()}</strong>
          {actual && (
            <>
              <span>Chủ sở hữu</span>
              <strong>{owner?.name ?? playerId}</strong>
            </>
          )}
        </div>
        {actual ? (
          <button onClick={() => onSelect({ kind: 'facility', id: existing.id })}>
            Xem cơ sở trong game →
          </button>
        ) : (
          <div className="cityV7ConceptNotice">
            FOR LEASE là marker minh họa; không phát sinh chi phí hay đơn hàng trong game.
          </div>
        )}
      </section>
      <div className="cityV7Legend">
        <span>
          <i className="ownedDot" /> Cơ sở thật
        </span>
        <span>
          <i className="leaseDot" /> Vị trí mẫu
        </span>
        <span>
          <i className="cityV7Shape" /> City artwork
        </span>
      </div>
    </div>
  );
}
