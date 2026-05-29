import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:5000/api'; // Android emulator → localhost

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  await AsyncStorage.setItem('accessToken', data.accessToken);
  await AsyncStorage.setItem('refreshToken', data.refreshToken);
  await AsyncStorage.setItem('user', JSON.stringify(data.user));
  if (data.elder) await AsyncStorage.setItem('elder', JSON.stringify(data.elder));
  return data;
}

export async function logout() {
  await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user', 'elder']);
}

export async function getStoredUser() {
  const raw = await AsyncStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

export async function getStoredElder() {
  const raw = await AsyncStorage.getItem('elder');
  return raw ? JSON.parse(raw) : null;
}

export default api;
