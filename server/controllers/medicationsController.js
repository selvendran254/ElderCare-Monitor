const db = require('../models/db');
const { canAccessElder } = require('./vitalsController');

async function getMedications(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const allowed = await canAccessElder(req.user, elderId);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const today = new Date().toISOString().split('T')[0];

    const medications = await db('medications')
      .where('elder_id', elderId)
      .where('start_date', '<=', today)
      .where(function () {
        this.whereNull('end_date').orWhere('end_date', '>=', today);
      });

    const medsWithLogs = await Promise.all(
      medications.map(async (med) => {
        const todayLog = await db('medication_logs')
          .where({ medication_id: med.id, log_date: today })
          .orderBy('taken_at', 'desc')
          .first();

        return { ...med, todayLog };
      })
    );

    res.json(medsWithLogs);
  } catch (err) {
    next(err);
  }
}

async function addMedication(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const allowed = await canAccessElder(req.user, elderId);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const { name, dosage, frequency, start_date, end_date, scheduled_time } = req.body;

    const [medication] = await db('medications')
      .insert({
        elder_id: elderId,
        name,
        dosage,
        frequency,
        start_date: start_date || new Date().toISOString().split('T')[0],
        end_date,
        scheduled_time,
      })
      .returning('*');

    res.status(201).json(medication);
  } catch (err) {
    next(err);
  }
}

async function logMedication(req, res, next) {
  try {
    const medId = parseInt(req.params.medId, 10);
    const { status } = req.body;

    const med = await db('medications').where({ id: medId }).first();
    if (!med) return res.status(404).json({ error: 'Medication not found' });

    const allowed = await canAccessElder(req.user, med.elder_id);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const today = new Date().toISOString().split('T')[0];

    const existing = await db('medication_logs')
      .where({ medication_id: medId, log_date: today })
      .first();

    let log;
    if (existing) {
      [log] = await db('medication_logs')
        .where({ id: existing.id })
        .update({ status: status || 'taken', taken_at: db.fn.now() })
        .returning('*');
    } else {
      [log] = await db('medication_logs')
        .insert({
          medication_id: medId,
          status: status || 'taken',
          log_date: today,
        })
        .returning('*');
    }

    res.json(log);
  } catch (err) {
    next(err);
  }
}

async function getCompliance(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const allowed = await canAccessElder(req.user, elderId);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStart = weekAgo.toISOString().split('T')[0];

    const medications = await db('medications').where('elder_id', elderId);
    const medIds = medications.map((m) => m.id);

    if (!medIds.length) {
      return res.json({ compliance: 100, daily: [] });
    }

    const logs = await db('medication_logs')
      .whereIn('medication_id', medIds)
      .where('log_date', '>=', weekStart);

    const taken = logs.filter((l) => l.status === 'taken').length;
    const total = logs.length || 1;
    const compliance = Math.round((taken / total) * 100);

    const daily = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLogs = logs.filter((l) => l.log_date === dateStr);
      const dayTaken = dayLogs.filter((l) => l.status === 'taken').length;
      const dayTotal = dayLogs.length || medications.length;
      daily.push({
        date: dateStr,
        compliance: dayTotal ? Math.round((dayTaken / dayTotal) * 100) : 0,
      });
    }

    res.json({ compliance, daily });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMedications, addMedication, logMedication, getCompliance };
