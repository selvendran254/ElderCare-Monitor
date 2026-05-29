const bcrypt = require('bcryptjs');
const db = require('../models/db');
const { logAudit } = require('../middleware/audit');
const { DEFAULT_RULES } = require('../services/alert');

async function getUsers(req, res, next) {
  try {
    const users = await db('users').select('id', 'name', 'email', 'role', 'phone', 'created_at', 'last_login').orderBy('created_at', 'desc');
    res.json(users);
  } catch (err) { next(err); }
}

async function getElders(req, res, next) {
  try {
    const elders = await db('elders as e')
      .join('users as u', 'e.user_id', 'u.id')
      .select('e.*', 'u.name', 'u.email', 'u.phone');
    res.json(elders);
  } catch (err) { next(err); }
}

async function assignCaretaker(req, res, next) {
  try {
    const caretaker_id = parseInt(req.body.caretaker_id, 10);
    const elder_id = parseInt(req.body.elder_id, 10);
    if (!caretaker_id || !elder_id) return res.status(400).json({ error: 'caretaker_id and elder_id required' });
    await db('caretaker_elders').insert({ caretaker_id, elder_id }).onConflict(['caretaker_id', 'elder_id']).ignore();
    await logAudit(req.user.id, 'assign_caretaker', 'elder', elder_id, { caretaker_id }, req.ip);
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function assignDoctor(req, res, next) {
  try {
    const doctor_id = parseInt(req.body.doctor_id, 10);
    const elder_id = parseInt(req.body.elder_id, 10);
    if (!doctor_id || !elder_id) return res.status(400).json({ error: 'doctor_id and elder_id required' });
    await db('doctor_elders').insert({ doctor_id, elder_id }).onConflict(['doctor_id', 'elder_id']).ignore();
    await logAudit(req.user.id, 'assign_doctor', 'elder', elder_id, { doctor_id }, req.ip);
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function assignFamily(req, res, next) {
  try {
    const { family_user_id, elder_id, relationship } = req.body;
    await db('family_access').insert({ family_user_id, elder_id, relationship }).onConflict(['family_user_id', 'elder_id']).ignore();
    res.json({ success: true });
  } catch (err) { next(err); }
}

async function getAuditLogs(req, res, next) {
  try {
    const logs = await db('audit_logs as a')
      .leftJoin('users as u', 'a.user_id', 'u.id')
      .select('a.*', 'u.name as user_name')
      .orderBy('a.created_at', 'desc')
      .limit(100);
    res.json(logs);
  } catch (err) { next(err); }
}

async function getAlertRules(req, res, next) {
  try {
    const rules = await db('alert_rules').orderBy('id');
    res.json(rules.length ? rules : DEFAULT_RULES);
  } catch (err) { next(err); }
}

async function createAlertRule(req, res, next) {
  try {
    const [rule] = await db('alert_rules').insert(req.body).returning('*');
    res.status(201).json(rule);
  } catch (err) { next(err); }
}

async function updateAlertRule(req, res, next) {
  try {
    const [rule] = await db('alert_rules').where({ id: req.params.id }).update(req.body).returning('*');
    res.json(rule);
  } catch (err) { next(err); }
}

async function createUser(req, res, next) {
  try {
    const { name, email, password, role, phone, ...profile } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const [user] = await db('users').insert({ name, email, password_hash, role, phone }).returning(['id', 'name', 'email', 'role']);
    if (role === 'elder') {
      await db('elders').insert({ user_id: user.id, ...profile });
    } else if (role === 'caretaker') {
      await db('caretaker_profiles').insert({ user_id: user.id, ...profile });
    } else if (role === 'doctor') {
      await db('doctor_profiles').insert({ user_id: user.id, ...profile });
    }
    await db('user_preferences').insert({ user_id: user.id });
    await logAudit(req.user.id, 'create_user', 'user', user.id, { role }, req.ip);
    res.status(201).json(user);
  } catch (err) { next(err); }
}

async function getStats(req, res, next) {
  try {
    const [users, elders, alerts, appointments] = await Promise.all([
      db('users').count('id as c').first(),
      db('elders').count('id as c').first(),
      db('alerts').where('resolved', false).count('id as c').first(),
      db('appointments').where('scheduled_at', '>', new Date()).count('id as c').first(),
    ]);
    res.json({
      totalUsers: parseInt(users.c),
      totalElders: parseInt(elders.c),
      activeAlerts: parseInt(alerts.c),
      upcomingAppointments: parseInt(appointments.c),
    });
  } catch (err) { next(err); }
}

async function getEmergencyContacts(req, res, next) {
  try {
    const contacts = await db('emergency_contacts').where('elder_id', req.params.elderId);
    res.json(contacts);
  } catch (err) { next(err); }
}

async function addEmergencyContact(req, res, next) {
  try {
    const [contact] = await db('emergency_contacts').insert({ elder_id: req.params.elderId, ...req.body }).returning('*');
    res.status(201).json(contact);
  } catch (err) { next(err); }
}

module.exports = {
  getUsers, getElders, assignCaretaker, assignDoctor, assignFamily,
  getAuditLogs, getAlertRules, createAlertRule, updateAlertRule,
  createUser, getStats, getEmergencyContacts, addEmergencyContact,
};
