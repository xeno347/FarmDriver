import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Modal,
  Switch,
  Alert
} from 'react-native';
// import { WebView } from 'react-native-webview'; // Commented out for safety
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Types ---
type Request = {
  id: number;
  type: 'fuel' | 'logistics';
  status: 'pending' | 'approved' | 'done';
  title: string;
  reqId?: string;
  amount?: string;
  note?: string;
  location?: string;
  date?: string;
  time?: string;
  colorBg: string;
  borderColor: string;
};

// --- Mock Data ---
const initialRequests: Request[] = [
  { 
    id: 1, 
    type: 'fuel', 
    status: 'approved', 
    title: 'FUEL REQUEST',
    amount: '200L', 
    location: 'North Field A (Pinned)',
    colorBg: '#EFF6FF', 
    borderColor: '#BFDBFE',
  },
  { 
    id: 2, 
    type: 'logistics', 
    status: 'pending', 
    title: 'SPARE PARTS DELIVERY',
    reqId: 'REQ-002',
    note: 'Oil filter, air filter, and drive belt needed', 
    location: 'East Field B', 
    date: '2026-01-26',
    time: '16:30',
    colorBg: '#FFFFFF', 
    borderColor: '#E5E7EB',
  },
];

// --- Helpers ---
const getIconStyles = (type: string) => {
  return type === 'fuel' 
    ? { bg: '#FFFBEB', border: '#FCD34D', icon: '#F59E0B', name: 'droplet' }
    : { bg: '#F3E8FF', border: '#DDD6FE', icon: '#7C3AED', name: 'package' };
};

const getStatusIcon = (req: Request) => {
  if (req.status === 'approved') return { name: 'check-circle', color: '#2563EB' };
  if (req.status === 'done') return { name: 'check-circle-outline', color: '#059669' };
  return { name: 'circle-outline', color: '#9CA3AF' };
};

