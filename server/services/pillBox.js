const db = require('../models/db');
const { sendWhatsApp } = require('./alert');

async function getOrCreatePillBox(elderId) {
  let box = await db('pill_boxes').where({ elder_id: elderId }).first();
  if (!box) {
    [box] = await db('pill_boxes').insert({
      elder_id: elderId,
      device_id: `PBOX-${elderId}-${Date.now()}`,
      name: `Smart Pill Box - Elder ${elderId}`,
      compartments: 4,
      battery_level: 100,
      status: 'online',
      last_sync: db.fn.now(),
    }).returning('*');
  }
  return box;
}

async function recordEvent(pillBoxId, compartment, eventType) {
  const [event] = await db('pill_box_events').insert({
    pill_box_id: pillBoxId,
    compartment,
    event_type: eventType,
  }).returning('*');

  const box = await db('pill_boxes').where({ id: pillBoxId }).first();
  await db('pill_boxes').where({ id: pillBoxId }).update({ last_sync: db.fn.now() });

  if (eventType === 'missed') {
    const elder = await db('elders as e').join('users as u', 'e.user_id', 'u.id').where('e.id', box.elder_id).select('u.name').first();
    await db('alerts').insert({
      elder_id: box.elder_id,
      type: 'warning',
      message: `Smart Pill Box: Compartment ${compartment} dose missed for ${elder?.name}`,
    });
  }

  return event;
}

async function getPillBoxStatus(elderId) {
  const box = await getOrCreatePillBox(elderId);
  const today = new Date().toISOString().split('T')[0];
  const events = await db('pill_box_events')
    .where('pill_box_id', box.id)
    .where('event_at', '>=', today)
    .orderBy('event_at', 'desc');

  const compartments = [];
  for (let i = 1; i <= box.compartments; i++) {
    const taken = events.find(e => e.compartment === i && e.event_type === 'taken');
    const missed = events.find(e => e.compartment === i && e.event_type === 'missed');
    compartments.push({
      compartment: i,
      status: taken ? 'taken' : missed ? 'missed' : 'pending',
      last_event: taken || missed || null,
    });
  }

  return { box, compartments, events };
}

async function simulateDose(pillBoxId, compartment, status) {
  return recordEvent(pillBoxId, compartment, status);
}

async function sendWhatsAppAlert(phone, message, lang = 'en') {
  const tamilPrefix = lang === 'ta' ? '🔔 ElderCare அறிவிப்பு: ' : '🔔 ElderCare Alert: ';
  return sendWhatsApp(phone, tamilPrefix + message);
}

module.exports = { getOrCreatePillBox, getPillBoxStatus, simulateDose, recordEvent, sendWhatsAppAlert };
