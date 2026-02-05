import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { BASE_URL, getStaffId } from '../config/env';
import FeatherIcon from 'react-native-vector-icons/Feather';

const Icon = FeatherIcon;

// --- Types ---
type Task = {
  id: number;
  title: string;
  status: string;
  priority: string;
  location: string;
  fieldId: string;
  time: string;
  vehicle: string;
  icon: string;
  coords: [number, number];
  details: string;
};

// --- API Task Fetching ---
const normalizeCoords = (value: any): [number, number] => {
  // Accept: [lat, lng], { latitude, longitude }, { lat, lng }, "lat,lng"
  if (Array.isArray(value) && value.length >= 2) {
    const lat = Number(value[0]);
    const lng = Number(value[1]);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : [0, 0];
  }

  if (value && typeof value === 'object') {
    const lat = Number((value.latitude ?? value.lat) as any);
    const lng = Number((value.longitude ?? value.lng) as any);
    return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : [0, 0];
  }

  if (typeof value === 'string' && value.includes(',')) {
    const [a, b] = value.split(',').map((x) => Number(x.trim()));
    return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : [0, 0];
  }

  return [0, 0];
};

const mapApiTaskToUiTask = (apiTask: any, idx: number): Task => ({
  id: idx + 1,
  title: apiTask.activity || 'Task',
  status: apiTask.status || 'pending',
  priority: 'high', // You can map this if available
  location: apiTask.farm_id || 'Unknown',
  fieldId: apiTask.plan_id || '',
  time: apiTask.date || '',
  vehicle: apiTask.vehicle_number || '',
  icon: 'truck', // Default icon, change based on activity if needed
  coords: normalizeCoords(apiTask.farm_coordinates),
  details: apiTask.activity || '',
});

