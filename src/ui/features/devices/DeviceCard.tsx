import type { Device } from '../../../domain/types';
import { DeviceStatusBadge } from '../../components/StatusBadge';

interface DeviceCardProps {
  device: Device;
  onBorrow: (deviceId: string) => void;
}

export function DeviceCard({ device, onBorrow }: DeviceCardProps) {
  const isMaintenance = device.status === 'maintenance';

  return (
    <article className="device-card" data-testid={`device-card-${device.id}`}>
      <div className="device-card-header">
        <span className="device-id">{device.id}</span>
        <DeviceStatusBadge status={device.status} />
      </div>
      <h3 className="device-name">{device.name}</h3>
      <p className="device-category">Loại: {device.category}</p>
      <p className="device-note">{device.note}</p>
      <div className="device-card-footer">
        <button
          type="button"
          className="btn btn-primary"
          disabled={isMaintenance}
          onClick={() => onBorrow(device.id)}
        >
          Mượn
        </button>
        {isMaintenance ? (
          <span className="device-disabled-reason">Đang bảo trì — không thể mượn</span>
        ) : null}
      </div>
    </article>
  );
}
