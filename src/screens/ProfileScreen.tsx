import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image 
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- MOCK DATA ---
const userProfile = {
  name: 'RAJESH KUMAR',
  id: 'DRV-2024-001',
  role: 'SENIOR TRACTOR OPERATOR',
  experience: '12 years',
  joined: '01 Mar 2020',
  phone: '+91 98765 43210',
  email: 'rajesh.kumar@farmcompany.com',
  address: 'Village Kashipur, Tehsil Loni, District Ghaziabad, UP - 201102',
  dob: '1985-05-15',
  license: {
    number: 'DL-0420200012345',
    validUntil: '2028-07-09',
    type: 'Heavy Vehicle License'
  }
};

const certifications = [
  { id: 1, title: 'Advanced Tractor Operations', issuer: 'National Farming Institute', issued: '2021-06-15', expires: '2026-06-15' },
  { id: 2, title: 'Safety & Equipment Handling', issuer: 'Farm Safety Council', issued: '2020-11-20', expires: null },
  { id: 3, title: 'Harvester Operations Certified', issuer: 'Agricultural Equipment Board', issued: '2022-03-10', expires: '2027-03-10' },
];

const performance = {
  tasks: 342,
  hours: '2,845',
  rating: 4.8,
  safety: '98%'
};

const payslips = [
  { id: 1, month: 'January 2023', status: 'paid', salary: '33000', date: '2023-01-15' },
  { id: 2, month: 'February 2023', status: 'paid', salary: '33000', date: '2023-02-15' },
];

