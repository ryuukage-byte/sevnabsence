import { useSyncExternalStore } from 'react';
import { facilityService } from '../services/facilityService';
import { cloudSync } from '../services/cloudSync';

/** Re-render whenever facility / request / message state changes (also across tabs). */
export function useFacility(): number {
  return useSyncExternalStore(facilityService.subscribe, facilityService.getVersion);
}

/** Current cloud sync status (re-renders on change). */
export function useCloudSync() {
  useSyncExternalStore(cloudSync.subscribe, () => `${cloudSync.getStatus().status}|${cloudSync.getStatus().lastSyncAt?.getTime()}`);
  return cloudSync.getStatus();
}
