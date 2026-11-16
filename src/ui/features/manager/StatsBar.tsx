import { DEVICE_STATUS_LABELS } from '../../../domain/labels.vi';
import { computeDeviceStats } from '../../../domain/stats';
import type { Device } from '../../../domain/types';

export function StatsBar({ devices }: { devices: readonly Device[] }) {
  const stats = computeDeviceStats(devices);

  return (
    <div className="stats-bar" aria-label="Thống kê tình trạng thiết bị">
      <div className="stat-item stat-available" data-testid="stats-available">
        <span className="stat-label">{DEVICE_STATUS_LABELS.available}</span>
        <strong className="stat-value">{stats.available}</strong>
      </div>
      <div className="stat-item stat-borrowed" data-testid="stats-borrowed">
        <span className="stat-label">{DEVICE_STATUS_LABELS.borrowed}</span>
        <strong className="stat-value">{stats.borrowed}</strong>
      </div>
      <div className="stat-item stat-maintenance" data-testid="stats-maintenance">
        <span className="stat-label">{DEVICE_STATUS_LABELS.maintenance}</span>
        <strong className="stat-value">{stats.maintenance}</strong>
      </div>
    </div>
  );
}
