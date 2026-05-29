const db = require('../models/db');
const { canAccessElder } = require('./vitalsController');

async function getAppointments(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const allowed = await canAccessElder(req.user, elderId);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const appointments = await db('appointments as a')
      .join('users as d', 'a.doctor_id', 'd.id')
      .where('a.elder_id', elderId)
      .select('a.*', 'd.name as doctor_name')
      .orderBy('a.scheduled_at', 'asc');

    res.json(appointments);
  } catch (err) {
    next(err);
  }
}

async function createAppointment(req, res, next) {
  try {
    const { elder_id, doctor_id, scheduled_at, notes } = req.body;

    const allowed = await canAccessElder(req.user, elder_id);
    if (!allowed && req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [appointment] = await db('appointments')
      .insert({
        elder_id,
        doctor_id: doctor_id || req.user.id,
        scheduled_at,
        notes,
        status: 'pending',
      })
      .returning('*');

    res.status(201).json(appointment);
  } catch (err) {
    next(err);
  }
}

async function updateAppointment(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const appointment = await db('appointments').where({ id }).first();
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });

    const allowed =
      req.user.role === 'doctor' ||
      (await canAccessElder(req.user, appointment.elder_id));

    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const { scheduled_at, notes, clinical_notes, status } = req.body;

    const [updated] = await db('appointments')
      .where({ id })
      .update({
        scheduled_at,
        notes,
        clinical_notes,
        status,
      })
      .returning('*');

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAppointments, createAppointment, updateAppointment };
