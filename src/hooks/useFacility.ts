import { useSyncExternalStore } from 'react';
import { facilityService } from '../services/facilityService';

/** Re-render whenever facility / request / message state changes (also across tabs). */
export function useFacility(): number {
  return useSyncExternalStore(facilityService.subscribe, facilityService.getVersion);
}
