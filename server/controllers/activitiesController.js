const db = require('../models/db');
const { canAccessElder } = require('./vitalsController');
const { createAlertForActivity } = require('../services/alert');

async function getActivities(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const allowed = await canAccessElder(req.user, elderId);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const days = parseInt(req.query.days || '30', 10);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const startDate = since.toISOString().split('T')[0];

    const activities = await db('activities')
      .where('elder_id', elderId)
      .where('date', '>=', startDate)
      .orderBy('date', 'asc');

    res.json(activities);
  } catch (err) {
    next(err);
  }
}

async function addActivity(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const allowed = await canAccessElder(req.user, elderId);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const activityDate = req.body.date || new Date().toISOString().split('T')[0];
    const fields = {
      steps: req.body.steps || 0,
      sleep_hours: req.body.sleep_hours || 0,
      meal_count: req.body.meal_count || 0,
      water_intake_ml: req.body.water_intake_ml,
      exercise_minutes: req.body.exercise_minutes,
      outdoor_minutes: req.body.outdoor_minutes,
      social_interactions: req.body.social_interactions,
      screen_time_minutes: req.body.screen_time_minutes,
      bathroom_visits: req.body.bathroom_visits,
      fall_detected: req.body.fall_detected || false,
      location: req.body.location,
      weather: req.body.weather,
      calories_burned: req.body.calories_burned,
      nap_hours: req.body.nap_hours,
    };

    const existing = await db('activities').where({ elder_id: elderId, date: activityDate }).first();

    let activity;
    if (existing) {
      const update = {};
      Object.entries(fields).forEach(([k, v]) => { if (v != null) update[k] = v; });
      [activity] = await db('activities').where({ id: existing.id }).update(update).returning('*');
    } else {
      [activity] = await db('activities').insert({ elder_id: elderId, date: activityDate, ...fields }).returning('*');
    }

    const io = req.app.get('io');
    const alerts = await createAlertForActivity(elderId, activity, io);

    res.status(201).json({ activity, alerts });
  } catch (err) {
    next(err);
  }
}

module.exports = { getActivities, addActivity };
