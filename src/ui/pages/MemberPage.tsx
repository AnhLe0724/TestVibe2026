import { useState } from 'react';
import type { AppStore } from '../../services/store';
import { BorrowForm } from '../features/borrow/BorrowForm';
import { DeviceList } from '../features/devices/DeviceList';
import { useAppState } from '../hooks/useStore';

export function MemberPage({
  store,
  onToast,
}: {
  store: AppStore;
  onToast: (msg: string) => void;
}) {
  const state = useAppState(store);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');

  const handleBorrowSelect = (deviceId: string): void => {
    setSelectedDeviceId(deviceId);
    const el = document.getElementById('form-borrower');
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div>
      <DeviceList devices={state.devices} onBorrow={handleBorrowSelect} />
      <BorrowForm
        store={store}
        devices={state.devices}
        deviceId={selectedDeviceId}
        onDeviceChange={setSelectedDeviceId}
        onToast={onToast}
      />
    </div>
  );
}
