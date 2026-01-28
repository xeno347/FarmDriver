import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import useThemeColors from '../theme/useThemeColors';

const MapPlaceholder = () => {
  const colors = useThemeColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <Icon name="map" size={48} color={colors.primary} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>Map Placeholder</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Install and configure react-native-maps for an interactive map.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    marginHorizontal: 24,
    borderRadius: 12,
    backgroundColor: undefined,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  title: { fontWeight: 'bold', marginTop: 8 },
  subtitle: { marginTop: 6, textAlign: 'center', fontSize: 12 },
});

export default MapPlaceholder;
