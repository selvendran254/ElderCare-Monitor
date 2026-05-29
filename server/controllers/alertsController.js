const db = require('../models/db');
const { canAccessElder } = require('./vitalsController');
const { triggerSOS } = require('../services/alert');

async function getAlerts(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const allowed = await canAccessElder(req.user, elderId);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const alerts = await db('alerts')
      .where('elder_id', elderId)
      .orderBy('triggered_at', 'desc')
      .limit(50);

    res.json(alerts);
  } catch (err) {
    next(err);
  }
}

async function resolveAlert(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const alert = await db('alerts').where({ id }).first();
    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    const allowed = await canAccessElder(req.user, alert.elder_id);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const [updated] = await db('alerts')
      .where({ id })
      .update({ resolved: true })
      .returning('*');

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

async function triggerSOSAlert(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const allowed = await canAccessElder(req.user, elderId);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const io = req.app.get('io');
    const alert = await triggerSOS(elderId, io);

    res.status(201).json(alert);
  } catch (err) {
    next(err);
  }
}

module.exports = { getAlerts, resolveAlert, triggerSOSAlert };
