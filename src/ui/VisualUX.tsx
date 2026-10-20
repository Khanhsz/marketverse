import type { GameState, City } from '../engine/game';
import type { Selection } from '../engine/entities';
import { localStock } from '../engine/operations';
import { brandKey } from '../engine/people';

export type Department =
  | 'operations'
  | 'products'
  | 'logistics'
  | 'marketing'
  | 'people'
  | 'finance'
  | 'projects'
  | 'reports'
  | 'settings'
  | 'insight';

export const DEPARTMENTS: { id: Department; label: string; icon: string }[] = [
  { id: 'operations', label: 'Vận hành', icon: 'factory' },
  { id: 'products', label: 'Sản phẩm', icon: 'package' },
  { id: 'logistics', label: 'Logistics', icon: 'truck' },
  { id: 'marketing', label: 'Marketing', icon: 'megaphone' },
  { id: 'people', label: 'Nhân sự', icon: 'users' },
  { id: 'finance', label: 'Tài chính', icon: 'wallet' },
  { id: 'projects', label: 'Dự án', icon: 'calendar' },
  { id: 'reports', label: 'Báo cáo', icon: 'chart' },
  { id: 'settings', label: 'Cài đặt', icon: 'sliders' },
];

export function DepartmentIcon({ name, size = 18 }: { name: string; size?: number }) {
  const shared = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  let path;
  switch (name) {
    case 'factory':
      path = (
        <>
          <path d="M3 21V8l5 3V8l5 3V4h8v17z" />
          <path d="M7 17h1m4 0h1m4 0h1M16 8h2" />
        </>
      );
      break;
    case 'package':
      path = (
        <>
          <path d="m12 2 9 5-9 5-9-5 9-5zM3 7v10l9 5 9-5V7M12 12v10" />
        </>
      );
      break;
    case 'truck':
      path = (
        <>
          <path d="M3 6h11v12H3zM14 10h4l3 4v4h-7M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm11 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
        </>
      );
      break;
    case 'megaphone':
      path = (
        <>
          <path d="M3 10v4h5l10 5V5L8 10H3zM8 14l2 6h3" />
          <path d="M21 10v4" />
        </>
      );
      break;
    case 'users':
      path = (
        <>
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5" />
        </>
      );
      break;
    case 'wallet':
      path = (
        <>
          <rect x="3" y="6" width="18" height="15" rx="2" />
          <path d="M3 9V5a2 2 0 0 1 2-2h13M16 14h5M16 14h1" />
        </>
      );
      break;
    case 'calendar':
      path = (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 10h18M7 14h4m-4 4h6" />
        </>
      );
      break;
    case 'chart':
      path = (
        <>
          <path d="M4 20h16M5 17l5-5 3 2 6-8" />
          <path d="M15 6h4v4" />
        </>
      );
      break;
    case 'sliders':
      path = (
        <>
          <path d="M4 6h16M4 12h16M4 18h16" />
          <circle cx="9" cy="6" r="2" fill="#1c3027" />
          <circle cx="16" cy="12" r="2" fill="#1c3027" />
          <circle cx="11" cy="18" r="2" fill="#1c3027" />
        </>
      );
      break;
    case 'store':
      path = (
        <>
          <path d="M3 10h18l-2-6H5zM5 10v11h14V10M9 21v-7h6v7" />
        </>
      );
      break;
    default:
      path = <circle cx="12" cy="12" r="7" />;
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" {...shared}>
      {path}
    </svg>
  );
}

