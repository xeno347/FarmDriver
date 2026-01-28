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
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native'; // 1. Import Navigation Hook
import useThemeColors from '../theme/useThemeColors';
import { useApp } from '../contexts/AppContext';

const HomeScreen = () => {
  const colors = useThemeColors();
  const { isCheckedIn, checkIn } = useApp();
  const navigation = useNavigation(); // 2. Initialize Navigation
  
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [engineHours, setEngineHours] = useState('');
  const [fuelRequest, setFuelRequest] = useState('');
  const [requestDetails, setRequestDetails] = useState(null);

  const styles = makeStyles(colors);

  const handleTractorPress = () => {
    if (!isCheckedIn) {
      setStep(1);
      setModalVisible(true);
    }
  };

  const handleFinalSubmit = () => {
    const randomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const location = "Fuel Station B (North)";

    setRequestDetails({
      id: randomId,
      location: location,
      status: 'Pending'
    });

    if (parseFloat(fuelRequest) > 0) {
      Alert.alert("Request Pending", `Fuel request for ${fuelRequest}L sent. Status is now PENDING.`);
    }

    setModalVisible(false);
    checkIn('TRC-2024-01');
  };

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: '#F5F7FA' }]}
      contentContainerStyle={{ paddingBottom: 40 }}
    > 
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: '#002f5b' }]}>DRIVER CONTROL</Text>
          <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
             <View style={[styles.dot, { backgroundColor: isCheckedIn ? '#2ecc71' : '#bdc3c7' }]} />
             <Text style={[styles.subTitle, { color: '#7f8c8d' }]}>
               {isCheckedIn ? "SYSTEM ACTIVE" : "SYSTEM STANDBY"}
             </Text>
          </View>
        </View>
        <Text style={[styles.shiftText, { color: '#7f8c8d' }]}>
          SHIFT <Text style={{ color: '#2c3e50', fontWeight: '800' }}>Morning</Text>
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
            tintColor: isCheckedIn ? null : '#95a5a6',
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
                  <Text style={{fontSize: 16, fontWeight: '600', color: '#69f0ae'}}>~ Engine Running</Text>
                </View>
              )}
            </View>

            {isCheckedIn && (
              <View style={styles.fuelWidget}>
                <View style={{flexDirection:'row', alignItems:'center', marginBottom: 2}}>
                    <Text style={{fontSize: 12}}>⛽</Text> 
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
            onPress={() => navigation.navigate('Tasks')} 
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
               <Text style={{color: '#27ae60', fontWeight: 'bold'}}>✓</Text>
             </View>
             <View>
               <Text style={styles.successTitle}>INITIALIZATION COMPLETE</Text>
               <Text style={styles.successSub}>Engine hours locked • Fuel request confirmed</Text>
             </View>
          </View>

          {requestDetails && (
            <View style={styles.fuelInfoCard}>
              <View style={[styles.fuelInfoHeader, { backgroundColor: '#FFF8E1', borderBottomColor: '#FFE0B2' }]}>
                <Text style={[styles.fuelInfoTitle, { color: '#F57C00' }]}>⚠ REQUEST PENDING</Text>
              </View>
              <View style={styles.fuelInfoRow}>
                <View style={{alignItems: 'center'}}>
                  <Text style={styles.fuelInfoLabel}>REQUEST ID</Text>
                  <Text style={styles.fuelInfoValue}>{requestDetails.id}</Text>
                </View>
                <View style={styles.dividerVertical}/>
                <View style={{alignItems: 'center'}}>
                  <Text style={styles.fuelInfoLabel}>COLLECTION POINT</Text>
                  <Text style={styles.fuelInfoValue}>{requestDetails.location}</Text>
                </View>
              </View>
              <View style={styles.fuelInfoFooter}>
                <Text style={styles.fuelFooterText}>Status will be confirmed from the main portal</Text>
              </View>
            </View>
          )}

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
            {step === 1 && (
              <>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Step 1: Engine Check</Text>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Enter Current Engine Hours</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="e.g. 12054"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={engineHours}
                  onChangeText={setEngineHours}
                />
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.primary }]}
                  onPress={() => setStep(2)}
                >
                  <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
              </>
            )}
            {step === 2 && (
              <>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Step 2: Fuel Level</Text>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Request Fuel (Liters)</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="e.g. 45"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={fuelRequest}
                  onChangeText={setFuelRequest}
                />
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#4CAF50' }]} 
                  onPress={handleFinalSubmit}
                >
                  <Text style={styles.buttonText}>Check In & Request</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep(1)} style={{marginTop: 15}}>
                   <Text style={{color: colors.textSecondary}}>Back</Text>
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
    vehicleCard: { marginHorizontal: 20, height: 320, borderRadius: 24, backgroundColor: '#fff', elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, overflow: 'hidden' },
    vehicleBg: { width: '100%', height: '100%', justifyContent: 'space-between' },
    cardTopRow: { padding: 20 },
    idPill: { backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#ecf0f1', alignSelf: 'flex-start' },
    idText: { fontWeight: '800', fontSize: 12, color: '#2c3e50' },
    cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 20, paddingBottom: 25 },
    statusTitle: { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 10 },
    fuelWidget: { backgroundColor: 'rgba(30,30,30,0.85)', padding: 14, borderRadius: 16, width: 110 },
    fuelLabel: { color: '#ecf0f1', fontSize: 10, fontWeight: '800' },
    fuelPercent: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
    progressBarBg: { height: 6, backgroundColor: '#555', borderRadius: 3, marginTop: 8 },
    progressBarFill: { height: '100%', backgroundColor: '#f39c12', borderRadius: 3 },
    actionContainer: { paddingHorizontal: 20, marginTop: 24 },
    taskButton: { backgroundColor: '#9b59b6', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, marginBottom: 16, elevation: 4 },
    iconCircle: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
    taskBtnTitle: { color: '#fff', fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
    taskBtnSub: { color: '#e1bee7', fontSize: 12, fontWeight: '500', marginTop: 2 },
    successPanel: { backgroundColor: '#e8f5e9', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#c8e6c9', marginBottom: 16 },
    successIcon: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#27ae60', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    successTitle: { color: '#145a32', fontSize: 14, fontWeight: '800', textTransform: 'uppercase' },
    successSub: { color: '#1e8449', fontSize: 11, fontWeight: '500', marginTop: 2 },
    fuelInfoCard: { backgroundColor: '#fff', borderRadius: 18, borderWidth: 1, borderColor: '#ffe0b2', overflow: 'hidden', elevation: 2, marginBottom: 20 },
    fuelInfoHeader: { paddingVertical: 10, alignItems: 'center', borderBottomWidth: 1 },
    fuelInfoTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
    fuelInfoRow: { flexDirection: 'row', padding: 20, justifyContent: 'space-evenly', alignItems: 'center' },
    fuelInfoLabel: { color: '#7f8c8d', fontSize: 10, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
    fuelInfoValue: { color: '#2c3e50', fontSize: 18, fontWeight: '800' },
    dividerVertical: { width: 1, height: '100%', backgroundColor: '#ecf0f1' },
    fuelInfoFooter: { backgroundColor: '#fafafa', padding: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
    fuelFooterText: { color: '#95a5a6', fontSize: 11, fontStyle: 'italic' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
    modalContent: { width: '85%', padding: 24, borderRadius: 24, alignItems: 'center', elevation: 10 },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 20 },
    label: { alignSelf: 'flex-start', fontSize: 14, marginBottom: 8, fontWeight: '600' },
    input: { width: '100%', height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 20 },
    modalButton: { width: '100%', height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 }
  });

export default HomeScreen;