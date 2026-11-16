import { DEVICE_STATUSES } from '../../../domain/constants';
import type { DeviceFilterCriteria } from '../../../domain/filters';
import { DEVICE_STATUS_LABELS } from '../../../domain/labels.vi';
import type { DeviceStatus } from '../../../domain/types';

interface DeviceFiltersProps {
  criteria: DeviceFilterCriteria;
  categories: string[];
  onChange: (next: DeviceFilterCriteria) => void;
  onReset: () => void;
}

export function DeviceFilters({ criteria, categories, onChange, onReset }: DeviceFiltersProps) {
  const hasFilter = criteria.status !== 'all' || criteria.category !== 'all';

  return (
    <div className="filters-bar">
      <div className="field-group">
        <label htmlFor="filter-status">Tình trạng</label>
        <select
          id="filter-status"
          data-testid="filter-status"
          className="input-control"
          value={criteria.status}
          onChange={(e) =>
            onChange({ ...criteria, status: e.target.value as DeviceStatus | 'all' })
          }
        >
          <option value="all">Tất cả</option>
          {DEVICE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {DEVICE_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label htmlFor="filter-category">Loại thiết bị</label>
        <select
          id="filter-category"
          data-testid="filter-category"
          className="input-control"
          value={criteria.category}
          onChange={(e) => onChange({ ...criteria, category: e.target.value })}
        >
          <option value="all">Tất cả</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <button type="button" className="btn" onClick={onReset} disabled={!hasFilter}>
        Xóa lọc
      </button>
    </div>
  );
}
