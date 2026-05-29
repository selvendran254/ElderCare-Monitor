import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { login } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('elder@demo.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.user.role === 'elder') {
        navigation.replace('ElderHome');
      } else {
        Alert.alert('Mobile App', 'Elder role recommended for mobile. Use web for other roles.');
        navigation.replace('ElderHome');
      }
    } catch (err) {
      Alert.alert('Login failed', err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>👴 ElderCare</Text>
      <Text style={styles.subtitle}>Mobile Health Monitor</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        <Text style={styles.btnText}>{loading ? '...' : 'Login'}</Text>
      </TouchableOpacity>
      <Text style={styles.demo}>Demo: elder@demo.com / password123</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#f8fafc' },
  logo: { fontSize: 32, fontWeight: 'bold', textAlign: 'center', color: '#059669' },
  subtitle: { textAlign: 'center', color: '#64748b', marginBottom: 32 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 16 },
  btn: { backgroundColor: '#059669', padding: 16, borderRadius: 12, marginTop: 8 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 16 },
  demo: { textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 16 },
});
