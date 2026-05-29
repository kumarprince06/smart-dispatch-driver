import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { driverApi } from '../api/driverApi';

export const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background Location Error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      const { latitude, longitude } = locations[0].coords;
      
      try {
        // Silently push the updated location to the backend
        await driverApi.updateLocation(latitude, longitude);
        console.log(`[Background] Synced location: ${latitude}, ${longitude}`);
      } catch (err) {
        console.error('[Background] Failed to sync location', err);
      }
    }
  }
});
