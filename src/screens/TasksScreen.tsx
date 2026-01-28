import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  Platform,
  Dimensions
} from 'react-native';
import { WebView } from 'react-native-webview';
import FeatherIcon from 'react-native-vector-icons/Feather';
const Icon = FeatherIcon;

// --- Types & Data ---

const tasks = [
  { 
    id: 1, 
    title: 'FIELD PLOWING - NORTH SECTION', 
    status: 'in progress', 
    priority: 'high', 
    location: 'North Field A', 
    fieldId: 'FLD-A01', 
    time: '08:00 - 12:00', 
    vehicle: 'TRC-2024-01', 
    icon: 'tractor', 
    coords: [28.61, 77.20],
    details: 'Deep plowing required, 25cm depth.' 
  },
  { 
    id: 2, 
    title: 'WHEAT HARVESTING', 
    status: 'pending', 
    priority: 'high', 
    location: 'East Field B', 
    fieldId: 'FLD-B03', 
    time: '13:00 - 17:00', 
    vehicle: 'HRV-2024-02', 
    icon: 'barley', // Wheat icon equivalent
    coords: [28.62, 77.21],
    details: 'Harvest wheat in field B03. Ensure moisture check.' 
  },
  { 
    id: 3, 
    title: 'TRANSPORT TO STORAGE', 
    status: 'pending', 
    priority: 'medium', 
    location: 'Main Warehouse', 
    fieldId: 'WHS-001', 
    time: '17:30 - 18:30', 
    vehicle: 'TIP-2024-03', 
    icon: 'package-variant-closed', 
    coords: [28.615, 77.22],
    details: 'Transport harvested wheat to warehouse WHS-001.' 
  },
];

