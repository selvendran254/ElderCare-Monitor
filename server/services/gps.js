const db = require('../models/db');

async function saveLocation(elderId, { latitude, longitude, accuracy }) {
  const [loc] = await db('gps_locations').insert({
    elder_id: elderId,
    latitude,
    longitude,
    accuracy_m: accuracy,
  }).returning('*');

  await db('iot_devices').where({ elder_id: elderId, device_type: 'gps_tracker' }).update({
    latitude, longitude, last_seen: db.fn.now(),
  });

  return loc;
}

async function getLatestLocation(elderId) {
  return db('gps_locations').where('elder_id', elderId).orderBy('recorded_at', 'desc').first();
}

async function getLocationHistory(elderId, hours = 24) {
  const since = new Date();
  since.setHours(since.getHours() - hours);
  return db('gps_locations').where('elder_id', elderId).where('recorded_at', '>=', since).orderBy('recorded_at', 'asc');
}

async function getAllElderLocations(caretakerId) {
  const elders = await db('caretaker_elders as ce')
    .join('elders as e', 'ce.elder_id', 'e.id')
    .join('users as u', 'e.user_id', 'u.id')
    .where('ce.caretaker_id', caretakerId)
    .select('e.id as elder_id', 'u.name');

  const results = [];
  for (const elder of elders) {
    const loc = await getLatestLocation(elder.elder_id);
    if (loc) results.push({ ...elder, ...loc });
  }
  return results;
}

module.exports = { saveLocation, getLatestLocation, getLocationHistory, getAllElderLocations };