const extractApiTasksArray = (data: any): any[] => {
  if (!data || typeof data !== 'object') return [];
  // Common shapes we may get back from backend
  const candidates = [
    data.pending_tasks,
    data.tasks,
    data.all_tasks,
    data.data,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
};

const isPendingStatus = (status: unknown) => {
  const s = String(status ?? '').trim().toLowerCase();
  // include a couple of variants seen in APIs
  return s === 'pending' || s === 'new' || s === 'open';
};

const isLogisticsRequestActivity = (activity: unknown) => {
  const a = String(activity ?? '').trim().toLowerCase();
  return a === 'logistics request' || a === 'logistics';
};

const TasksScreen = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalTask, setModalTask] = useState<Task | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const mapRef = React.useRef<MapView | null>(null);

  const hasValidCoords = (coords: [number, number] | undefined | null) => {
    if (!coords || coords.length < 2) return false;
    const lat = Number(coords[0]);
    const lng = Number(coords[1]);
    return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
  };

  const openDirections = async (task: Task) => {
    if (!hasValidCoords(task.coords)) {
      Alert.alert('No location', 'No coordinates available for this land.');
      return;
    }

    const [lat, lng] = task.coords;
    const url = Platform.OS === 'ios'
      ? `http://maps.apple.com/?daddr=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

    try {
      const can = await Linking.canOpenURL(url);
      if (!can) {
        await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      console.log('openDirections error', e);
      Alert.alert('Error', 'Unable to open maps on this device.');
    }
  };

  const getMapPoints = () => {
    const points: Array<{ latitude: number; longitude: number }> = [];
    if (userLocation) points.push(userLocation);
    for (const t of tasks) {
      if (hasValidCoords(t.coords)) points.push({ latitude: t.coords[0], longitude: t.coords[1] });
    }
    return points;
  };

  const fitMapToPoints = () => {
    const points = getMapPoints();
    if (!mapRef.current || points.length === 0) return;

    // If we only have the user location, just center there.
    if (points.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: points[0].latitude,
          longitude: points[0].longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        },
        350
      );
      return;
    }

    mapRef.current.fitToCoordinates(points, {
      edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
      animated: true,
    });
  };

  // After tasks or user location changes, re-fit map.
  useEffect(() => {
    fitMapToPoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, userLocation]);

  // --- Location Effect with TypeScript Fix ---
  useEffect(() => {
    // FIX: Cast globalThis to 'any' to bypass the missing Navigator type definition in React Native
    const nav = (globalThis as any).navigator;

    if (nav && nav.geolocation) {
      nav.geolocation.getCurrentPosition(
        (position: any) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (_error: any) => {
          console.log('Location error:', _error);
          setUserLocation(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }
  }, []);

  // --- Data Fetching (reusable) ---
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const staffId = getStaffId();
      if (!staffId) {
        setTasks([]);
        Alert.alert('Missing Staff ID', 'Please login again and retry.');
        return;
      }

      const res = await fetch(`${BASE_URL}/admin_vehicles/get_all_task/${encodeURIComponent(staffId)}`);
      const data = await res.json();

      // Show ALL pending tasks (no client-side date filtering)
      let pendingApiTasks: any[] = [];
      if (Array.isArray(data?.pending_tasks)) {
        // Backend already scoped to pending; don't over-filter.
        pendingApiTasks = data.pending_tasks;
      } else {
        const raw = extractApiTasksArray(data);
        pendingApiTasks = raw.filter((t: any) => isPendingStatus(t?.status));
      }

      // Move "Logistics Request" into Requests tab instead of Tasks tab.
      const taskApiTasks = pendingApiTasks.filter((t: any) => !isLogisticsRequestActivity(t?.activity));
      setTasks(taskApiTasks.map(mapApiTaskToUiTask));
    } catch (e) {
      console.error('Fetch error:', e);
      setTasks([]);
      Alert.alert('Error', 'Unable to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchTasks();
    } finally {
      setRefreshing(false);
    }
  };

  // Complete task: call backend then mark local task as done on success
  const handleCompleteTask = async (task: Task) => {
    const payload = {
      plan_id: String(task.fieldId ?? ''),
      date: String(task.time ?? ''),
      activity: String(task.title ?? task.details ?? ''),
      farm_id: String(task.location ?? ''),
      status: 'completed',
    };

    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/admin_vehicles/update_task_status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success === true) {
        // mark task done locally
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: 'done' } : t)));
        setModalTask(null);
        try { Alert.alert('Success', 'Task marked completed.'); } catch (e) { /* ignore */ }
      } else {
        console.log('update_task_status failed', res.status, data);
        Alert.alert('Error', 'Unable to complete task.');
      }
    } catch (e) {
      console.log('update_task_status error', e);
      Alert.alert('Error', 'Network error completing task.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for colors
  const getStatusColor = (status: string) => status === 'in progress' ? '#3b82f6' : '#6b7280';
  
  const getPriorityColor = (priority: string) => {
    switch(priority.toLowerCase()) {
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
          <Text style={styles.headerDate}>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{marginTop: 40}} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3b82f6"]} tintColor="#3b82f6" />}
        >
          <Text style={styles.subHeader}>PENDING TASKS</Text>

          {/* MAP SECTION */}
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => setMapExpanded(true)}
            style={[styles.mapContainer, mapExpanded && styles.mapContainerExpanded]}
          >
            <View style={styles.mapHeaderOverlay} pointerEvents="box-none">
              <Text style={styles.mapLabel}>FARM OVERVIEW</Text>
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#3b82f6'}]}/><Text style={styles.legendText}>Active</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#9ca3af'}]}/><Text style={styles.legendText}>Pending</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor:'#10b981'}]}/><Text style={styles.legendText}>Done</Text></View>
              </View>
            </View>
            
            <MapView
              ref={(r) => { mapRef.current = r; }}
              provider={PROVIDER_GOOGLE}
              style={{ flex: 1, minHeight: mapExpanded ? 400 : 180 }}
              showsUserLocation={!!userLocation}
              initialRegion={userLocation ? {
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              } : {
                latitude: 22.57297759381728,
                longitude: 78.96195888519289,
                latitudeDelta: 10,
                longitudeDelta: 10,
              }}
              onMapReady={fitMapToPoints}
            >
              {userLocation && (
                <Marker
                  coordinate={userLocation}
                  title="You are here"
                  pinColor="#2563eb"
                />
              )}
              {tasks.map((task, idx) => (
                task.coords && task.coords.length === 2 && task.coords[0] !== 0 ? (
                  <Marker
                    key={idx}
                    coordinate={{ latitude: task.coords[0], longitude: task.coords[1] }}
                    title={task.title}
                    description={task.location}
                    pinColor={task.status === 'in progress' ? '#3b82f6' : (task.status === 'done' ? '#10b981' : '#9ca3af')}
                  />
                ) : null
              ))}
            </MapView>
            
            {mapExpanded && (
              <TouchableOpacity
                style={{ position: 'absolute', top: 10, right: 10, backgroundColor: '#fff', borderRadius: 20, padding: 8, zIndex: 20 }}
                onPress={() => setMapExpanded(false)}
              >
                <FeatherIcon name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* TASK LIST */}
          {tasks.length === 0 && (
            <Text style={{textAlign:'center', color:'#6B7280', marginTop: 24}}>No pending tasks found.</Text>
          )}
          
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
                  task.status === 'in progress' ? { backgroundColor: '#dbeafe' } : task.status === 'done' ? { backgroundColor: '#ECFDF5' } : { backgroundColor: '#f3f4f6' }
                ]}>
                  {task.status === 'done' ? (
                    <Icon name="check-circle" size={24} color="#059669" />
                  ) : (
                    <Icon 
                      name={task.icon} 
                      size={24} 
                      color={task.status === 'in progress' ? '#2563eb' : '#4b5563'} 
                    />
                  )}
                </View>

                <View style={styles.titleContainer}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.status === 'done' && <View style={styles.doneDot} />}
                  </View>
                  <Text style={styles.taskSubLoc}>
                    <FeatherIcon name="map-pin" size={10} /> {task.location} • {task.fieldId}
                  </Text>
                </View>

                <View style={styles.rightHeader}>
                  {/* Directions */}
                  <TouchableOpacity
                    onPress={() => openDirections(task)}
                    activeOpacity={0.8}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={[styles.directionsBtn, !hasValidCoords(task.coords) && styles.directionsBtnDisabled]}
                  >
                    <FeatherIcon name="navigation" size={18} color={hasValidCoords(task.coords) ? '#10b981' : '#9ca3af'} />
                  </TouchableOpacity>

                  <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
                  <FeatherIcon name="chevron-right" size={20} color="#9ca3af" />
                </View>
              </View>
              
              <View style={styles.divider} />
              
              {/* Bottom Row: Status, Time, Vehicle */}
              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  {task.status === 'in progress' ? (
                    <Icon name="clock" size={14} color="#3b82f6" style={{marginRight:4}} />
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
      )}

      {/* CUSTOM DETAILS MODAL */}
      <Modal
        visible={!!modalTask}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalTask(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>TASK DETAILS</Text>
              <TouchableOpacity onPress={() => setModalTask(null)}>
                <FeatherIcon name="x" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {modalTask && (
              <>
                <View style={styles.modalTopCard}>
                  <View style={styles.modalIconBox}>
                    <Icon name={modalTask.icon} size={24} color="#1e3a8a" />
                  </View>
                  <View style={{marginLeft: 12}}>
                    <Text style={styles.modalTaskTitle}>{modalTask.title}</Text>
                    <Text style={styles.modalTaskId}>TSK-00{modalTask.id}</Text>
                  </View>
                </View>

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

                <View style={styles.instructionBox}>
                  <Text style={styles.detailLabel}>INSTRUCTIONS</Text>
                  <Text style={styles.instructionText}>{modalTask.details}</Text>
                </View>

                <TouchableOpacity style={styles.completeButton} onPress={() => modalTask && handleCompleteTask(modalTask)}>
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
  mapContainerExpanded: { height: 400, zIndex: 100, position: 'absolute', top: 60, left: 0, right: 0, marginHorizontal: 0, marginBottom: 0, borderRadius: 0 },
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
  directionsBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  directionsBtnDisabled: { opacity: 0.7 },
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
  doneDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981', marginLeft: 8 },
});

export default TasksScreen;