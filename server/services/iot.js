const db = require('../models/db');
const { createAlertsForVitals } = require('./alert');

async function getDevices(elderId) {
  return db('iot_devices').where('elder_id', elderId);
}

async function registerDevice(elderId, data) {
  const [device] = await db('iot_devices').insert({
    elder_id: elderId,
    device_type: data.device_type,
    device_name: data.device_name,
    device_id: data.device_id || `DEV-${Date.now()}`,
    battery_level: data.battery_level || 100,
    latitude: data.latitude,
    longitude: data.longitude,
    geofence_radius_m: data.geofence_radius_m || 500,
    last_seen: db.fn.now(),
  }).returning('*');
  return device;
}

async function recordReading(deviceId, data, io) {
  const device = await db('iot_devices').where({ id: deviceId }).first();
  if (!device) throw new Error('Device not found');

  const [reading] = await db('iot_readings').insert({
    device_id: deviceId,
    elder_id: device.elder_id,
    reading_type: data.reading_type,
    data: JSON.stringify(data.payload || data),
  }).returning('*');

  await db('iot_devices').where({ id: deviceId }).update({
    last_seen: db.fn.now(),
    battery_level: data.battery_level ?? device.battery_level,
    latitude: data.latitude ?? device.latitude,
    longitude: data.longitude ?? device.longitude,
  });

  if (data.payload?.heart_rate || data.payload?.blood_pressure_sys) {
    const [vital] = await db('vitals').insert({
      elder_id: device.elder_id,
      heart_rate: data.payload.heart_rate,
      blood_pressure_sys: data.payload.blood_pressure_sys,
      blood_pressure_dia: data.payload.blood_pressure_dia,
      spo2: data.payload.spo2,
      source: device.device_type,
      recorded_by: 'device',
    }).returning('*');

    if (io) {
      io.to(`elder-${device.elder_id}`).emit('vitals', vital);
      io.to('caretakers').emit('vitals', { ...vital, elder_id: device.elder_id });
    }
    await createAlertsForVitals(device.elder_id, vital, io);
  }

  if (data.payload?.fall_detected) {
    await db('activities').insert({
      elder_id: device.elder_id,
      date: new Date().toISOString().split('T')[0],
      fall_detected: true,
      steps: data.payload.steps || 0,
    }).onConflict(['elder_id', 'date']).merge({ fall_detected: true });
  }

  if (data.latitude && data.longitude && device.latitude && device.longitude && device.geofence_radius_m) {
    const dist = haversine(device.latitude, device.longitude, data.latitude, data.longitude);
    if (dist > device.geofence_radius_m) {
      const elder = await db('elders as e').join('users as u', 'e.user_id', 'u.id').where('e.id', device.elder_id).select('u.name as elder_name').first();
      await db('alerts').insert({
        elder_id: device.elder_id,
        type: 'warning',
        message: `Geofence exit: ${elder.elder_name} left safe zone (${Math.round(dist)}m away)`,
      });
      if (io) io.to('caretakers').emit('alert', { type: 'warning', message: 'Geofence exit detected', elder_id: device.elder_id });
    }
  }

  if (io) io.to(`elder-${device.elder_id}`).emit('iot-reading', reading);
  return reading;
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getReadings(elderId, limit = 50) {
  return db('iot_readings').where('elder_id', elderId).orderBy('recorded_at', 'desc').limit(limit);
}

module.exports = { getDevices, registerDevice, recordReading, getReadings };
