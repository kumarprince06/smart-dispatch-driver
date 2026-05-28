import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { Navigation, MapPin, Truck, Bike, Car, Package, CheckCircle } from 'lucide-react-native';
import { COLORS, SIZES, TYPOGRAPHY, SHADOWS } from '../../theme/theme';
import { GlassCard } from '../../components/common/Cards';
import { CustomAlert } from '../../components/common/CustomAlert';
import { LinearGradient } from 'expo-linear-gradient';
import { driverApi } from '../../api/driverApi';
import { orderApi, OrderResponse } from '../../api/orderApi';

const { width, height } = Dimensions.get('window');

const ORS_API_KEY = '5b3ce3597851110001cf62482d8a30b2452a445883bb9fe53d4220f4';

export const MapScreen = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [vehicleType, setVehicleType] = useState<string>('TRUCK');
  const [activeOrder, setActiveOrder] = useState<OrderResponse | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type?: 'error' | 'info' | 'logout';
    buttons?: any[];
  }>({ visible: false, title: '', message: '' });

  const webviewRef = useRef<WebView>(null);

  const fetchActiveOrder = async () => {
    setIsLoadingOrder(true);
    try {
      const res = await orderApi.getDriverOrders(0, 20);
      const orders = res.data?.data?.content ?? [];
      
      // Priority: IN_TRANSIT -> PICKED_UP -> ASSIGNED
      const inTransit = orders.find((o: OrderResponse) => o.status === 'IN_TRANSIT');
      if (inTransit) {
        setActiveOrder(inTransit);
      } else {
        const pickedUp = orders.find((o: OrderResponse) => o.status === 'PICKED_UP');
        if (pickedUp) {
          setActiveOrder(pickedUp);
        } else {
          const assigned = orders.find((o: OrderResponse) => o.status === 'ASSIGNED');
          setActiveOrder(assigned || null);
        }
      }
    } catch (e) {
      console.error("Failed to fetch active order", e);
    } finally {
      setIsLoadingOrder(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchActiveOrder();
    }, [])
  );

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
      const fetchRoute = async () => {
        if (!activeOrder?.pickupLatitude || !activeOrder?.dropLatitude) return;
        
        try {
          const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${activeOrder.pickupLongitude},${activeOrder.pickupLatitude}&end=${activeOrder.dropLongitude},${activeOrder.dropLatitude}`;
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
      };

      if (activeOrder) {
        fetchRoute();
      }
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [activeOrder?.orderId || activeOrder?.id]);

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

          ${activeOrder ? `
          // Add Pickup Marker
          const pickupIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: ${COLORS.primary}; width: 100%; height: 100%; border-radius: 50%;"></div>',
            iconSize: [24, 24]
          });
          const pickupMarker = L.marker([${activeOrder.pickupLatitude}, ${activeOrder.pickupLongitude}], { icon: pickupIcon }).addTo(map);
          bounds.extend(pickupMarker.getLatLng());

          // Add Drop Marker
          const dropIcon = L.divIcon({
            className: 'custom-marker',
            html: '<div style="background-color: ${COLORS.success}; width: 100%; height: 100%; border-radius: 50%;"></div>',
            iconSize: [24, 24]
          });
          const dropMarker = L.marker([${activeOrder.dropLatitude}, ${activeOrder.dropLongitude}], { icon: dropIcon }).addTo(map);
          bounds.extend(dropMarker.getLatLng());
          ` : ''}

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
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
          } else if (${location ? 'true' : 'false'}) {
            map.setView([${location?.coords.latitude || 0}, ${location?.coords.longitude || 0}], 16);
          }

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

  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeOrder) return;
    setIsUpdatingStatus(true);
    try {
      const orderId = activeOrder.orderId || activeOrder.id;
      if (!orderId) throw new Error('No valid Order ID found');
      await orderApi.updateOrderStatus(orderId, newStatus);
      setAlertConfig({
        visible: true,
        title: 'Status Updated',
        message: `Order marked as ${newStatus?.replace('_', ' ')}`,
        type: 'info',
        buttons: [{ text: 'OK', onPress: () => fetchActiveOrder() }]
      });
    } catch (e: any) {
      setAlertConfig({
        visible: true,
        title: 'Update Failed',
        message: e?.response?.data?.message || 'Could not update status',
        type: 'error',
        buttons: [{ text: 'OK', style: 'default' }]
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getActionBtnConfig = () => {
    switch(activeOrder?.status) {
      case 'ASSIGNED':
        return { text: 'Mark as Picked Up', icon: <Package size={20} color="#fff" />, action: 'PICKED_UP' };
      case 'PICKED_UP':
        return { text: 'Start Transit', icon: <Truck size={20} color="#fff" />, action: 'IN_TRANSIT' };
      case 'IN_TRANSIT':
        return { text: 'Mark as Delivered', icon: <CheckCircle size={20} color="#fff" />, action: 'DELIVERED' };
      default:
        return null;
    }
  };

  const btnConfig = getActionBtnConfig();

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
        {isLoadingOrder ? (
          <GlassCard style={[styles.tripCard, { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }]}>
            <ActivityIndicator size="large" color={COLORS.primaryLight} />
            <Text style={{ ...TYPOGRAPHY.body2, color: COLORS.textMuted, marginTop: SIZES.md }}>Searching for active trip...</Text>
          </GlassCard>
        ) : activeOrder ? (
          <GlassCard style={styles.tripCard}>
            <View style={styles.dragHandle} />
            
            <View style={styles.tripHeader}>
              <View style={styles.etaContainer}>
                <Text style={styles.etaTime}>
                  {activeOrder.distanceKm || activeOrder.estimatedDistance 
                    ? Math.round((activeOrder.distanceKm || activeOrder.estimatedDistance || 0) * 3) + ' min' 
                    : '—'}
                </Text>
                <Text style={styles.etaDistance}>
                  {activeOrder.distanceKm || activeOrder.estimatedDistance 
                    ? (activeOrder.distanceKm || activeOrder.estimatedDistance) + ' km' 
                    : '—'}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
                <Text style={[styles.statusBadgeText, { color: COLORS.info }]}>{activeOrder?.status?.replace('_', ' ') || ''}</Text>
              </View>
            </View>

            <View style={styles.addressRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>Pickup</Text>
                <Text style={styles.addressText} numberOfLines={2}>{activeOrder.pickupAddress}</Text>
              </View>
            </View>

            <View style={styles.connector} />

            <View style={styles.addressRow}>
              <View style={[styles.dot, { backgroundColor: COLORS.success }]} />
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>Dropoff</Text>
                <Text style={styles.addressText} numberOfLines={2}>{activeOrder.dropAddress}</Text>
              </View>
            </View>

            {btnConfig && (
              <TouchableOpacity 
                activeOpacity={0.8} 
                style={{ marginTop: SIZES.lg }}
                onPress={() => handleUpdateStatus(btnConfig.action)}
                disabled={isUpdatingStatus}
              >
                <LinearGradient
                  colors={[COLORS.primaryLight, COLORS.primary]}
                  style={styles.actionBtn}
                >
                  {isUpdatingStatus ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      {btnConfig.icon}
                      <Text style={styles.actionBtnText}>{btnConfig.text}</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </GlassCard>
        ) : (
          <GlassCard style={[styles.tripCard, { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }]}>
            <Navigation size={40} color={COLORS.textMuted} />
            <Text style={{ ...TYPOGRAPHY.h3, color: COLORS.text, marginTop: SIZES.md }}>No Active Trip</Text>
            <Text style={{ ...TYPOGRAPHY.body2, color: COLORS.textMuted, marginTop: SIZES.xs, textAlign: 'center' }}>Go online from the dashboard to receive orders.</Text>
          </GlassCard>
        )}
      </View>

      <CustomAlert
        {...alertConfig}
        onDismiss={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
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