const ProfileScreen = () => {
  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>DRIVER PROFILE</Text>
          <Text style={styles.subHeader}>PERSONAL INFORMATION</Text>
        </View>
        <TouchableOpacity style={styles.themeBtn}>
          <Icon name="moon" size={18} color="#D97706" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        
        {/* AVATAR SECTION */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View>
              <View style={styles.avatarCircle}>
                <Icon name="user" size={40} color="#fff" />
                <View style={styles.cameraBtn}>
                  <Icon name="camera" size={12} color="#6B7280" />
                </View>
              </View>
            </View>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={styles.userName}>{userProfile.name}</Text>
              <Text style={styles.userId}>{userProfile.id}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{userProfile.role}</Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>EXPERIENCE</Text>
              <Text style={styles.statValue}>{userProfile.experience}</Text>
            </View>
            <View style={[styles.statBox, { marginLeft: 12 }]}>
              <Text style={styles.statLabel}>JOINED</Text>
              <Text style={styles.statValue}>{userProfile.joined}</Text>
            </View>
          </View>
        </View>

        {/* CONTACT INFO */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Icon name="phone" size={18} color="#2563EB" />
            </View>
            <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="phone" size={16} color="#6B7280" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>PHONE</Text>
              <Text style={styles.infoValue}>{userProfile.phone}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="mail" size={16} color="#6B7280" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>EMAIL</Text>
              <Text style={styles.infoValue}>{userProfile.email}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="map-pin" size={16} color="#6B7280" style={styles.infoIcon} />
            <View style={{flex: 1}}>
              <Text style={styles.infoLabel}>ADDRESS</Text>
              <Text style={styles.infoValue}>{userProfile.address}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Icon name="calendar" size={16} color="#6B7280" style={styles.infoIcon} />
            <View>
              <Text style={styles.infoLabel}>DATE OF BIRTH</Text>
              <Text style={styles.infoValue}>{userProfile.dob}</Text>
            </View>
          </View>
        </View>

        {/* DRIVING LICENSE */}
        <View style={[styles.card, { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' }]}>
          <View style={styles.licenseHeader}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
              <Icon name="shield" size={24} color="#059669" />
              <View style={{marginLeft: 10}}>
                <Text style={[styles.sectionTitle, {color: '#065F46'}]}>DRIVING LICENSE</Text>
                <Text style={styles.licenseSub}>{userProfile.license.type}</Text>
              </View>
            </View>
            <View style={styles.validBadge}>
              <Text style={styles.validText}>VALID</Text>
            </View>
          </View>
          
          <View style={styles.licenseRow}>
            <Text style={styles.licenseLabel}>License Number:</Text>
            <Text style={styles.licenseValue}>{userProfile.license.number}</Text>
          </View>
          <View style={styles.licenseRow}>
            <Text style={styles.licenseLabel}>Valid Until:</Text>
            <Text style={styles.licenseValue}>{userProfile.license.validUntil}</Text>
          </View>
        </View>

        {/* CERTIFICATIONS */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#FFFBEB' }]}>
              <MaterialIcon name="certificate-outline" size={20} color="#D97706" />
            </View>
            <Text style={styles.sectionTitle}>CERTIFICATIONS</Text>
          </View>

          {certifications.map((cert) => (
            <View key={cert.id} style={styles.certItem}>
              <View style={{flex: 1}}>
                <Text style={styles.certTitle}>{cert.title}</Text>
                <Text style={styles.certIssuer}>{cert.issuer}</Text>
                <View style={styles.certDates}>
                  <Text style={styles.certDate}>Issued: {cert.issued}</Text>
                  {cert.expires && <Text style={styles.certDate}>Expires: {cert.expires}</Text>}
                </View>
              </View>
              <Icon name="file-text" size={18} color="#D97706" />
            </View>
          ))}
        </View>

        {/* PERFORMANCE OVERVIEW */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#F3E8FF' }]}>
              <MaterialIcon name="medal-outline" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.sectionTitle}>PERFORMANCE OVERVIEW</Text>
          </View>

          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>TASKS COMPLETED</Text>
              <Text style={styles.gridValue}>{performance.tasks}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>HOURS LOGGED</Text>
              <Text style={styles.gridValue}>{performance.hours}</Text>
            </View>
          </View>
          <View style={[styles.gridRow, { marginTop: 12 }]}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>RATING</Text>
              <Text style={[styles.gridValue, { color: '#D97706' }]}>{performance.rating}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>SAFETY SCORE</Text>
              <Text style={[styles.gridValue, { color: '#059669' }]}>{performance.safety}</Text>
            </View>
          </View>
        </View>

        {/* PAYSLIPS */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
              <Icon name="file-minus" size={18} color="#059669" />
            </View>
            <Text style={styles.sectionTitle}>PAYSLIPS</Text>
          </View>

          {payslips.map((slip) => (
            <View key={slip.id} style={styles.payslipItem}>
              <View style={styles.payslipHeader}>
                <Text style={styles.payslipMonth}>{slip.month}</Text>
                <Icon name="download" size={16} color="#059669" />
              </View>
              <Text style={styles.payslipStatus}>{slip.status}</Text>
              <View style={styles.payslipRow}>
                <Text style={styles.payslipDetail}>Net Salary: {slip.salary} ₹</Text>
                <Text style={styles.payslipDetail}>Paid Date: {slip.date}</Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', paddingTop: 40 },
  
  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#111827' },
  subHeader: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  themeBtn: { padding: 8, backgroundColor: '#fff', borderRadius: 20, elevation: 1, borderWidth: 1, borderColor: '#E5E7EB' },

  // Generic Card
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', elevation: 1 },
  
  // Profile Top
  profileHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#F3F4F6', borderRadius: 12, padding: 6, borderWidth: 2, borderColor: '#fff' },
  userName: { fontSize: 18, fontWeight: '800', color: '#111827' },
  userId: { fontSize: 12, color: '#6B7280', marginTop: 2, fontWeight: '600' },
  roleBadge: { marginTop: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  roleText: { color: '#059669', fontSize: 11, fontWeight: '800' },

  statsRow: { flexDirection: 'row' },
  statBox: { flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  statLabel: { fontSize: 10, color: '#6B7280', fontWeight: '700', marginBottom: 4 },
  statValue: { fontSize: 14, color: '#111827', fontWeight: '800' },

  // Section Headers
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#111827' },

  // Info Rows
  infoRow: { flexDirection: 'row', marginBottom: 16 },
  infoIcon: { marginTop: 2, marginRight: 12 },
  infoLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '700', marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#374151', fontWeight: '500', lineHeight: 20 },

  // License
  licenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  licenseSub: { fontSize: 12, color: '#047857', marginTop: 2 },
  validBadge: { backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  validText: { color: '#059669', fontSize: 11, fontWeight: '800' },
  licenseRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  licenseLabel: { fontSize: 13, color: '#6EE7B7', fontWeight: '500' },
  licenseValue: { fontSize: 13, color: '#064E3B', fontWeight: '700' },

  // Certifications
  certItem: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, borderWidth: 1, borderColor: '#F3F4F6', borderRadius: 12, marginBottom: 10 },
  certTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  certIssuer: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  certDates: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  certDate: { fontSize: 11, color: '#9CA3AF' },

  // Performance Grid
  gridRow: { flexDirection: 'row', justifyContent: 'space-between' },
  gridItem: { flex: 1, backgroundColor: '#FAFAFA', padding: 16, borderRadius: 12, marginRight: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  gridLabel: { fontSize: 10, color: '#6B7280', fontWeight: '700', marginBottom: 6 },
  gridValue: { fontSize: 20, fontWeight: '800', color: '#111827' },

  // Payslips
  payslipItem: { padding: 14, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginBottom: 10 },
  payslipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  payslipMonth: { fontSize: 14, fontWeight: '800', color: '#1F2937' },
  payslipStatus: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  payslipRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  payslipDetail: { fontSize: 12, color: '#4B5563' },
});

export default ProfileScreen;