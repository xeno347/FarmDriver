import React, { useEffect, useState } from 'react';
import { View, StyleSheet, PermissionsAndroid, Platform, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

type LatLng = { latitude: number; longitude: number };
type Region = LatLng & { latitudeDelta: number; longitudeDelta: number };

const MapViewWrapper: React.FC = () => {
  const [region, setRegion] = useState<Region | null>(null);
  const [location, setLocation] = useState<LatLng | null>(null);

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to show your position on the map.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location permission is required to show your position.');
          return;
        }
      }

      // FIX: Cast globalThis to 'any' to avoid the "no index signature" error
      // and remove the explicit "as Navigator" cast since the type doesn't exist in RN.
      const nav = (globalThis as any).navigator;

      if (nav && nav.geolocation) {
        nav.geolocation.getCurrentPosition(
          (pos: any) => {
            const { latitude, longitude } = pos.coords;
            setLocation({ latitude, longitude });
            setRegion({
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          },
          (_err: any) => {
            Alert.alert('Location Error', 'Could not get your location.');
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      }
    };
    requestLocationPermission();
  }, []);

  if (!region) {
    return <View style={styles.loading} />;
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={true}
      >
        {location && <Marker coordinate={location} title="You are here" />}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, height: 200, borderRadius: 12, overflow: 'hidden', marginHorizontal: 24 },
  map: { flex: 1 },
  loading: { height: 200, marginHorizontal: 24, borderRadius: 12, backgroundColor: '#eee' },
});

export default MapViewWrapper;