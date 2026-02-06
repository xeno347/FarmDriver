import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ImageBackground, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native'; // 1. Import Navigation Hook
import useThemeColors from '../theme/useThemeColors';
import { useApp } from '../contexts/AppContext';
import { VEHICLE_ID } from '../config/env';

const HomeScreen = () => {
  const colors = useThemeColors();
  const { isCheckedIn, checkIn, checkOut } = useApp();
  const navigation = useNavigation(); // 2. Initialize Navigation
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'checkin' | 'checkout'>('checkin');
  const [initialEngineHours, setInitialEngineHours] = useState('');
  const [finalEngineHours, setFinalEngineHours] = useState('');
  const [fuelRequiredLiters, setFuelRequiredLiters] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const styles = makeStyles(colors);

  const handleTractorPress = async () => {
    if (!isCheckedIn) {
      setModalMode('checkin');
      setModalVisible(true);
      return;
    }

    // If already checked in -> collect checkout details first
    setModalMode('checkout');
    setModalVisible(true);
  };

  const handleCheckInSubmit = async () => {
    if (submitting) return;
    const initial = parseFloat(initialEngineHours);
    if (!Number.isFinite(initial) || initial <= 0) {
      Alert.alert('Missing Info', 'Please enter a valid initial engine hours value.');
      return;
    }

    setSubmitting(true);
    try {
      await checkIn(VEHICLE_ID, initial);
      setModalVisible(false);
      Alert.alert('Checked In', 'Initial engine hours saved.');
      setInitialEngineHours('');
    } catch (e: any) {
      Alert.alert('Check-in Failed', String(e?.message || 'Unable to check in.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOutSubmit = async () => {
    if (submitting) return;
    const finalValue = parseFloat(finalEngineHours);
    const fuelLiters = parseFloat(fuelRequiredLiters);
    if (!Number.isFinite(finalValue) || finalValue <= 0) {
      Alert.alert('Missing Info', 'Please enter a valid final engine hours value.');
      return;
    }
    if (!Number.isFinite(fuelLiters) || fuelLiters < 0) {
      Alert.alert('Missing Info', 'Please enter a valid fuel requirement (liters).');
      return;
    }

    setSubmitting(true);
    try {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        // eslint-disable-next-line no-console
        console.log('[HomeScreen] CheckOut pressed', { finalValue, fuelLiters });
      }
      await checkOut(finalValue, fuelLiters);
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        // eslint-disable-next-line no-console
        console.log('[HomeScreen] CheckOut success');
      }
      setModalVisible(false);
      Alert.alert('Checked Out', `Fuel required: ${fuelLiters}L. Final engine hours saved.`);
      setFinalEngineHours('');
      setFuelRequiredLiters('');
    } catch (e: any) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        // eslint-disable-next-line no-console
        console.log('[HomeScreen] CheckOut failed', e);
      }
      Alert.alert('Check-out Failed', String(e?.message || 'Unable to check out.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    > 
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>DRIVER CONTROL</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
             <View style={[styles.dot, { backgroundColor: isCheckedIn ? colors.success : colors.textMuted }]} />
             <Text style={[styles.subTitle, { color: colors.textSecondary }]}>
               {isCheckedIn ? "SYSTEM ACTIVE" : "SYSTEM STANDBY"}
             </Text>
          </View>
        </View>
        <Text style={[styles.shiftText, { color: colors.textSecondary }]}>
          SHIFT <Text style={{ color: colors.textPrimary, fontWeight: '800' }}>Morning</Text>
        </Text>
      </View>

      {/* VEHICLE CARD */}
      <TouchableOpacity 
        activeOpacity={0.95} 
        onPress={handleTractorPress}
        style={styles.vehicleCard}
      >
        <ImageBackground
          source={require('../assets/tractor.png')}
          style={styles.vehicleBg}
          imageStyle={{
            borderRadius: 20,
            resizeMode: 'cover',
            ...(isCheckedIn ? {} : { tintColor: '#95a5a6' }),
          }}
        >
           <View style={styles.cardTopRow}>
            <View style={styles.idPill}> 
              <Text style={styles.idText}>TRC-2024-01</Text>
            </View>
          </View>

          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.statusTitle}>
                {isCheckedIn ? "CHECKED IN" : "TAP TO START"}
              </Text>
              {isCheckedIn && (
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                  <Text style={{fontSize: 16, fontWeight: '600', color: colors.success}}>~ Engine Running</Text>
                </View>
              )}
            </View>

            {isCheckedIn && (
              <View style={styles.fuelWidget}>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom: 2}}>
                    <Text style={{fontSize: 12, color: colors.textPrimary}}>⛽</Text> 
                    <Text style={styles.fuelLabel}> FUEL</Text>
                </View>
                <Text style={styles.fuelPercent}>45<Text style={{fontSize: 14}}>%</Text></Text>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '45%' }]} />
                </View>
              </View>
            )}
          </View>
        </ImageBackground>
      </TouchableOpacity>

      {/* POST CHECK-IN ACTIONS */}
      {isCheckedIn && (
        <View style={styles.actionContainer}>
           
          {/* 3. VIEW ALL TASKS BUTTON - NOW CONNECTED */}
          <TouchableOpacity 
            style={styles.taskButton}
            onPress={() => navigation.navigate && navigation.navigate('Tasks' as never)}
          >
             <View style={styles.iconCircle}>
                <Text style={{fontSize: 18, color: '#fff'}}>📋</Text>
             </View>
             <View style={{flex: 1}}>
               <Text style={styles.taskBtnTitle}>VIEW ALL TASKS</Text>
               <Text style={styles.taskBtnSub}>Check your assigned tasks for today</Text>
             </View>
             <Text style={{fontSize: 20, color: '#fff', fontWeight: 'bold'}}>→</Text>
          </TouchableOpacity>

          <View style={styles.successPanel}>
             <View style={styles.successIcon}>
               <Text style={{color: colors.success, fontWeight: 'bold'}}>✓</Text>
             </View>
             <View>
               <Text style={styles.successTitle}>INITIALIZATION COMPLETE</Text>
               <Text style={styles.successSub}>Engine hours locked</Text>
             </View>
          </View>

          {/* Fuel request summary removed (moved to checkout flow) */}

        </View>
      )}

      {/* MODAL (Same as before) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {modalMode === 'checkin' && (
              <>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Check In</Text>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Enter Initial Engine Hours</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="e.g. 12054"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={initialEngineHours}
                  onChangeText={setInitialEngineHours}
                />
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={handleCheckInSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Check In</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
            {modalMode === 'checkout' && (
              <>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Check Out</Text>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Enter Final Engine Hours</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="e.g. 12110"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={finalEngineHours}
                  onChangeText={setFinalEngineHours}
                />

                <Text style={[styles.label, { color: colors.textSecondary }]}>Fuel Requirement (Liters)</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="e.g. 45"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={fuelRequiredLiters}
                  onChangeText={setFuelRequiredLiters}
                />
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.primary }]} 
                  onPress={handleCheckOutSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Check Out</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={{marginTop: 15}}>
                  <Text style={{color: colors.textSecondary}}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </ScrollView>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, paddingTop: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, marginBottom: 20 },
    headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 0.5 },
    subTitle: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
    dot: { width: 8, height: 8, borderRadius: 4 },
    shiftText: { fontSize: 13, fontWeight: '600' },
    vehicleCard: { marginHorizontal: 20, height: 320, borderRadius: 24, backgroundColor: colors.card, elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, overflow: 'hidden' },
    vehicleBg: { width: '100%', height: '100%', justifyContent: 'space-between' },
    cardTopRow: { padding: 20 },
    idPill: { backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignSelf: 'flex-start' },
    idText: { fontWeight: '800', fontSize: 12, color: colors.textPrimary },
    cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 20, paddingBottom: 25 },
    statusTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },
    fuelWidget: { backgroundColor: 'rgba(30,30,30,0.85)', padding: 14, borderRadius: 16, width: 110 },
    fuelLabel: { color: '#ecf0f1', fontSize: 10, fontWeight: '800' },
    fuelPercent: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
    progressBarBg: { height: 6, backgroundColor: '#555', borderRadius: 3, marginTop: 8 },
    progressBarFill: { height: '100%', backgroundColor: colors.warning, borderRadius: 3 },
    actionContainer: { paddingHorizontal: 20, marginTop: 24 },
    taskButton: { backgroundColor: colors.info, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, marginBottom: 16, elevation: 4 },
    iconCircle: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    taskBtnTitle: { color: '#fff', fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
    taskBtnSub: { color: '#e1bee7', fontSize: 12, fontWeight: '500', marginTop: 2 },
    successPanel: { backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
    successIcon: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: colors.success, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    successTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
    successSub: { color: colors.textSecondary, fontSize: 11, fontWeight: '500', marginTop: 2 },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContent: { width: '85%', padding: 24, borderRadius: 24, alignItems: 'center', elevation: 10 },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
    label: { alignSelf: 'flex-start', fontSize: 14, marginBottom: 8, fontWeight: '600' },
    input: { width: '100%', height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 20 },
    modalButton: { width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 }
  });

export default HomeScreen;