const RequestsScreen = () => {
  const [requests, setRequests] = useState(initialRequests);
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);

  // Form State
  const [requestType, setRequestType] = useState<'fuel'|'logistics'>('fuel');
  const [reqName, setReqName] = useState('');
  const [note, setNote] = useState('');
  
  // Fuel State
  const [fuelAmount, setFuelAmount] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [manualLocation, setManualLocation] = useState('');
  
  // Logistics State
  const [logisticsLocation, setLogisticsLocation] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleMakeRequest = () => {
    const newReq: Request = {
      id: Date.now(),
      type: requestType,
      status: 'pending',
      title: requestType === 'fuel' ? 'FUEL REQUEST' : reqName || 'LOGISTICS REQUEST',
      reqId: `REQ-${Math.floor(Math.random() * 1000)}`,
      colorBg: '#FFFFFF',
      borderColor: '#E5E7EB',
    };

    if (requestType === 'fuel') {
      newReq.amount = fuelAmount + 'L';
      newReq.location = useCurrentLocation 
        ? `Current Location (GPS)` 
        : manualLocation;
    } else {
      newReq.note = note;
      newReq.location = logisticsLocation;
      newReq.date = date;
      newReq.time = time;
    }

    setRequests([newReq, ...requests]);
    setShowNewModal(false);
    setFuelAmount('');
    setNote('');
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>REQUESTS</Text>
          <Text style={styles.subHeader}>SERVICE & LOGISTICS</Text>
        </View>
        <TouchableOpacity style={styles.newButton} onPress={() => setShowNewModal(true)}>
          <Icon name="plus" size={18} color="#fff" />
          <Text style={styles.newButtonText}>MAKE REQUEST</Text>
        </TouchableOpacity>
      </View>

      {/* STATUS ROW */}
      <View style={styles.statusRow}>
        <View style={[styles.statusCard, styles.cardPending]}> 
          <Text style={styles.statusLabel}>PENDING</Text>
          <Text style={[styles.statusValue, { color: '#1F2937' }]}>{requests.filter(r => r.status === 'pending').length}</Text>
        </View>
        <View style={[styles.statusCard, styles.cardApproved]}> 
          <Text style={[styles.statusLabel, {color: '#1E40AF'}]}>APPROVED</Text>
          <Text style={[styles.statusValue, { color: '#1E40AF' }]}>{requests.filter(r => r.status === 'approved').length}</Text>
        </View>
        <View style={[styles.statusCard, styles.cardDone]}> 
          <Text style={[styles.statusLabel, {color: '#065F46'}]}>DONE</Text>
          <Text style={[styles.statusValue, { color: '#065F46' }]}>1</Text>
        </View>
      </View>

      {/* LIST */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}>
        {requests.map((req) => {
          const iconStyle = getIconStyles(req.type);
          const statusIcon = getStatusIcon(req);

          return (
            <TouchableOpacity 
              key={req.id} 
              activeOpacity={0.8}
              onPress={() => setSelectedRequest(req)}
              style={[styles.requestCard, { backgroundColor: req.colorBg, borderColor: req.borderColor }]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.leftContainer}>
                  <View style={[styles.iconBox, { backgroundColor: '#fff', borderColor: iconStyle.border }]}>
                    <Icon name={iconStyle.name} size={20} color={iconStyle.icon} />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.reqTitle}>{req.title}</Text>
                    {req.type === 'logistics' && <Text style={styles.reqId}>{req.reqId}</Text>}
                    {req.type === 'fuel' && <Text style={styles.fuelAmount}>{req.amount}</Text>}
                  </View>
                </View>
                <MaterialIcon name={statusIcon.name} size={24} color={statusIcon.color} />
              </View>

              {req.type === 'fuel' && req.location && (
                 <View style={{ marginTop: 8, paddingLeft: 54 }}>
                    <View style={{flexDirection:'row', alignItems:'center'}}>
                      <Icon name="map-pin" size={10} color="#6B7280" />
                      <Text style={{fontSize: 11, color: '#6B7280', marginLeft: 4}}>{req.location}</Text>
                    </View>
                 </View>
              )}

              {req.type === 'logistics' && (
                <View style={styles.logisticsBody}>
                  <Text style={styles.logisticsNote}>{req.note}</Text>
                  <View style={styles.divider} />
                  <View style={styles.logisticsFooter}>
                    <Text style={styles.footerText}>{req.location}</Text>
                    <Text style={styles.footerText}>{req.date}  {req.time}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* --- NEW REQUEST MODAL --- */}
      <Modal visible={showNewModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>NEW REQUEST</Text>
              <TouchableOpacity onPress={() => setShowNewModal(false)}>
                <Icon name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>REQUEST TYPE</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity 
                  style={[styles.typeBtn, requestType === 'fuel' && styles.typeBtnFuel]}
                  onPress={() => setRequestType('fuel')}
                >
                  <Icon name="droplet" size={18} color={requestType === 'fuel' ? '#1F2937' : '#9CA3AF'} />
                  <Text style={[styles.typeBtnText, requestType === 'fuel' && {color:'#1F2937'}]}>FUEL</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.typeBtn, requestType === 'logistics' && styles.typeBtnLogistics]}
                  onPress={() => setRequestType('logistics')}
                >
                  <Icon name="package" size={18} color={requestType === 'logistics' ? '#7C3AED' : '#9CA3AF'} />
                  <Text style={[styles.typeBtnText, requestType === 'logistics' && {color:'#7C3AED'}]}>LOGISTICS</Text>
                </TouchableOpacity>
              </View>

              {/* FUEL FORM */}
              {requestType === 'fuel' && (
                <View>
                   <Text style={styles.label}>FUEL AMOUNT (LITERS)</Text>
                   <TextInput 
                      style={styles.input} 
                      placeholder="e.g. 150" 
                      keyboardType="numeric"
                      value={fuelAmount}
                      onChangeText={setFuelAmount}
                   />

                   <View style={styles.locationHeaderRow}>
                      <Text style={styles.label}>LOCATION</Text>
                      <View style={{flexDirection: 'row', alignItems: 'center'}}>
                         <Text style={[styles.label, {marginTop:0, marginBottom:0, marginRight: 8, fontSize: 10}]}>
                           USE CURRENT LOCATION
                         </Text>
                         <Switch 
                            value={useCurrentLocation}
                            onValueChange={setUseCurrentLocation}
                            trackColor={{ false: "#767577", true: "#10B981" }}
                            thumbColor={"#f4f3f4"}
                         />
                      </View>
                   </View>

                   {useCurrentLocation ? (
                     <View style={[styles.mapContainer, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#e5e7eb' }]}>
                        {/* MAP REMOVED FOR SAFETY - Text Placeholder */}
                        <Icon name="map-pin" size={24} color="#6B7280" />
                        <Text style={{color: '#6B7280', marginTop: 8}}>Map Loading...</Text>
                     </View>
                   ) : (
                     <TextInput 
                        style={styles.input} 
                        placeholder="Enter location manually..." 
                        value={manualLocation}
                        onChangeText={setManualLocation}
                     />
                   )}
                </View>
              )}

              {/* LOGISTICS FORM */}
              {requestType === 'logistics' && (
                <View>
                  <Text style={styles.label}>REQUEST NAME</Text>
                  <TextInput style={styles.input} placeholder="e.g., Spare Parts" value={reqName} onChangeText={setReqName} />
                  <Text style={styles.label}>NOTE</Text>
                  <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Details..." multiline value={note} onChangeText={setNote} />
                  <Text style={styles.label}>LOCATION</Text>
                  <TextInput style={styles.input} placeholder="e.g., North Field A" value={logisticsLocation} onChangeText={setLogisticsLocation} />
                  <View style={styles.rowInputs}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.label}>DATE</Text>
                      <View style={styles.iconInput}>
                        <TextInput style={styles.flexInput} placeholder="dd-mm-yyyy" value={date} onChangeText={setDate} />
                        <Icon name="calendar" size={18} color="#4B5563" />
                      </View>
                    </View>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.label}>TIME</Text>
                      <View style={styles.iconInput}>
                        <TextInput style={styles.flexInput} placeholder="--:--" value={time} onChangeText={setTime} />
                        <Icon name="clock" size={18} color="#4B5563" />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.modalFooterBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowNewModal(false)}>
                  <Text style={styles.cancelBtnText}>CANCEL</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleMakeRequest}>
                  <Text style={styles.submitBtnText}>SUBMIT REQUEST</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* DETAILS MODAL */}
      <Modal visible={!!selectedRequest} animationType="slide" transparent onRequestClose={() => setSelectedRequest(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>REQUEST DETAILS</Text>
              <TouchableOpacity onPress={() => setSelectedRequest(null)}>
                <Icon name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {selectedRequest && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailsTopCard}>
                   <View style={[
                     styles.iconBox, 
                     { 
                       backgroundColor: selectedRequest.type === 'fuel' ? '#FFFBEB' : '#F3E8FF',
                       borderColor: selectedRequest.type === 'fuel' ? '#FCD34D' : '#DDD6FE'
                     }
                   ]}>
                     <Icon 
                       name={selectedRequest.type === 'fuel' ? 'droplet' : 'package'} 
                       size={24} 
                       color={selectedRequest.type === 'fuel' ? '#F59E0B' : '#7C3AED'} 
                     />
                   </View>
                   <View style={{marginLeft: 12}}>
                     <Text style={styles.detailTitle}>{selectedRequest.title}</Text>
                     <Text style={styles.detailId}>{selectedRequest.reqId || `REQ-${selectedRequest.id}`}</Text>
                   </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>TYPE</Text>
                  <Text style={styles.detailValue}>{selectedRequest.type === 'fuel' ? 'Fuel' : 'Logistics'}</Text>
                </View>
                {selectedRequest.amount && (
                   <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>AMOUNT</Text>
                    <Text style={styles.detailValue}>{selectedRequest.amount}</Text>
                  </View>
                )}
                {selectedRequest.note && (
                   <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, {marginTop: 4}]}>NOTE</Text>
                    <Text style={[styles.detailValue, { flex: 1, textAlign: 'right', lineHeight: 20 }]}>
                      {selectedRequest.note}
                    </Text>
                  </View>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>LOCATION</Text>
                  <Text style={styles.detailValue}>{selectedRequest.location || 'Unknown'}</Text>
                </View>
                 <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>STATUS</Text>
                  <View style={styles.statusBadge}>
                     <Text style={styles.statusBadgeText}>{selectedRequest.status.toUpperCase()}</Text>
                  </View>
                </View>
                <View style={styles.modalActionRow}>
                  <TouchableOpacity style={styles.denyBtn} onPress={() => setSelectedRequest(null)}>
                     <Icon name="x-circle" size={18} color="#fff" style={{marginRight: 6}} />
                     <Text style={styles.actionBtnText}>CANCEL REQUEST</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingTop: 40 }, 
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  subHeader: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  newButton: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, elevation: 2 },
  newButtonText: { color: '#fff', fontWeight: '800', fontSize: 13, marginLeft: 6 },
  statusRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 24 },
  statusCard: { flex: 1, borderRadius: 12, padding: 12, marginRight: 10, borderWidth: 1 },
  cardPending: { backgroundColor: '#fff', borderColor: '#E5E7EB' },
  cardApproved: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  cardDone: { backgroundColor: '#ECFDF5', borderColor: '#6EE7B7', marginRight: 0 },
  statusLabel: { fontSize: 10, fontWeight: '700', color: '#6B7280', marginBottom: 4 },
  statusValue: { fontSize: 20, fontWeight: '800' },
  requestCard: { borderRadius: 16, borderWidth: 1, marginBottom: 16, padding: 16, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  leftContainer: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 8, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  reqTitle: { fontSize: 14, fontWeight: '900', color: '#111827', letterSpacing: 0.5 },
  reqId: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  fuelAmount: { fontSize: 16, fontWeight: '800', color: '#D97706', marginTop: 2 },
  logisticsBody: { marginTop: 12, paddingLeft: 2 },
  logisticsNote: { fontSize: 14, color: '#374151', lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  logisticsFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 500, maxHeight: '95%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  label: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  locationHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16, marginBottom: 8 },
  typeRow: { flexDirection: 'row' },
  typeBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  typeBtnFuel: { backgroundColor: '#fff', borderColor: '#E5E7EB' },
  typeBtnLogistics: { backgroundColor: '#F3E8FF', borderColor: '#DDD6FE' },
  typeBtnText: { marginLeft: 8, fontWeight: '700', color: '#9CA3AF' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 14, color: '#111827', backgroundColor: '#fff' },
  rowInputs: { flexDirection: 'row' },
  iconInput: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#fff' },
  flexInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#111827' },
  mapContainer: { height: 150, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#D1D5DB', marginTop: 4 },
  mapOverlayLabel: { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, flexDirection: 'row', alignItems: 'center' },
  mapOverlayText: { color: '#fff', fontSize: 10, fontWeight: '700', marginLeft: 4 },
  modalFooterBtns: { flexDirection: 'row', marginTop: 30, marginBottom: 20 },
  cancelBtn: { flex: 1, backgroundColor: '#E5E7EB', paddingVertical: 14, borderRadius: 8, marginRight: 8, alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', color: '#1F2937' },
  submitBtn: { flex: 1, backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 8, marginLeft: 8, alignItems: 'center' },
  submitBtnText: { fontWeight: '800', color: '#fff' },
  detailsTopCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#F3F4F6', padding: 16, borderRadius: 12, marginBottom: 24 },
  detailTitle: { fontSize: 16, fontWeight: '800', color: '#111827' },
  detailId: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  detailLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { fontSize: 14, color: '#1F2937', fontWeight: '600' },
  statusBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusBadgeText: { fontSize: 12, fontWeight: '800', color: '#4B5563' },
  modalActionRow: { flexDirection: 'row', marginTop: 24 },
  denyBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#DC2626', paddingVertical: 14, borderRadius: 8, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 }
});

export default RequestsScreen;