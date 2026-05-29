const db = require('../models/db');
const { createAlertForActivity } = require('./alert');
const { addRecord } = require('./blockchain');

async function recordFall(elderId, sensorData, io) {
  const impact = sensorData?.impact_force || sensorData?.acceleration || 0;

  const [event] = await db('fall_events').insert({
    elder_id: elderId,
    impact_force: impact,
    sensor_data: JSON.stringify(sensorData),
  }).returning('*');

  await db('activities').insert({
    elder_id: elderId,
    date: new Date().toISOString().split('T')[0],
    fall_detected: true,
    steps: 0,
  }).onConflict(['elder_id', 'date']).merge({ fall_detected: true });

  const elder = await db('elders as e').join('users as u', 'e.user_id', 'u.id').where('e.id', elderId).select('u.name as elder_name').first();

  await db('alerts').insert({
    elder_id: elderId,
    type: 'emergency',
    message: `FALL DETECTED for ${elder?.elder_name || 'Elder'}! Immediate attention required.`,
  });

  await addRecord(elderId, 'fall_event', event.id, { impact, detected_at: event.detected_at });

  if (io) {
    io.to('caretakers').emit('fall', { ...event, elder_id: elderId, elder_name: elder?.elder_name });
    io.to(`caretaker-${elderId}`).emit('alert', { type: 'emergency', message: 'Fall detected!', elder_id: elderId });
  }

  return event;
}

async function getFallHistory(elderId) {
  return db('fall_events').where('elder_id', elderId).orderBy('detected_at', 'desc').limit(20);
}

module.exports = { recordFall, getFallHistory };