// --- Leaflet Map HTML ---
const getLeafletHtml = (taskList: typeof tasks) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { margin: 0; padding: 0; }
    #map { width: 100%; height: 100vh; background-color: #f3f4f6; }
    .custom-icon { border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([28.615, 77.21], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    var tasks = ${JSON.stringify(taskList)};
    
    tasks.forEach(function(t) {
      var color = t.status === 'in progress' ? '#3b82f6' : (t.status === 'done' ? '#10b981' : '#9ca3af');
      var circle = L.circleMarker(t.coords, {
        color: 'white',
        fillColor: color,
        fillOpacity: 1,
        radius: 8,
        weight: 2
      }).addTo(map);
    });
  </script>
</body>
</html>
`;

const TasksScreen = () => {
  const [modalTask, setModalTask] = useState<typeof tasks[0] | null>(null);

  // Helper for colors
  const getStatusColor = (status: string) => status === 'in progress' ? '#3b82f6' : '#6b7280';
  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return '#ef4444'; // Red
      case 'medium': return '#f59e0b'; // Orange
      case 'low': return '#10b981'; // Green
      default: return '#9ca3af';
    }
  };

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>TASK MANAGER</Text>
        <View>
          <Text style={styles.headerLabel}>DATE</Text>
          <Text style={styles.headerDate}>Jan 26, 2026</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.subHeader}>TODAY'S SCHEDULE</Text>

        {/* MAP SECTION (Leaflet) */}
        <View style={styles.mapContainer}>
          <View style={styles.mapHeaderOverlay}>
             <Text style={styles.mapLabel}>FARM OVERVIEW</Text>
             <View style={styles.legendContainer}>
               <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#3b82f6'}]}/><Text style={styles.legendText}>Active</Text></View>
               <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#9ca3af'}]}/><Text style={styles.legendText}>Pending</Text></View>
               <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#10b981'}]}/><Text style={styles.legendText}>Done</Text></View>
             </View>
          </View>
          <WebView
            originWhitelist={['*']}
            source={{ html: getLeafletHtml(tasks) }}
            style={{ flex: 1 }}
            scrollEnabled={false}
          />
        </View>

        {/* TASK LIST */}
        {tasks.map((task) => (
          <TouchableOpacity 
            key={task.id} 
            activeOpacity={0.9}
            style={[
              styles.taskCard, 
              task.status === 'in progress' && styles.activeTaskCard
            ]} 
            onPress={() => setModalTask(task)}
          >
            {/* Top Row: Icon + Title + Priority */}
            <View style={styles.cardHeader}>
              <View style={[
                styles.iconBox, 
                task.status === 'in progress' ? { backgroundColor: '#dbeafe' } : { backgroundColor: '#f3f4f6' }
              ]}>
                <Icon 
                  name={task.icon} 
                  size={24} 
                  color={task.status === 'in progress' ? '#2563eb' : '#4b5563'} 
                />
              </View>
              
              <View style={styles.titleContainer}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskSubLoc}>
                   <FeatherIcon name="map-pin" size={10} /> {task.location} • {task.fieldId}
                </Text>
              </View>

              <View style={styles.rightHeader}>
                <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                <FeatherIcon name="chevron-right" size={20} color="#9ca3af" />
              </View>
            </View>

            <View style={styles.divider} />

            {/* Bottom Row: Status, Time, Vehicle */}
            <View style={styles.cardFooter}>
              <View style={styles.footerItem}>
                {task.status === 'in progress' ? (
                   <Icon name="progress-clock" size={14} color="#3b82f6" style={{marginRight:4}} />
                ) : (
                   <FeatherIcon name="circle" size={14} color="#9ca3af" style={{marginRight:4}} />
                )}
                <Text style={[styles.footerText, { color: getStatusColor(task.status), fontWeight: '700', textTransform: 'uppercase' }]}>
                  {task.status}
                </Text>
              </View>

              <View style={styles.footerItem}>
                <FeatherIcon name="clock" size={14} color="#6b7280" style={{marginRight:4}} />
                <Text style={styles.footerText}>{task.time}</Text>
              </View>

              <Text style={[styles.footerText, { marginLeft: 'auto', fontWeight: '500' }]}>
                {task.vehicle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CUSTOM DETAILS MODAL */}
      <Modal
        visible={!!modalTask}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalTask(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>TASK DETAILS</Text>
              <TouchableOpacity onPress={() => setModalTask(null)}>
                <FeatherIcon name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {modalTask && (
              <>
                {/* Header Card inside Modal */}
                <View style={styles.modalTopCard}>
                  <View style={styles.modalIconBox}>
                    <Icon name={modalTask.icon} size={24} color="#1e3a8a" />
                  </View>
                  <View style={{marginLeft: 12}}>
                    <Text style={styles.modalTaskTitle}>{modalTask.title}</Text>
                    <Text style={styles.modalTaskId}>TSK-00{modalTask.id}</Text>
                  </View>
                </View>

                {/* Details List */}
                <View style={styles.detailRow}>
                   <Text style={styles.detailLabel}>LOCATION</Text>
                   <Text style={styles.detailValue}>{modalTask.location}</Text>
                </View>
                <View style={styles.detailRow}>
                   <Text style={styles.detailLabel}>FIELD ID</Text>
                   <Text style={styles.detailValue}>{modalTask.fieldId}</Text>
                </View>
                <View style={styles.detailRow}>
                   <Text style={styles.detailLabel}>TIME</Text>
                   <Text style={styles.detailValue}>{modalTask.time}</Text>
                </View>
                <View style={styles.detailRow}>
                   <Text style={styles.detailLabel}>VEHICLE</Text>
                   <Text style={styles.detailValue}>{modalTask.vehicle}</Text>
                </View>
                <View style={styles.detailRow}>
                   <Text style={styles.detailLabel}>STATUS</Text>
                   <View style={[styles.statusBadge, { backgroundColor: modalTask.status === 'in progress' ? '#dbeafe' : '#f3f4f6' }]}>
                      <Text style={[styles.statusBadgeText, { color: modalTask.status === 'in progress' ? '#2563eb' : '#4b5563' }]}>
                        {modalTask.status.toUpperCase()}
                      </Text>
                   </View>
                </View>
                <View style={styles.detailRow}>
                   <Text style={styles.detailLabel}>PRIORITY</Text>
                   <View style={{flexDirection:'row', alignItems:'center'}}>
                      <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(modalTask.priority), marginRight: 6 }]} />
                      <Text style={styles.detailValue}>{modalTask.priority.charAt(0).toUpperCase() + modalTask.priority.slice(1)}</Text>
                   </View>
                </View>

                {/* Instructions */}
                <View style={styles.instructionBox}>
                  <Text style={styles.detailLabel}>INSTRUCTIONS</Text>
                  <Text style={styles.instructionText}>{modalTask.details}</Text>
                </View>

                {/* Action Button */}
                <TouchableOpacity style={styles.completeButton} onPress={() => setModalTask(null)}>
                  <Text style={styles.completeButtonText}>COMPLETE TASK</Text>
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
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingTop: 40 }, // Light gray bg
  
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 24, marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#111827', letterSpacing: 0.5 },
  headerLabel: { fontSize: 10, color: '#9CA3AF', textAlign: 'right', fontWeight: '700' },
  headerDate: { fontSize: 14, color: '#4B5563', fontWeight: '700' },
  subHeader: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginHorizontal: 24, marginBottom: 12, letterSpacing: 0.5 },

  // Map
  mapContainer: { height: 180, marginHorizontal: 20, marginBottom: 20, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  mapHeaderOverlay: { 
    position: 'absolute', top: 12, left: 12, right: 12, zIndex: 10, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 
  },
  mapLabel: { fontSize: 10, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' },
  legendContainer: { flexDirection: 'row' },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  legendText: { fontSize: 10, color: '#374151', fontWeight: '600' },

  // Task Cards
  taskCard: { 
    backgroundColor: '#fff', 
    borderRadius: 16, 
    marginHorizontal: 20, 
    marginBottom: 16, 
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4
  },
  activeTaskCard: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }, // Light blue for active
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  titleContainer: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '800', color: '#1F2937', marginBottom: 2 },
  taskSubLoc: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  rightHeader: { alignItems: 'flex-end', justifyContent: 'space-between', height: 36 },
  priorityDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 8 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 12 },
  
  // Footer inside Card
  cardFooter: { flexDirection: 'row', alignItems: 'center' },
  footerItem: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  footerText: { fontSize: 12, color: '#4B5563', fontWeight: '600' },

  // Modal Styling
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }, 
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, minHeight: '60%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  
  modalTopCard: { 
    flexDirection: 'row', alignItems: 'center', 
    backgroundColor: '#eff6ff', borderRadius: 12, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#dbeafe'
  },
  modalIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#dbeafe', justifyContent: 'center', alignItems: 'center' },
  modalTaskTitle: { fontSize: 15, fontWeight: '700', color: '#1e3a8a' },
  modalTaskId: { fontSize: 12, color: '#60a5fa', fontWeight: '600', marginTop: 2 },

  // Detail Rows
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '700' },
  detailValue: { fontSize: 14, color: '#1F2937', fontWeight: '700' },
  
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },

  instructionBox: { marginTop: 10, backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, marginBottom: 24 },
  instructionText: { marginTop: 6, fontSize: 14, color: '#4B5563', lineHeight: 20 },

  completeButton: { backgroundColor: '#22c55e', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  completeButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

export default TasksScreen;