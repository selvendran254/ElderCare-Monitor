const db = require('../models/db');
const { cacheGet, cacheSet, cacheDel } = require('../services/redis');
const { createAlertsForVitals } = require('../services/alert');

async function canAccessElder(user, elderId) {
  if (user.role === 'admin') return true;
  if (user.role === 'elder') {
    const elder = await db('elders').where({ user_id: user.id, id: elderId }).first();
    return !!elder;
  }
  if (user.role === 'caretaker') {
    const link = await db('caretaker_elders').where({ caretaker_id: user.id, elder_id: elderId }).first();
    return !!link;
  }
  if (user.role === 'doctor') {
    const link = await db('doctor_elders').where({ doctor_id: user.id, elder_id: elderId }).first();
    return !!link;
  }
  if (user.role === 'family') {
    const link = await db('family_access').where({ family_user_id: user.id, elder_id: elderId }).first();
    return !!link;
  }
  return false;
}

async function getVitals(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const allowed = await canAccessElder(req.user, elderId);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const days = parseInt(req.query.days || '30', 10);
    const cacheKey = `vitals:${elderId}:${days}d`;
    const cached = await cacheGet(cacheKey);
    if (cached && !req.query.refresh) return res.json(cached);

    const since = new Date();
    since.setDate(since.getDate() - days);

    const vitals = await db('vitals')
      .where('elder_id', elderId)
      .where('recorded_at', '>=', since)
      .orderBy('recorded_at', 'asc');

    await cacheSet(cacheKey, vitals, 120);
    res.json(vitals);
  } catch (err) {
    next(err);
  }
}

async function addVitals(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const allowed = await canAccessElder(req.user, elderId);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const fields = {
      elder_id: elderId,
      heart_rate: req.body.heart_rate,
      blood_pressure_sys: req.body.blood_pressure_sys,
      blood_pressure_dia: req.body.blood_pressure_dia,
      spo2: req.body.spo2,
      temperature: req.body.temperature,
      blood_glucose: req.body.blood_glucose,
      glucose_type: req.body.glucose_type,
      respiratory_rate: req.body.respiratory_rate,
      weight_kg: req.body.weight_kg,
      pain_level: req.body.pain_level,
      mood: req.body.mood,
      hydration_glasses: req.body.hydration_glasses,
      recorded_by: req.user.role,
      source: req.body.source || 'manual',
    };

    const [vital] = await db('vitals').insert(fields).returning('*');

    await cacheDel(`vitals:${elderId}:*`);

    const io = req.app.get('io');
    io.to(`elder-${elderId}`).emit('vitals', vital);
    io.to('caretakers').emit('vitals', { ...vital, elder_id: elderId });

    const alerts = await createAlertsForVitals(elderId, vital, io);

    res.status(201).json({ vital, alerts });
  } catch (err) {
    next(err);
  }
}

module.exports = { getVitals, addVitals, canAccessElder };
