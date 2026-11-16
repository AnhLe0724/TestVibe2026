import { useState } from 'react';
import {
  filterDevices,
  getDeviceCategories,
  type DeviceFilterCriteria,
} from '../../../domain/filters';
import type { Device } from '../../../domain/types';
import { EmptyState } from '../../components/EmptyState';
import { DeviceCard } from './DeviceCard';
import { DeviceFilters } from './DeviceFilters';

interface DeviceListProps {
  devices: readonly Device[];
  onBorrow: (deviceId: string) => void;
}

const INITIAL_FILTERS: DeviceFilterCriteria = { status: 'all', category: 'all' };

export function DeviceList({ devices, onBorrow }: DeviceListProps) {
  const [criteria, setCriteria] = useState<DeviceFilterCriteria>(INITIAL_FILTERS);
  const categories = getDeviceCategories(devices);
  const filtered = filterDevices(devices, criteria);

  return (
    <section aria-labelledby="devices-heading" className="section-block">
      <h2 id="devices-heading" className="section-heading">
        Danh sách thiết bị
      </h2>
      <DeviceFilters
        criteria={criteria}
        categories={categories}
        onChange={setCriteria}
        onReset={() => setCriteria(INITIAL_FILTERS)}
      />
      {filtered.length === 0 ? (
        <EmptyState
          message="Không có thiết bị phù hợp với bộ lọc hiện tại."
          actionLabel="Xóa lọc"
          onAction={() => setCriteria(INITIAL_FILTERS)}
        />
      ) : (
        <div className="device-grid">
          {filtered.map((device) => (
            <DeviceCard key={device.id} device={device} onBorrow={onBorrow} />
          ))}
        </div>
      )}
    </section>
  );
}
