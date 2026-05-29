import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import * as Location from 'expo-location';
import { Accelerometer } from 'expo-sensors';
import api, { getStoredElder, getStoredUser, logout } from '../services/api';

export default function ElderHomeScreen({ navigation }) {
  const [elder, setElder] = useState(null);
  const [user, setUser] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [fallActive, setFallActive] = useState(false);
  const [lastImpact, setLastImpact] = useState(0);

  useEffect(() => {
    (async () => {
      setElder(await getStoredElder());
      setUser(await getStoredUser());
    })();
  }, []);

  useEffect(() => {
    if (!elder?.id) return;
    api.get(`/vitals/${elder.id}?days=1`).then(r => {
      const latest = r.data[r.data.length - 1];
      setVitals(latest);
    }).catch(() => {});
  }, [elder]);

  useEffect(() => {
    if (!fallActive || !elder?.id) return;
    let sub;
    Accelerometer.setUpdateInterval(500);
    sub = Accelerometer.addListener(({ x, y, z }) => {
      const impact = Math.abs(x) + Math.abs(y) + Math.abs(z);
      setLastImpact(Math.round(impact * 10) / 10);
      if (impact > 2.5) {
        api.post(`/features/fall/${elder.id}`, { impact_force: impact * 10, source: 'mobile_accelerometer' })
          .then(() => Alert.alert('🚨 Fall Detected', 'Emergency alert sent to caretaker'));
      }
    });
    return () => sub && sub.remove();
  }, [fallActive, elder]);

  const shareLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission needed', 'Location permission required');
    const loc = await Location.getCurrentPositionAsync({});
    await api.post(`/features/gps/${elder.id}`, {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      accuracy: loc.coords.accuracy,
    });
    Alert.alert('📍 Location shared', 'Caretaker can see your location on the map');
  };

  const triggerSOS = async () => {
    await api.post(`/alerts/${elder.id}/sos`);
    Alert.alert('🆘 SOS Sent', 'Emergency alert sent!');
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  if (!elder) return <View style={styles.container}><Text>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Welcome, {user?.name}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>❤️ Latest Vitals</Text>
        <Text style={styles.stat}>HR: {vitals?.heart_rate || '—'} bpm</Text>
        <Text style={styles.stat}>BP: {vitals ? `${vitals.blood_pressure_sys}/${vitals.blood_pressure_dia}` : '—'}</Text>
        <Text style={styles.stat}>SpO2: {vitals?.spo2 || '—'}%</Text>
      </View>

      <TouchableOpacity style={styles.btnPrimary} onPress={shareLocation}>
        <Text style={styles.btnText}>📍 Share GPS Location</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.btnSecondary, fallActive && styles.btnDanger]} onPress={() => setFallActive(!fallActive)}>
        <Text style={styles.btnTextDark}>{fallActive ? '⏹ Stop Fall Monitor' : '▶ Start Fall Monitor'}</Text>
        {fallActive && <Text style={styles.hint}>Impact: {lastImpact}</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnSOS} onPress={triggerSOS}>
        <Text style={styles.btnText}>🆘 SOS EMERGENCY</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 20, paddingTop: 60 },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  stat: { fontSize: 16, color: '#475569', marginBottom: 4 },
  btnPrimary: { backgroundColor: '#059669', padding: 16, borderRadius: 14, marginBottom: 12 },
  btnSecondary: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#059669', padding: 16, borderRadius: 14, marginBottom: 12 },
  btnDanger: { borderColor: '#ef4444' },
  btnSOS: { backgroundColor: '#ef4444', padding: 18, borderRadius: 14, marginBottom: 12 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  btnTextDark: { color: '#059669', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  hint: { textAlign: 'center', color: '#64748b', marginTop: 4, fontSize: 12 },
  btnLogout: { padding: 12, marginTop: 20 },
  logoutText: { textAlign: 'center', color: '#ef4444' },
});