export function DepartmentRail({
  active,
  onChange,
}: {
  active: Department;
  onChange: (id: Department) => void;
}) {
  return (
    <nav className="rail commandRail" aria-label="Phòng ban và chức năng">
      {DEPARTMENTS.map((item) => (
        <button
          key={item.id}
          title={item.label}
          className="departmentNavButton"
          aria-label={item.label}
          aria-pressed={active === item.id}
          onClick={() => onChange(item.id)}
        >
          <DepartmentIcon name={item.icon} size={18} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

const fmt = (v: number) => new Intl.NumberFormat('vi-VN').format(v);
const cash = (v: number) => fmt(v) + ' CR';
const facilityNames: Record<string, string> = {
  hq: 'Trụ sở',
  factory: 'Nhà máy',
  warehouse: 'Kho hàng',
  store: 'Cửa hàng',
  rd: 'Nghiên cứu',
};
type PanelProps = {
  game: GameState;
  city: City;
  selection: Selection;
  department: Department;
  onPlan: (section: 'products' | 'marketing' | 'finance' | 'projects') => void;
  onSelect: (selection: Selection) => void;
  onReports: () => void;
  onGuide: () => void;
  onExport: () => void;
  onReset: () => void;
  onStartNational: () => void;
  onInspect: () => void;
};
function Stat({ name, value }: { name: string; value: string }) {
  return (
    <div className="commandStat">
      <span>{name}</span>
      <strong>{value}</strong>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="commandSection">
      <h3>{title}</h3>
      {children}
    </section>
  );
}
export function DepartmentPanel({
  game,
  city,
  department,
  onPlan,
  onSelect,
  onReports,
  onGuide,
  onExport,
  onReset,
  onStartNational,
  onInspect,
}: PanelProps) {
  const player = game.companies.find((c) => c.id === game.playerId)!;
  const ownProducts = game.products.filter((p) => p.companyId === player.id);
  const ownFacilities = game.facilities.filter((f) => f.companyId === player.id);
  const localAssets = game.facilities.filter((f) => f.cityId === city.id);
  const localOwn = localAssets.filter((f) => f.companyId === player.id);
  const latest = game.reports.at(-1);
  const thisCitySales = (latest?.sales || []).filter(
    (s) => s.cityId === city.id && ownProducts.some((p) => p.id === s.productId),
  );
  const stock = ownProducts.reduce((sum, p) => sum + localStock(game, p.id, city.id), 0);
  const sold = thisCitySales.reduce((sum, s) => sum + s.units, 0);
  const lost = thisCitySales.reduce((sum, s) => sum + s.lostStock, 0);
  const playerFactories = game.factories.filter((f) =>
    ownFacilities.some((asset) => asset.id === f.facilityId),
  );
  const capacity = playerFactories.reduce((sum, f) => sum + f.capacity, 0);
  const production = (latest?.production || [])
    .filter((p) => ownProducts.some((product) => product.id === p.productId))
    .reduce((sum, p) => sum + p.units, 0);
  const percent = capacity ? Math.min(100, Math.round((production / capacity) * 100)) : 0;
  const activeProjects = game.projects.filter(
    (p) => p.companyId === player.id && p.status === 'active',
  );
  const localShipment = activeProjects.filter((p) => p.kind === 'shipment' && p.cityId === city.id);
  const dept = DEPARTMENTS.find((d) => d.id === department);
  return (
    <div className="commandPanelContent">
      <div className="commandEyebrow">CITY &amp; BUSINESS INTELLIGENCE</div>
      <div className="commandPanelTitle">
        <h1>{dept?.label || 'Chi tiết'}</h1>
        <button
          type="button"
          onClick={onInspect}
          title="Xem thông tin chi tiết"
          aria-label="Xem thông tin chi tiết"
        >
          ↗
        </button>
      </div>
      <p className="commandLocation">
        {city.name} ·{' '}
        {localOwn.length
          ? localOwn.map((a) => facilityNames[a.kind]).join(', ')
          : 'Chưa có cơ sở của bạn'}
      </p>
      {department === 'operations' && (
        <>
          <div className="operationsFlow" aria-label="Chuỗi vận hành">
            <div>
              <DepartmentIcon name="factory" />
              <span>Sản xuất</span>
            </div>
            <b>→</b>
            <div>
              <DepartmentIcon name="truck" />
              <span>Vận chuyển</span>
            </div>
            <b>→</b>
            <div>
              <DepartmentIcon name="store" />
              <span>Bán hàng</span>
            </div>
          </div>
          <Section title="Công suất nhà máy">
            <Stat
              name="Sản lượng / Công suất · toàn quốc"
              value={fmt(production) + ' / ' + fmt(capacity) + ' SP'}
            />
            <div className="commandProgress">
              <i style={{ width: percent + '%' }} />
            </div>
            <p className="commandSupporting">
              {capacity
                ? 'Đang dùng ' + percent + '% công suất hiện có'
                : 'Chưa có nhà máy. Xây nhà máy để bắt đầu sản xuất.'}
            </p>
          </Section>
          <button className="commandStockCard" onClick={() => onInspect()}>
            <span>Tồn kho · {city.name}</span>
            <strong>{fmt(stock)} SP</strong>
            <small>
              {ownProducts
                .map((p) => p.name + ': ' + fmt(localStock(game, p.id, city.id)))
                .join(' · ')}
            </small>
          </button>
          {lost > 0 ? (
            <p className="commandAlert">
              {city.name} đã mất {fmt(lost)} đơn vị nhu cầu do thiếu hàng tuần trước.
            </p>
          ) : stock === 0 && localOwn.some((f) => f.kind === 'store') ? (
            <p className="commandAlert">{city.name} đang hết hàng trong cửa hàng của bạn.</p>
          ) : (
            <p className="commandPositive">
              {localShipment.length
                ? fmt(
                    localShipment.reduce(
                      (sum, p) => sum + (p.kind === 'shipment' ? p.quantity : 0),
                      0,
                    ),
                  ) +
                  ' SP đang trên đường tới ' +
                  city.name
                : 'Đã bán ' + fmt(sold) + ' SP tại đây trong tuần gần nhất.'}
            </p>
          )}
          <button className="commandPrimary" onClick={() => onPlan('projects')}>
            Lập lô bổ sung hàng <span>→</span>
          </button>
          <button className="commandSecondary" onClick={() => onPlan('products')}>
            Điều chỉnh sản xuất
          </button>
          <button className="commandTextAction" onClick={onInspect}>
            Xem toàn bộ cơ sở &amp; dữ liệu ↗
          </button>
        </>
      )}
      {department === 'products' && (
        <>
          <Section title="Danh mục sản phẩm">
            {ownProducts.map((p) => (
              <button className="commandListCard" key={p.id} onClick={() => onPlan('products')}>
                <strong>{p.name}</strong>
                <small>
                  {p.segment} · R{p.revision} · {p.lifecycle}
                </small>
                <Stat name="Giá / Giá vốn" value={cash(p.price) + ' / ' + cash(p.cost)} />
                <Stat name="Tồn kho toàn quốc" value={fmt(p.inventory) + ' SP'} />
              </button>
            ))}
          </Section>
          <button className="commandPrimary" onClick={() => onPlan('products')}>
            Quản lý giá &amp; sản lượng →
          </button>
        </>
      )}
      {department === 'logistics' && (
        <>
          <Section title="Mạng lưới vận chuyển">
            <Stat name="Kết nối từ " value={city.name} />
            {city.links.map((id) => {
              const c = game.cities.find((x) => x.id === id);
              return (
                c && (
                  <button
                    key={id}
                    className="commandListCard"
                    onClick={() => onSelect({ kind: 'city', id })}
                  >
                    ↗ {c.name}
                  </button>
                )
              );
            })}
          </Section>
          <Section title="Lô hàng đang chuyển">
            {activeProjects.filter((p) => p.kind === 'shipment').length ? (
              activeProjects
                .filter((p) => p.kind === 'shipment')
                .map(
                  (p) =>
                    p.kind === 'shipment' && (
                      <div className="commandListCard" key={p.id}>
                        <strong>
                          {game.cities.find((c) => c.id === p.originId)?.name} →{' '}
                          {game.cities.find((c) => c.id === p.cityId)?.name}
                        </strong>
                        <small>
                          {fmt(p.quantity)} SP · còn {p.remaining} tuần
                        </small>
                      </div>
                    ),
                )
            ) : (
              <p className="commandSupporting">Chưa có lô hàng đang vận chuyển.</p>
            )}
          </Section>
          <button className="commandPrimary" onClick={() => onPlan('projects')}>
            Tạo lệnh vận chuyển →
          </button>
        </>
      )}
      {department === 'marketing' && (
        <>
          <Section title="Ngân sách tiếp thị">
            <Stat name="Ngân sách chung / tuần" value={cash(game.policies[player.id].marketing)} />
            <Stat name="Phân bổ tại " value={city.name} />
          </Section>
          <Section title="Nhận biết thương hiệu">
            {(['value', 'mainstream', 'premium'] as const).map((segment) => {
              const value = Math.round(
                (game.brand[brandKey(player.id, city.id, segment)] || 0) * 100,
              );
              return (
                <div className="commandMeasure" key={segment}>
                  <Stat name={segment} value={value + '%'} />
                  <div className="commandProgress">
                    <i style={{ width: value + '%' }} />
                  </div>
                </div>
              );
            })}
          </Section>
          <button className="commandPrimary" onClick={() => onPlan('marketing')}>
            Thiết lập chiến dịch →
          </button>
        </>
      )}
      {department === 'people' && (
        <>
          <Section title="Nhân lực hiện tại">
            <Stat name="Sản xuất" value={fmt(game.staff[player.id].production)} />
            <Stat name="Kinh doanh" value={fmt(game.staff[player.id].sales)} />
            <Stat name="Nghiên cứu" value={fmt(game.staff[player.id].research)} />
          </Section>
          <Section title="Đang tuyển">
            {activeProjects.filter((p) => p.kind === 'hiring').length ? (
              activeProjects
                .filter((p) => p.kind === 'hiring')
                .map(
                  (p) =>
                    p.kind === 'hiring' && (
                      <div key={p.id} className="commandListCard">
                        <strong>
                          {p.role}: {p.quantity} người
                        </strong>
                        <small>Còn {p.remaining} tuần</small>
                      </div>
                    ),
                )
            ) : (
              <p className="commandSupporting">Chưa có đợt tuyển dụng đang chạy.</p>
            )}
          </Section>
          <button className="commandPrimary" onClick={() => onPlan('projects')}>
            Lập kế hoạch tuyển dụng →
          </button>
        </>
      )}
      {department === 'finance' && (
        <>
          <Section title="Tình hình tài chính">
            <Stat name="Tiền mặt" value={cash(player.cash)} />
            <Stat name="Nợ" value={cash(player.debt)} />
            <Stat
              name="Doanh thu tuần trước"
              value={cash(latest?.financials?.find((f) => f.companyId === player.id)?.revenue || 0)}
            />
            <Stat
              name="Lợi nhuận tuần trước"
              value={cash(latest?.financials?.find((f) => f.companyId === player.id)?.profit || 0)}
            />
          </Section>
          <button className="commandPrimary" onClick={() => onPlan('finance')}>
            Điều chỉnh tài chính →
          </button>
          <button className="commandSecondary" onClick={onReports}>
            Xem báo cáo tài chính
          </button>
        </>
      )}
      {department === 'projects' && (
        <>
          <Section title={'Dự án đang triển khai · ' + activeProjects.length}>
            {activeProjects.length ? (
              activeProjects.map((p) => (
                <div className="commandListCard" key={p.id}>
                  <strong>{p.kind.toUpperCase()}</strong>
                  <small>
                    {p.id} · {fmt(p.cost)} CR
                  </small>
                  <Stat name="Thời gian còn lại" value={p.remaining + ' tuần'} />
                </div>
              ))
            ) : (
              <p className="commandSupporting">
                Chưa có dự án. Lên kế hoạch xây dựng, nghiên cứu hoặc vận chuyển.
              </p>
            )}
          </Section>
          <button className="commandPrimary" onClick={() => onPlan('projects')}>
            Thêm dự án mới →
          </button>
        </>
      )}
      {department === 'reports' && (
        <>
          <Section title="Báo cáo tuần trước">
            <Stat name="Tuần" value={latest ? String(latest.week) : 'Chưa có'} />
            <Stat name="Doanh số địa phương" value={fmt(sold) + ' SP'} />
            <Stat name="Tồn kho địa phương" value={fmt(stock) + ' SP'} />
          </Section>
          <Section title="Sự kiện">
            {latest?.events.slice(0, 3).map((event, index) => (
              <p className="commandSupporting" key={index}>
                {event}
              </p>
            )) || (
              <p className="commandSupporting">Kết quả sẽ có sau khi kết thúc tuần đầu tiên.</p>
            )}
          </Section>
          <button className="commandPrimary" onClick={onReports}>
            Xem báo cáo đầy đủ →
          </button>
        </>
      )}
      {department === 'settings' && (
        <>
          <Section title="Quản lý trò chơi">
            <Stat
              name="Tuần hiện tại"
              value={
                'Y' +
                String(game.year).padStart(2, '0') +
                ' · W' +
                String(game.week).padStart(2, '0')
              }
            />
            <Stat name="Cơ sở toàn quốc" value={String(ownFacilities.length)} />
          </Section>
          {game.cities.length === 3 && game.campaign.mode === 'foundation' && (
            <section className="commandSection">
              <h3>Bản đồ 8 thành phố</h3>
              <p className="commandSupporting">
                Save này thuộc Foundation Sandbox cũ (3 thành phố). Chuyển sang National Campaign sẽ
                khởi tạo quốc gia 8 thành phố và thay thế save hiện tại. Hãy xuất save trước.
              </p>
              <button className="commandPrimary" onClick={onStartNational}>
                Bắt đầu với 8 thành phố →
              </button>
            </section>
          )}
          <button className="commandPrimary" onClick={onExport}>
            Xuất file lưu game →
          </button>
          <button className="commandSecondary" onClick={onGuide}>
            Hướng dẫn &amp; phím tắt
          </button>
          <button className="commandSecondary" onClick={onInspect}>
            Thông tin nâng cao &amp; nhập save
          </button>
          <button className="commandDanger" onClick={onReset}>
            Bắt đầu lại trò chơi
          </button>
        </>
      )}
      <div className="commandPanelBottom">
        CHẾ ĐỘ {department === 'operations' ? 'VẬN HÀNH' : (dept?.label || '').toUpperCase()} · DỮ
        LIỆU LIVE
      </div>
    </div>
  );
}
