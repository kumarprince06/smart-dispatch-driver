import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Navigation, MapPin, Truck, Bike, Car } from 'lucide-react-native';
import { COLORS, SIZES, TYPOGRAPHY, SHADOWS } from '../../theme/theme';
import { GlassCard } from '../../components/common/Cards';
import { LinearGradient } from 'expo-linear-gradient';
import { driverApi, DriverProfile } from '../../api/driverApi';

const { width, height } = Dimensions.get('window');

const MOCK_PICKUP = { latitude: 12.9352, longitude: 77.6245 }; // Koramangala
const MOCK_DROP = { latitude: 12.9716, longitude: 77.5946 };   // MG Road
const ORS_API_KEY = '5b3ce3597851110001cf62482d8a30b2452a445883bb9fe53d4220f4';

export const MapScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [vehicleType, setVehicleType] = useState<string>('TRUCK');
  const webviewRef = useRef<WebView>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      // Fetch Driver Profile for Vehicle Type
      try {
        const res = await driverApi.getMe();
        if (res.data?.data?.vehicleType) {
          setVehicleType(res.data.data.vehicleType);
        }
      } catch (e) {
        console.error("Failed to fetch driver profile", e);
      }

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Start watching position
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 5,
          },
          (loc) => {
            setLocation(loc);
            
            // Send new location to the webview
            if (webviewRef.current) {
              const script = `
                if (window.updateDriverMarker) {
                  window.updateDriverMarker(${loc.coords.latitude}, ${loc.coords.longitude});
                }
                true;
              `;
              webviewRef.current.injectJavaScript(script);
            }
          }
        );
      }

      // Fetch Polyline from OpenRouteService
      try {
        const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${MOCK_PICKUP.longitude},${MOCK_PICKUP.latitude}&end=${MOCK_DROP.longitude},${MOCK_DROP.latitude}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          // OpenRouteService returns [lng, lat]
          const coordinates = data.features[0].geometry.coordinates;
          // Leaflet expects [lat, lng]
          const leafletCoords = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          setRouteCoords(leafletCoords);
        }
      } catch (err) {
        console.error("Failed to fetch route:", err);
      }
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const getLeafletHtml = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { padding: 0; margin: 0; background-color: #0F172A; }
          html, body, #map { height: 100%; width: 100%; }
          
          /* Leaflet Dark Theme Overrides */
          .leaflet-layer,
          .leaflet-control-zoom-in,
          .leaflet-control-zoom-out,
          .leaflet-control-attribution {
            filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
          }
          
          .custom-marker {
            display: flex;
            justify-content: center;
            align-items: center;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          }
          .driver-marker {
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #000;
            border-radius: 50%;
            border: 2px solid #3b82f6; /* Blue border */
            box-shadow: 0 0 15px rgba(59,130,246,0.6);
            color: #fff;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', {
            zoomControl: false,
            attributionControl: false
          });
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
          }).addTo(map);

          // Define bounds to fit all markers/routes
          const bounds = L.latLngBounds();

          // Add Pickup Marker
          const pickupIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: ${COLORS.primary}; width: 100%; height: 100%; border-radius: 50%;"></div>',
            iconSize: [24, 24]
          });
          const pickupMarker = L.marker([${MOCK_PICKUP.latitude}, ${MOCK_PICKUP.longitude}], { icon: pickupIcon }).addTo(map);
          bounds.extend(pickupMarker.getLatLng());

          // Add Drop Marker
          const dropIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: ${COLORS.success}; width: 100%; height: 100%; border-radius: 50%;"></div>',
            iconSize: [24, 24]
          });
          const dropMarker = L.marker([${MOCK_DROP.latitude}, ${MOCK_DROP.longitude}], { icon: dropIcon }).addTo(map);
          bounds.extend(dropMarker.getLatLng());

          // Add Route Polyline
          const routeCoords = ${JSON.stringify(routeCoords)};
          if (routeCoords.length > 0) {
            const polyline = L.polyline(routeCoords, {
              color: '${COLORS.primary}',
              weight: 4,
              opacity: 0.8
            }).addTo(map);
            bounds.extend(polyline.getBounds());
          }

          // Fit bounds
          map.fitBounds(bounds, { padding: [50, 50] });

          // Vehicle Icons logic
          const vType = '${vehicleType}';
          let vehicleSvg = \`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11h1"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>\`; // Default Truck
          
          if (vType === 'BIKE' || vType === 'BICYCLE') {
            vehicleSvg = \`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg>\`;
          } else if (vType === 'CAR' || vType === 'AUTO_RICKSHAW') {
            vehicleSvg = \`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>\`;
          } else if (vType === 'VAN' || vType === 'TEMPO') {
            // Keep default truck
          }

          let driverMarker = null;
          
          window.updateDriverMarker = function(lat, lng) {
            if (!driverMarker) {
              const driverIcon = L.divIcon({
                className: 'driver-marker',
                html: vehicleSvg,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              });
              driverMarker = L.marker([lat, lng], { icon: driverIcon, zIndexOffset: 1000 }).addTo(map);
            } else {
              driverMarker.setLatLng([lat, lng]);
            }
          };

          // Initialize with current location if available
          ${location ? `window.updateDriverMarker(${location.coords.latitude}, ${location.coords.longitude});` : ''}

        </script>
      </body>
      </html>
    `;
  };

  const handleCenterLocation = () => {
    if (location && webviewRef.current) {
      const script = `
        map.setView([${location.coords.latitude}, ${location.coords.longitude}], 16);
        true;
      `;
      webviewRef.current.injectJavaScript(script);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webviewRef}
        originWhitelist={['*']}
        source={{ html: getLeafletHtml() }}
        style={styles.map}
        scrollEnabled={false}
      />

      {/* Floating Action Button for Location */}
      <TouchableOpacity style={styles.myLocationBtn} onPress={handleCenterLocation}>
        <Navigation size={24} color={COLORS.primaryLight} />
      </TouchableOpacity>

      {/* Bottom Floating Card for Active Trip */}
      <View style={styles.bottomCardContainer}>
        <GlassCard style={styles.tripCard}>
          <View style={styles.dragHandle} />
          
          <View style={styles.tripHeader}>
            <View style={styles.etaContainer}>
              <Text style={styles.etaTime}>14 min</Text>
              <Text style={styles.etaDistance}>4.2 km</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
              <Text style={[styles.statusBadgeText, { color: COLORS.info }]}>IN TRANSIT</Text>
            </View>
          </View>

          <View style={styles.addressRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>Pickup</Text>
              <Text style={styles.addressText}>12 MG Road, Bengaluru</Text>
            </View>
          </View>

          <View style={styles.connector} />

          <View style={styles.addressRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>Dropoff</Text>
              <Text style={styles.addressText}>45 Koramangala, Bengaluru</Text>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.8} style={{ marginTop: SIZES.lg }}>
            <LinearGradient
              colors={[COLORS.primaryLight, COLORS.primary]}
              style={styles.actionBtn}
            >
              <Truck size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Mark as Delivered</Text>
            </LinearGradient>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  map: { width: width, height: height, backgroundColor: COLORS.background },
  
  myLocationBtn: {
    position: 'absolute',
    right: SIZES.lg,
    top: 60, // Safe area top
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },

  bottomCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SIZES.lg,
    paddingBottom: Platform.OS === 'ios' ? 90 : 70, // Room for bottom tabs
  },
  tripCard: {
    padding: SIZES.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderTopLeftRadius: SIZES.radiusXl,
    borderTopRightRadius: SIZES.radiusXl,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SIZES.md,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.lg,
  },
  etaContainer: { flexDirection: 'row', alignItems: 'baseline', gap: SIZES.sm },
  etaTime: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  etaDistance: { ...TYPOGRAPHY.body2, color: COLORS.textMuted },
  statusBadge: { borderRadius: SIZES.radiusFull, paddingHorizontal: SIZES.md, paddingVertical: 4 },
  statusBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SIZES.md },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, borderWidth: 2, borderColor: COLORS.background },
  connector: { width: 2, height: 20, backgroundColor: COLORS.border, marginLeft: 5, marginVertical: 2 },
  addressInfo: { flex: 1 },
  addressLabel: { ...TYPOGRAPHY.caption, color: COLORS.textMuted, marginBottom: 2 },
  addressText: { ...TYPOGRAPHY.body1, fontWeight: '600' },

  actionBtn: {
    height: 56,
    borderRadius: SIZES.radiusLg,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SIZES.sm,
    ...SHADOWS.glow,
  },
  actionBtnText: { ...TYPOGRAPHY.button, color: '#fff' },
});
