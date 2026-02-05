import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  TextInput,
  Modal,
  Switch,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BASE_URL, getStaffId } from '../config/env';
import { useAuth } from '../contexts/AuthContext';
import notifee, { AndroidImportance } from '@notifee/react-native';

// --- Types ---
type Request = {
  id: string | number;
  type: 'fuel' | 'logistics';
  status: 'pending' | 'approved' | 'done';
  title: string;
  reqId?: string;
  requestId?: string; // backend request_id (present for Logistics Request items)
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
  // Separate incoming (server) and outgoing (local queued) requests
  const [incomingRequests, setIncomingRequests] = useState<Request[]>(initialRequests);
  // Outgoing requests: use dummy data for now (UI only). We'll connect real API/queue later.
  const [outgoingRequests, setOutgoingRequests] = useState<Request[]>([
    {
      id: 'out-1',
      type: 'fuel',
      status: 'pending',
      title: 'FUEL REQUEST',
      amount: '120L',
      location: 'West Field - Near Pump 3',
      colorBg: '#FFFBEB',
      borderColor: '#FDE68A',
    },
    {
      id: 'out-2',
      type: 'logistics',
      status: 'pending',
      title: 'SPARE PARTS REQUEST',
      reqId: 'LOCAL-001',
      note: 'Need oil filter and drive belt',
      location: 'East Barn',
      date: new Date().toISOString().split('T')[0],
      colorBg: '#F3E8FF',
      borderColor: '#E9D5FF',
    },
  ]);
  const [activeTab, setActiveTab] = useState<'incoming'|'outgoing'>('incoming');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const [cachedStaffId, setCachedStaffId] = useState<string>('');
  const staffIdRef = useRef<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);

  const updateRequestStatusDelivered = async (req: Request) => {
    // Only for incoming logistics requests
    const planId = String(req.reqId ?? '').trim();
    const requestId = String(req.requestId ?? '').trim();
    if (!planId || !requestId) {
      Alert.alert('Missing data', 'Unable to update status (missing plan_id/request_id).');
      return false;
    }

    const payload = {
      plan_id: planId,
      date: String(req.date ?? new Date().toISOString().split('T')[0]),
      activity: String(req.title ?? 'Logistics Request'),
      request_id: requestId,
    };

    try {
      const res = await fetch(`${BASE_URL}/admin_vehicles/update_request_status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.success === true) return true;
      console.log('update_request_status failed', res.status, data);
      return false;
    } catch (e) {
      console.log('update_request_status error', e);
      return false;
    }
  };

  const markDelivered = async (requestId: Request['id']) => {
    // find in incoming
    const req = incomingRequests.find((r) => String(r.id) === String(requestId));
    if (!req) return;

    // Only incoming logistics should hit API
    if (req.type === 'logistics') {
      setSyncing(true);
      const ok = await updateRequestStatusDelivered(req);
      setSyncing(false);

      if (!ok) {
        Alert.alert('Error', 'Unable to mark delivered. Please try again.');
        return;
      }
    }

    // update incoming UI (after API success)
    setIncomingRequests((prev) =>
      prev.map((r) =>
        String(r.id) === String(requestId)
          ? { ...r, status: 'done', colorBg: '#ECFDF5', borderColor: '#6EE7B7' }
          : r
      )
    );

    // NOTE: outgoing requests are not updated here (API is only for incoming)

    setSelectedRequest((prev) =>
      prev && String(prev.id) === String(requestId)
        ? { ...prev, status: 'done', colorBg: '#ECFDF5', borderColor: '#6EE7B7' }
        : prev
    );
  };

  // Stats reflect incoming requests (server-side)
  const stats = useMemo(() => {
    return {
      pending: incomingRequests.filter(r => r.status === 'pending').length,
      approved: incomingRequests.filter(r => r.status === 'approved').length,
      done: incomingRequests.filter(r => r.status === 'done').length,
    };
  }, [incomingRequests]);

  const normalizeStatus = (status: unknown): Request['status'] => {
    const s = String(status ?? '').trim().toLowerCase();
    if (s === 'approved') return 'approved';
    if (s === 'done' || s === 'completed' || s === 'complete') return 'done';
    return 'pending';
  };

  const isLogisticsRequestActivity = (activity: unknown) => {
    const a = String(activity ?? '').trim().toLowerCase();
    return a === 'logistics request' || a === 'logistics';
  };

  const parseLogisticsLocation = (farmId: unknown) => {
    const raw = String(farmId ?? '').trim();
    // Example: "Pickup -> Delivery"
    if (raw.includes('->')) {
      const parts = raw.split('->').map(p => p.trim()).filter(Boolean);
      return parts[parts.length - 1] || raw;
    }
    return raw;
  };

  const buildWebSocketUrl = (baseUrl: string, path: string) => {
    const trimmedBase = String(baseUrl ?? '').trim().replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const httpUrl = `${trimmedBase}${normalizedPath}`;
    if (httpUrl.startsWith('wss://') || httpUrl.startsWith('ws://')) return httpUrl;
    if (httpUrl.startsWith('https://')) return httpUrl.replace(/^https:\/\//, 'wss://');
    if (httpUrl.startsWith('http://')) return httpUrl.replace(/^http:\/\//, 'ws://');
    // Fallback: assume secure
    return `wss://${httpUrl.replace(/^\/+/, '')}`;
  };

  const upsertIncomingLogisticsRequest = (payload: any) => {
    const planId = String(payload?.plan_id ?? payload?.data?.plan_id ?? '');
    const data = payload?.data ?? payload;
    const entry = data?.plan_entry ?? {};
    const id = planId || `${data?.vehicle_id ?? ''}_${data?.date ?? ''}_${entry?.requested_location ?? ''}`;

    const newReq: Request = {
      id,
      type: 'logistics',
      status: normalizeStatus(entry?.status ?? data?.status),
      title: 'LOGISTICS REQUEST',
      reqId: planId || undefined,
      requestId: data?.request_id ? String(data.request_id) : undefined,
      note: [
        entry?.staff_name ? `Name: ${entry.staff_name}` : null,
        entry?.staff_contact ? `Contact: ${entry.staff_contact}` : null,
        entry?.request ? `Request: ${entry.request}` : null,
      ].filter(Boolean).join('\n') || (entry?.request ? String(entry.request) : undefined),
      location: parseLogisticsLocation(entry?.requested_location ?? data?.farm_id) || 'Unknown',
      date: data?.date ? String(data.date) : undefined,
      time: undefined,
      colorBg: '#FFFFFF',
      borderColor: '#E5E7EB',
    };

    setIncomingRequests((prev) => {
      const existingIndex = prev.findIndex((r) => String(r.id) === String(newReq.id));
      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = { ...copy[existingIndex], ...newReq };
        return copy;
      }
      return [newReq, ...prev];
    });
  };

  // Resolve staff id used for websocket filtering
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('STAFF_ID');
        if (isMounted && stored) setCachedStaffId(stored);
      } catch {
        // ignore
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    staffIdRef.current = String(user?.id || getStaffId() || cachedStaffId || '').trim();
  }, [user?.id, cachedStaffId]);

  const getResolvedStaffId = () => {
    return String(staffIdRef.current || user?.id || getStaffId() || cachedStaffId || '').trim();
  };

  useEffect(() => {
    const syncLogisticsFromTasksApi = async () => {
      const staffId = getResolvedStaffId();
      if (!staffId) return;

      setSyncing(true);
      try {
        const res = await fetch(`${BASE_URL}/admin_vehicles/get_all_task/${encodeURIComponent(staffId)}`);
        const data = await res.json();
        const pendingTasks: any[] = Array.isArray(data?.pending_tasks) ? data.pending_tasks : [];
        const logisticsPending = pendingTasks.filter((t: any) => isLogisticsRequestActivity(t?.activity));

        const mapped: Request[] = logisticsPending.map((t: any) => {
          const planId = String(t?.plan_id ?? '');
          return {
            id: planId || `${t?.vehicle_id ?? ''}_${t?.date ?? ''}_${t?.farm_id ?? ''}`,
            type: 'logistics',
            status: normalizeStatus(t?.status),
            title: 'LOGISTICS REQUEST',
            reqId: planId || undefined,
            requestId: t?.request_id ? String(t.request_id) : undefined,
            note: t?.farm_id ? String(t.farm_id) : undefined,
            location: parseLogisticsLocation(t?.farm_id) || 'Unknown',
            date: t?.date ? String(t.date) : undefined,
            time: undefined,
            colorBg: '#FFFFFF',
            borderColor: '#E5E7EB',
          };
        });

        // Merge without duplicates into incomingRequests (by id), but also update existing ones to ensure requestId/reqId are present
        setIncomingRequests((prev) => {
          const byId = new Map(prev.map((r) => [String(r.id), r] as const));
          for (const next of mapped) {
            const key = String(next.id);
            const existing = byId.get(key);
            byId.set(key, existing ? { ...existing, ...next } : next);
          }
          return Array.from(byId.values());
        });
      } catch (e) {
        console.log('Requests sync error:', e);
      } finally {
        setSyncing(false);
      }
    };

    syncLogisticsFromTasksApi();
  }, [user?.id, cachedStaffId]);

  // WebSocket: listen for logistics request events and show them in realtime
  useEffect(() => {
    // create notifee channel (safe to call repeatedly)
    (async () => {
      try {
        await notifee.createChannel({
          id: 'default',
          name: 'Default',
          vibration: true,
          importance: AndroidImportance.HIGH,
        });
      } catch (e) {
        console.log('notifee channel create error:', e);
      }
    })();

    const wsUrl = buildWebSocketUrl(BASE_URL, '/ws/logistics');

    const cleanupTimers = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const disconnect = () => {
      cleanupTimers();
      try {
        wsRef.current?.close();
      } catch {
        // ignore
      }
      wsRef.current = null;
    };

    const scheduleReconnect = () => {
      cleanupTimers();
      const attempt = reconnectAttemptRef.current;
      // exponential backoff: 0.5s, 1s, 2s, 4s ... max 15s
      const delay = Math.min(15000, 500 * Math.pow(2, attempt));
      reconnectAttemptRef.current = Math.min(attempt + 1, 10);
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, delay);
    };

    const onMessage = (event: WebSocketMessageEvent) => {
      try {
        console.log('[ws/logistics] message:', event.data);
        const msg = JSON.parse(String(event.data ?? '{}'));
        if (msg?.event !== 'LOGISTICS_REQUEST_CREATED') return;

        const incomingStaffId = String(msg?.data?.staff_id ?? '').trim();
        const currentStaffId = String(staffIdRef.current ?? '').trim();
        if (!incomingStaffId || !currentStaffId) return;
        if (incomingStaffId !== currentStaffId) return;

        // add request to list
        upsertIncomingLogisticsRequest(msg);
        // notify via notifee (native) with Alert fallback
        try {
          const planId = String(msg?.data?.plan_id ?? msg?.plan_id ?? msg?.data?.reqId ?? '').trim();
          const title = planId ? `New Logistics Request (${planId})` : 'New Logistics Request';
          const body = String(msg?.data?.plan_entry?.request ?? msg?.data?.request ?? msg?.data?.note ?? msg?.data?.farm_id ?? 'You have a new logistics request');

          // display native notification
          notifee.displayNotification({
            title,
            body,
            android: {
              channelId: 'default',
              smallIcon: 'ic_launcher',
              pressAction: { id: 'default' },
              importance: AndroidImportance.HIGH,
            },
          }).catch((err: unknown) => {
            console.log('notifee display error:', err);
            try { Alert.alert(title, body); } catch (e) { /* ignore */ }
          });
        } catch (e) {
          try { Alert.alert('New Logistics Request', 'You have a new logistics request'); } catch (er) { /* ignore */ }
        }
      } catch (e) {
        console.log('[ws/logistics] message parse error:', e);
        // ignore invalid payloads
      }
    };

    const connect = () => {
      // avoid duplicate connections
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectAttemptRef.current = 0;
        };

        ws.onmessage = onMessage;

        ws.onerror = () => {
          // Some platforms fire onerror before onclose.
        };

        ws.onclose = () => {
          // Reconnect only if user is logged in / staffId known
          const currentStaffId = String(staffIdRef.current ?? '').trim();
          if (!currentStaffId) return;
          scheduleReconnect();
        };
      } catch {
        scheduleReconnect();
      }
    };

    connect();

    return () => {
      disconnect();
    };
    // Intentionally do not depend on staffId; we filter messages instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Form State
  const [requestType, setRequestType] = useState<'fuel'|'logistics'>('fuel');
  const [note, setNote] = useState('');
  
  // Fuel State
  const [fuelAmount, setFuelAmount] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [manualLocation, setManualLocation] = useState('');
  
  // Logistics State
  const [logisticsLocation, setLogisticsLocation] = useState('');
  const [date, setDate] = useState('');
  // Date picker and location helper UI states
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [datePickerDate, setDatePickerDate] = useState<Date>(new Date());

  const openDatePicker = () => {
    try {
      setDatePickerDate(date ? new Date(date) : new Date());
    } catch (e) {
      setDatePickerDate(new Date());
    }
    setDatePickerVisible(true);
  };

  const confirmDatePicker = () => {
    setDate(datePickerDate.toISOString().split('T')[0]);
    setDatePickerVisible(false);
  };

  const adjustDate = (days: number) => {
    setDatePickerDate((prev) => new Date(prev.getTime() + days * 24 * 60 * 60 * 1000));
  };

  const handleUseCurrentLocation = () => {
    // quick placeholder while we attempt to fetch actual coords
    setLogisticsLocation('Current Location (GPS)');
    try {
      const geo = (globalThis as any).navigator?.geolocation ?? (globalThis as any).geolocation;
      if (geo && geo.getCurrentPosition) {
        geo.getCurrentPosition(
          (pos: any) => {
            const { latitude, longitude } = pos.coords || {};
            if (latitude != null && longitude != null) {
              setLogisticsLocation(`Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`);
            }
          },
          (err: any) => {
            console.log('geolocation error', err);
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
        );
      }
    } catch (e) {
      console.log('geolocation not available', e);
    }
  };

  const handleMakeRequest = async () => {
    const staffId = String(staffIdRef.current || getStaffId() || user?.id || '').trim();
    const payload = {
      staff_id: staffId,
      date: date || new Date().toISOString().split('T')[0],
      note: note || '',
      request_location: requestType === 'fuel' ? (useCurrentLocation ? 'Current Location (GPS)' : manualLocation) : logisticsLocation || '',
    };

    setSyncing(true);
    let createdReqId: string | undefined;
    try {
      const res = await fetch(`${BASE_URL}/admin_ops_requests/make_request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data: any = await res.json();
        // treat API success flag explicitly
        if (data?.success === true) {
          createdReqId = String(data?.plan_id ?? data?.id ?? data?.reqId ?? '').trim() || undefined;
          try { Alert.alert('Request submitted', 'Your request was submitted successfully.'); } catch (e) { /* ignore */ }
        } else {
          // Not successful according to API; log and fall back to local queued request
          console.log('make_request response indicates failure:', data);
        }
      } else {
        console.log('make_request failed status:', res.status);
      }
    } catch (e) {
      console.log('make_request error:', e);
    } finally {
      setSyncing(false);
    }

    // DO NOT add outgoing requests to the visible requests list.
    // Instead queue them locally so they can be synced later by a background job or manual sync.
    try {
      const raw = await AsyncStorage.getItem('OUTGOING_REQUEST_QUEUE');
      const queue: any[] = raw ? JSON.parse(raw) : [];
      queue.push({ id: Date.now(), payload, createdReqId, createdAt: new Date().toISOString() });
      await AsyncStorage.setItem('OUTGOING_REQUEST_QUEUE', JSON.stringify(queue));
    } catch (e) {
      console.log('failed to save outgoing request to queue:', e);
    }

    // Reset UI and close modal (do not show outgoing request in list)
    setShowNewModal(false);
    setFuelAmount('');
    setNote('');
    setManualLocation('');
    setLogisticsLocation('');
    setDate('');

    if (!createdReqId) {
      try { Alert.alert('Request queued', 'Offline/local request created. Will sync when available.'); } catch (e) { /* ignore */ }
    }
  };

  // Fetch outgoing requests from server for the cached staff id and map into UI state
  useEffect(() => {
    let cancelled = false;

    const loadOutgoing = async () => {
      const staffId = String(user?.id || getStaffId() || cachedStaffId || '').trim();
      if (!staffId) return;

      try {
        const res = await fetch(`${BASE_URL}/admin_ops_requests/get_outgoing_requests/${encodeURIComponent(staffId)}`);
        if (!res.ok) {
          console.log('failed to fetch outgoing requests, status:', res.status);
          return;
        }
        const data: any = await res.json();
        const obj = data?.outgoing_requests ?? {};
        const list: Request[] = Object.keys(obj).map((key) => {
          const d = obj[key] || {};
          return {
            id: key,
            type: 'logistics',
            status: normalizeStatus(d?.status ?? d?.Status ?? ''),
            title: 'LOGISTICS REQUEST',
            reqId: key,
            note: d?.request ? String(d.request) : undefined,
            location: d?.request_location || undefined,
            date: d?.date ? String(d.date) : undefined,
            colorBg: '#F3E8FF',
            borderColor: '#E9D5FF',
          };
        });

        if (!cancelled) setOutgoingRequests(list);
      } catch (e) {
        console.log('error loading outgoing requests:', e);
      }
    };

    loadOutgoing();

    return () => { cancelled = true; };
  }, [cachedStaffId, user?.id]);

  // Pull-to-refresh handler: re-run the logistics sync and outgoing load
  const onRefresh = async () => {
    setRefreshing(true);
    setSyncing(true);
    try {
      const staffId = getResolvedStaffId();
      if (!staffId) return;

      // Fetch tasks and merge logistics into incomingRequests
      try {
        const res = await fetch(`${BASE_URL}/admin_vehicles/get_all_task/${encodeURIComponent(staffId)}`);
        const data = await res.json();
        const pendingTasks: any[] = Array.isArray(data?.pending_tasks) ? data.pending_tasks : [];
        const logisticsPending = pendingTasks.filter((t: any) => isLogisticsRequestActivity(t?.activity));

        const mapped: Request[] = logisticsPending.map((t: any) => {
          const planId = String(t?.plan_id ?? '');
          return {
            id: planId || `${t?.vehicle_id ?? ''}_${t?.date ?? ''}_${t?.farm_id ?? ''}`,
            type: 'logistics',
            status: normalizeStatus(t?.status),
            title: 'LOGISTICS REQUEST',
            reqId: planId || undefined,
            requestId: t?.request_id ? String(t.request_id) : undefined,
            note: t?.farm_id ? String(t.farm_id) : undefined,
            location: parseLogisticsLocation(t?.farm_id) || 'Unknown',
            date: t?.date ? String(t.date) : undefined,
            time: undefined,
            colorBg: '#FFFFFF',
            borderColor: '#E5E7EB',
          };
        });

        // Merge + update existing so requestId isn't missing
        setIncomingRequests((prev) => {
          const byId = new Map(prev.map((r) => [String(r.id), r] as const));
          for (const next of mapped) {
            const key = String(next.id);
            const existing = byId.get(key);
            byId.set(key, existing ? { ...existing, ...next } : next);
          }
          return Array.from(byId.values());
        });
      } catch (e) {
        console.log('onRefresh: tasks fetch error', e);
      }

      // Reload outgoing requests from server
      try {
        const res2 = await fetch(`${BASE_URL}/admin_ops_requests/get_outgoing_requests/${encodeURIComponent(staffId)}`);
        if (res2.ok) {
          const data2: any = await res2.json();
          const obj = data2?.outgoing_requests ?? {};
          const list: Request[] = Object.keys(obj).map((key) => {
            const d = obj[key] || {};
            return {
              id: key,
              type: 'logistics',
              status: normalizeStatus(d?.status ?? d?.Status ?? ''),
              title: 'LOGISTICS REQUEST',
              reqId: key,
              note: d?.request ? String(d.request) : undefined,
              location: d?.request_location || undefined,
              date: d?.date ? String(d.date) : undefined,
              colorBg: '#F3E8FF',
              borderColor: '#E9D5FF',
            };
          });
          setOutgoingRequests(list);
        } else {
          console.log('onRefresh: failed to fetch outgoing requests, status:', res2.status);
        }
      } catch (e) {
        console.log('onRefresh: outgoing fetch error', e);
      }
    } finally {
      setSyncing(false);
      setRefreshing(false);
    }
  };

  // use wrapped function in UI
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

      {/* TAB SWITCHER */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'incoming' && styles.tabBtnActive]}
          onPress={() => setActiveTab('incoming')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'incoming' && styles.tabBtnTextActive]}>Incoming ({incomingRequests.length})</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'outgoing' && styles.tabBtnActive]}
          onPress={() => setActiveTab('outgoing')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'outgoing' && styles.tabBtnTextActive]}>Outgoing ({outgoingRequests.length})</Text>
        </TouchableOpacity>
      </View>

      {syncing && (
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#6B7280" />
            <Text style={{ marginLeft: 10, color: '#6B7280', fontWeight: '600' }}>
              Syncing logistics requests...
            </Text>
          </View>
        </View>
      )}

      {/* LIST */}
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3b82f6"]} tintColor="#3b82f6" />}
      >
        {/* detect duplicate keys at runtime and warn */}
        {(() => {
          const seen = new Set<string>();
          const dupes: string[] = [];
          const displayed = activeTab === 'incoming' ? incomingRequests : outgoingRequests;
          displayed.forEach((r) => {
            const k = `${String(r.id)}-${r.reqId ?? ''}-${r.type}`;
            if (seen.has(k)) dupes.push(k);
            seen.add(k);
          });
          if (dupes.length) {
            console.warn('[RequestsScreen] duplicate request keys detected:', dupes);
          }
          return displayed.map((req, idx) => {
            const iconStyle = getIconStyles(req.type);
            const statusIcon = getStatusIcon(req);
            const key = `${String(req.id)}-${req.reqId ?? ''}-${req.type}-${idx}`; // include index as a fallback to guarantee uniqueness

            return (
              <TouchableOpacity
                key={key}
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
                      <Text style={styles.footerText}>{req.date}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.cardActionsRow}>
                  {activeTab === 'outgoing' ? (
                    <View style={[styles.outgoingStatus, req.status === 'pending' ? { backgroundColor: '#FEF3C7' } : req.status === 'approved' ? { backgroundColor: '#EFF6FF' } : { backgroundColor: '#ECFDF5' }]}>
                      <Text style={[styles.outgoingStatusText, req.status === 'pending' ? { color: '#92400E' } : req.status === 'approved' ? { color: '#1E40AF' } : { color: '#065F46' }]}>{req.status.toUpperCase()}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      activeOpacity={0.85}
                      onPress={() => markDelivered(req.id)}
                      disabled={req.status === 'done'}
                      style={[styles.deliveredBtn, req.status === 'done' && styles.deliveredBtnDisabled]}
                    >
                      <Icon name="check-circle" size={16} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.deliveredBtnText}>
                        {req.status === 'done' ? 'DELIVERED' : 'MARK DELIVERED'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            );
          });
        })()}
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
                  <Text style={[styles.typeBtnText, requestType === 'logistics' && {color:'#7C3AED'}]}>OTHERS</Text>
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
                   <Text style={styles.label}>NOTE</Text>
                   <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Details..." multiline value={note} onChangeText={setNote} />
                   <Text style={styles.label}>LOCATION</Text>
                   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                     <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="e.g., North Field A" value={logisticsLocation} onChangeText={setLogisticsLocation} />
                     <TouchableOpacity style={styles.useLocationBtn} onPress={handleUseCurrentLocation}>
                       <Icon name="crosshair" size={16} color="#fff" />
                     </TouchableOpacity>
                   </View>

                   <View style={styles.rowInputs}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>DATE</Text>
                      <View style={styles.iconInput}>
                        <TextInput style={styles.flexInput} placeholder="yyyy-mm-dd" value={date} onChangeText={setDate} />
                        <TouchableOpacity onPress={openDatePicker} style={{ paddingLeft: 8 }}>
                          <Icon name="calendar" size={18} color="#4B5563" />
                        </TouchableOpacity>
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
                  <TouchableOpacity
                    style={[styles.deliveredBtnModal, selectedRequest.status === 'done' && styles.deliveredBtnDisabled]}
                    onPress={() => markDelivered(selectedRequest.id)}
                    disabled={selectedRequest.status === 'done'}
                  >
                    <Icon name="check-circle" size={18} color="#fff" style={{marginRight: 6}} />
                    <Text style={styles.actionBtnText}>
                      {selectedRequest.status === 'done' ? 'DELIVERED' : 'MARK DELIVERED'}
                    </Text>
                  </TouchableOpacity>
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

      {/* Simple Date Picker Modal */}
      <Modal visible={datePickerVisible} animationType="slide" transparent onRequestClose={() => setDatePickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: 260, padding: 16 }]}>
            <Text style={{ fontSize: 16, fontWeight: '800', marginBottom: 12 }}>Select Date</Text>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>{datePickerDate.toISOString().split('T')[0]}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <TouchableOpacity style={[styles.cancelBtn, { flex: 0.3 }]} onPress={() => adjustDate(-1)}>
                <Text style={styles.cancelBtnText}>Prev</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { flex: 0.3 }]} onPress={() => setDatePickerDate(new Date())}>
                <Text style={styles.cancelBtnText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelBtn, { flex: 0.3 }]} onPress={() => adjustDate(1)}>
                <Text style={styles.cancelBtnText}>Next</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
              <TouchableOpacity style={[styles.cancelBtn, { marginRight: 8 }]} onPress={() => setDatePickerVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={confirmDatePicker}>
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
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
  cardActionsRow: { flexDirection: 'row', marginTop: 14 },
  deliveredBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#16A34A', paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  deliveredBtnModal: { flex: 1, flexDirection: 'row', backgroundColor: '#16A34A', paddingVertical: 14, borderRadius: 8, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  deliveredBtnDisabled: { opacity: 0.55 },
  deliveredBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 0.4 },
  denyBtn: { flex: 1, flexDirection: 'row', backgroundColor: '#DC2626', paddingVertical: 14, borderRadius: 8, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', marginRight: 8 },
  tabBtnActive: { backgroundColor: '#111827', borderColor: '#111827' },
  tabBtnText: { fontWeight: '800', color: '#6B7280' },
  tabBtnTextActive: { color: '#fff' },
  outgoingStatus: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, alignSelf: 'flex-start' },
  outgoingStatusText: { fontWeight: '800' },
  useLocationBtn: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});

export default RequestsScreen;