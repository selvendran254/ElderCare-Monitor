const db = require('../models/db');

function generateRoomId(appointmentId, elderId) {
  return `eldercare-${elderId}-${appointmentId || Date.now()}`;
}

async function createSession({ appointmentId, elderId, doctorId }) {
  const roomId = generateRoomId(appointmentId, elderId);
  const roomUrl = `https://meet.jit.si/${roomId}`;

  const existing = appointmentId
    ? await db('video_sessions').where({ appointment_id: appointmentId }).first()
    : null;

  if (existing) return existing;

  const [session] = await db('video_sessions').insert({
    appointment_id: appointmentId,
    elder_id: elderId,
    doctor_id: doctorId,
    room_id: roomId,
    room_url: roomUrl,
    status: 'scheduled',
  }).returning('*');

  if (appointmentId) {
    await db('appointments').where({ id: appointmentId }).update({ video_call_link: roomUrl });
  }

  return session;
}

async function startSession(sessionId) {
  const [s] = await db('video_sessions').where({ id: sessionId }).update({ status: 'active', started_at: db.fn.now() }).returning('*');
  return s;
}

async function endSession(sessionId) {
  const [s] = await db('video_sessions').where({ id: sessionId }).update({ status: 'completed', ended_at: db.fn.now() }).returning('*');
  return s;
}

async function getSessionsForElder(elderId) {
  return db('video_sessions as v')
    .leftJoin('users as d', 'v.doctor_id', 'd.id')
    .where('v.elder_id', elderId)
    .select('v.*', 'd.name as doctor_name')
    .orderBy('v.id', 'desc');
}

module.exports = { createSession, startSession, endSession, getSessionsForElder, generateRoomId };
