import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Modal 
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

// --- MOCK DATA ---
const vehicle = {
  id: 'TRC-2024-01',
  name: 'John Deere 8R Series Tractor',
  hours: '12,450',
  year: '2024',
  status: 'Active',
};

const documents = [
  { id: 1, title: 'REGISTRATION CERTIFICATE (RC)', type: 'RC', expire: '2027-03-15', status: 'VALID', color: '#ECFDF5', borderColor: '#D1FAE5', iconColor: '#059669' },
  { id: 2, title: 'POLLUTION UNDER CONTROL (PUC)', type: 'PUC', expire: '2026-04-20', status: 'EXPIRING SOON', color: '#FFFBEB', borderColor: '#FEF3C7', iconColor: '#D97706' },
  { id: 3, title: 'INSURANCE CERTIFICATE', type: 'Insurance', expire: '2026-12-31', status: 'VALID', color: '#ECFDF5', borderColor: '#D1FAE5', iconColor: '#059669' },
  { id: 4, title: 'FITNESS CERTIFICATE', type: 'Fitness', expire: '2026-12-31', status: 'VALID', color: '#ECFDF5', borderColor: '#D1FAE5', iconColor: '#059669' },
];

const maintenance = [
  { id: 1, title: 'OIL CHANGE', code: 'MNT-001', desc: 'Engine oil and filter replacement', date: '2026-01-20', cost: '₹2,500', status: 'COMPLETED', statusColor: '#10B981' },
  { id: 2, title: 'TIRE ROTATION', code: 'MNT-002', desc: 'All four tires rotated and balanced', date: '2026-01-15', cost: '₹1,200', status: 'COMPLETED', statusColor: '#10B981' },
  { id: 3, title: 'GENERAL SERVICE', code: 'MNT-003', desc: 'Scheduled 5000-hour service check', date: '-', cost: '-', status: 'SCHEDULED', statusColor: '#3B82F6' },
];

const fuelLogs = [
  { id: 1, title: 'FUEL REFILL', code: 'FUEL-001', date: '2026-01-26', odometer: '12450 hrs', location: 'North Field A', amount: '150L', cost: '₹13,500' },
  { id: 2, title: 'FUEL REFILL', code: 'FUEL-002', date: '2026-01-20', odometer: '12380 hrs', location: 'Main Depot', amount: '180L', cost: '₹15,000' },
];

const VehiclesScreen = () => {
  const [activeTab, setActiveTab] = useState('DOCUMENTS');
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  // Helper to render Status Tags
  const renderStatusTag = (status: string) => {
    let bg = '#ECFDF5';
    let text = '#059669';
    if (status === 'EXPIRING SOON') { bg = '#FFFBEB'; text = '#D97706'; }
    if (status === 'SCHEDULED') { bg = '#EFF6FF'; text = '#2563EB'; }
    
    return (
      <View style={[styles.statusTag, { backgroundColor: bg }]}>
        <Text style={[styles.statusTagText, { color: text }]}>{status}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>VEHICLE INFO</Text>
        <Text style={styles.subHeader}>FLEET MANAGEMENT</Text>
      </View>

      {/* VEHICLE INFO CARD */}
      <View style={styles.vehicleCard}>
        <View style={styles.vehicleHeader}>
          <View style={styles.vehicleIconCircle}>
            <Icon name="truck" size={24} color="#10B981" />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.vehicleId}>{vehicle.id}</Text>
            <Text style={styles.vehicleName}>{vehicle.name}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>HOURS</Text>
            <Text style={styles.statValue}>{vehicle.hours}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>YEAR</Text>
            <Text style={styles.statValue}>{vehicle.year}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>STATUS</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{vehicle.status}</Text>
          </View>
        </View>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
        {['DOCUMENTS', 'MAINTENANCE', 'FUEL LOGS'].map((tab) => (
          <TouchableOpacity 
            key={tab} 
            style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CONTENT SCROLL */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}>
        
        {/* === DOCUMENTS TAB === */}
        {activeTab === 'DOCUMENTS' && documents.map((doc) => (
          <TouchableOpacity 
            key={doc.id} 
            activeOpacity={0.8}
            onPress={() => setSelectedDoc(doc)}
            style={[styles.card, { backgroundColor: doc.color, borderColor: doc.borderColor }]}
          >
            {/* FIX: Centered alignItems and Flexbox for perfect alignment */}
            <View style={styles.cardHeader}>
              <View style={styles.leftHeaderContent}>
                <View style={[styles.smallIconBox, { backgroundColor: '#fff', borderColor: doc.borderColor }]}>
                  <Icon name="file-text" size={18} color={doc.iconColor} />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={styles.cardTitle}>{doc.title}</Text>
                  <Text style={styles.cardSub}>{doc.type}</Text>
                </View>
              </View>
              
              <View style={styles.rightIconContainer}>
                {doc.status === 'VALID' ? (
                   <Icon name="check-circle" size={20} color="#059669" />
                ) : (
                   <Icon name="alert-triangle" size={20} color="#D97706" />
                )}
              </View>
            </View>

            <View style={styles.divider} />
            
            <View style={styles.cardFooter}>
               <View style={styles.rowCenter}>
                 <Icon name="calendar" size={14} color="#6B7280" />
                 <Text style={styles.footerText}> Expires: {doc.expire}</Text>
               </View>
               <Text style={[styles.statusText, { color: doc.status === 'VALID' ? '#059669' : '#D97706' }]}>
                 {doc.status}
               </Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* === MAINTENANCE TAB === */}
        {activeTab === 'MAINTENANCE' && maintenance.map((item) => (
          <View key={item.id} style={styles.whiteCard}>
             <View style={styles.cardHeader}>
                <View style={styles.leftHeaderContent}>
                  <View style={[styles.smallIconBox, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }]}>
                    <Icon name="tool" size={18} color="#6B7280" />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.cardTitleDark}>{item.title}</Text>
                    <Text style={styles.cardSub}>{item.code}</Text>
                  </View>
                </View>
                {renderStatusTag(item.status)}
             </View>
             
             <Text style={styles.bodyText}>{item.desc}</Text>
             <View style={styles.divider} />

             <View style={styles.cardFooter}>
               <View style={styles.rowCenter}>
                 <Icon name="calendar" size={14} color="#6B7280" />
                 <Text style={styles.footerText}> {item.date}</Text>
               </View>
               <Text style={styles.costText}>{item.cost}</Text>
             </View>
          </View>
        ))}

        {/* === FUEL LOGS TAB === */}
        {activeTab === 'FUEL LOGS' && (
          <>
            <View style={styles.whiteCard}>
               <Text style={styles.label}>TOTAL FUEL COST (THIS MONTH)</Text>
               <Text style={styles.bigCost}>₹59,400</Text>
               <Text style={styles.cardSub}>660 liters consumed</Text>
            </View>

            {fuelLogs.map((log) => (
              <View key={log.id} style={styles.whiteCard}>
                 <View style={styles.cardHeader}>
                    <View style={styles.leftHeaderContent}>
                      <View style={[styles.smallIconBox, { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' }]}>
                        <Icon name="droplet" size={18} color="#D97706" />
                      </View>
                      <View style={{ marginLeft: 10 }}>
                        <Text style={styles.cardTitleDark}>{log.title}</Text>
                        <Text style={styles.cardSub}>{log.code}</Text>
                      </View>
                    </View>
                    <Text style={styles.highlightText}>{log.amount}</Text>
                 </View>
                 
                 <View style={styles.divider} />

                 <View style={styles.grid2Col}>
                    <View>
                      <Text style={styles.label}>DATE</Text>
                      <Text style={styles.valueDark}>{log.date}</Text>
                    </View>
                    <View>
                      <Text style={styles.label}>ODOMETER</Text>
                      <Text style={styles.valueDark}>{log.odometer}</Text>
                    </View>
                    <View style={{marginTop: 10}}>
                      <Text style={styles.label}>LOCATION</Text>
                      <Text style={styles.valueDark}>{log.location}</Text>
                    </View>
                    <View style={{marginTop: 10}}>
                      <Text style={styles.label}>COST</Text>
                      <Text style={[styles.valueDark, {color: '#D97706'}]}>{log.cost}</Text>
                    </View>
                 </View>
              </View>
            ))}
          </>
        )}

      </ScrollView>

      {/* === DOCUMENT DETAILS MODAL === */}
      <Modal visible={!!selectedDoc} animationType="fade" transparent onRequestClose={() => setSelectedDoc(null)}>
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>DOCUMENT DETAILS</Text>
                 <TouchableOpacity onPress={() => setSelectedDoc(null)}>
                   <Icon name="x" size={24} color="#6B7280" />
                 </TouchableOpacity>
               </View>

               {selectedDoc && (
                 <>
                   <View style={[styles.card, { backgroundColor: selectedDoc.color, borderColor: selectedDoc.borderColor, marginBottom: 20 }]}>
                      <View style={styles.rowCenter}>
                        <View style={[styles.smallIconBox, { backgroundColor: '#fff', borderColor: selectedDoc.borderColor }]}>
                          <Icon name="file-text" size={20} color={selectedDoc.iconColor} />
                        </View>
                        <View style={{ marginLeft: 12, flex: 1 }}>
                          <Text style={styles.cardTitle}>{selectedDoc.title}</Text>
                          <Text style={styles.cardSub}>{selectedDoc.type}</Text>
                        </View>
                      </View>
                   </View>

                   <View style={styles.detailRow}>
                     <Text style={styles.detailLabel}>DOCUMENT TYPE</Text>
                     <Text style={styles.detailValue}>{selectedDoc.type}</Text>
                   </View>
                   <View style={styles.detailRow}>
                     <Text style={styles.detailLabel}>EXPIRY DATE</Text>
                     <Text style={styles.detailValue}>{selectedDoc.expire}</Text>
                   </View>
                   <View style={styles.detailRow}>
                     <Text style={styles.detailLabel}>STATUS</Text>
                     {renderStatusTag(selectedDoc.status)}
                   </View>

                   <View style={styles.previewBox}>
                      <Icon name="file" size={40} color="#9CA3AF" />
                      <Text style={styles.previewText}>Document preview not available</Text>
                   </View>

                   <TouchableOpacity style={styles.fullViewBtn}>
                      <Icon name="eye" size={18} color="#fff" style={{marginRight: 8}} />
                      <Text style={styles.fullViewText}>VIEW FULL DOCUMENT</Text>
                   </TouchableOpacity>
                 </>
               )}
            </View>
         </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingTop: 40 },
  
  headerContainer: { paddingHorizontal: 20, marginBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111827' },
  subHeader: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 2 },

  vehicleCard: { marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, marginBottom: 20 },
  vehicleHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  vehicleIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  vehicleId: { fontSize: 18, fontWeight: '800', color: '#111827' },
  vehicleName: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 },
  statBox: { flex: 1 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '800', color: '#1F2937' },

  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 20 },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: 10, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, marginRight: 8, backgroundColor: '#fff' },
  activeTabButton: { backgroundColor: '#10B981', borderColor: '#10B981' },
  tabText: { fontSize: 12, fontWeight: '700', color: '#6B7280' },
  activeTabText: { color: '#fff' },

  // --- CARDS ---
  card: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 12 },
  whiteCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, elevation: 1 },
  
  // FIX: Flex row with center alignment for icons
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftHeaderContent: { flex: 1, flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  rightIconContainer: { alignItems: 'center', justifyContent: 'center' },
  
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  smallIconBox: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#111827' },
  cardTitleDark: { fontSize: 14, fontWeight: '800', color: '#111827' },
  cardSub: { fontSize: 11, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  statusText: { fontSize: 12, fontWeight: '800' },
  bodyText: { marginTop: 10, fontSize: 13, color: '#374151' },
  costText: { fontSize: 14, fontWeight: '800', color: '#D97706' },

  bigCost: { fontSize: 28, fontWeight: '800', color: '#F59E0B', marginVertical: 4 },
  highlightText: { fontSize: 16, fontWeight: '800', color: '#F59E0B' },
  grid2Col: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  label: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', marginBottom: 2, textTransform: 'uppercase' },
  valueDark: { fontSize: 13, fontWeight: '700', color: '#374151' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 16, fontWeight: '900', color: '#111827' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailLabel: { fontSize: 12, color: '#6B7280', fontWeight: '700' },
  detailValue: { fontSize: 14, color: '#1F2937', fontWeight: '600' },
  
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusTagText: { fontSize: 12, fontWeight: '800' },

  previewBox: { height: 150, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  previewText: { marginTop: 10, fontSize: 12, color: '#6B7280' },
  fullViewBtn: { flexDirection: 'row', backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  fullViewText: { color: '#fff', fontWeight: '800', fontSize: 14 }
});

export default VehiclesScreen;