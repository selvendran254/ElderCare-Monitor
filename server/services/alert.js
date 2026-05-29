const db = require('../models/db');
const { sendEmail, sendSMS } = require('./notification');
const { sendPushToUser } = require('./push');

const DEFAULT_RULES = [
  { name: 'Low Heart Rate', metric: 'heart_rate', operator: 'lt', threshold: 50, alert_type: 'emergency', message_template: 'Heart rate critically low: {value} bpm' },
  { name: 'High Heart Rate', metric: 'heart_rate', operator: 'gt', threshold: 120, alert_type: 'emergency', message_template: 'Heart rate critically high: {value} bpm' },
  { name: 'High BP Systolic', metric: 'blood_pressure_sys', operator: 'gt', threshold: 180, alert_type: 'warning', message_template: 'High blood pressure: {value} mmHg' },
  { name: 'Low BP Systolic', metric: 'blood_pressure_sys', operator: 'lt', threshold: 90, alert_type: 'warning', message_template: 'Low blood pressure: {value} mmHg' },
  { name: 'Low SpO2', metric: 'spo2', operator: 'lt', threshold: 92, alert_type: 'emergency', message_template: 'Low oxygen level: {value}%' },
  { name: 'High Glucose', metric: 'blood_glucose', operator: 'gt', threshold: 200, alert_type: 'warning', message_template: 'High blood glucose: {value} mg/dL' },
  { name: 'High Temperature', metric: 'temperature', operator: 'gt', threshold: 38.5, alert_type: 'warning', message_template: 'High temperature: {value}°C' },
  { name: 'Fall Detected', metric: 'fall_detected', operator: 'eq', threshold: 1, alert_type: 'emergency', message_template: 'Fall detected for elder' },
  { name: 'Low Activity', metric: 'steps', operator: 'lt', threshold: 500, alert_type: 'info', message_template: 'Low activity: only {value} steps today' },
];

function checkRule(rule, data) {
  const val = data[rule.metric];
  if (val == null) return false;
  const t = parseFloat(rule.threshold);
  switch (rule.operator) {
    case 'lt': return parseFloat(val) < t;
    case 'gt': return parseFloat(val) > t;
    case 'eq': return val == t || val === true;
    default: return false;
  }
}

function evaluateVitals(vitals) {
  const alerts = [];
  if (vitals.heart_rate != null && (vitals.heart_rate < 50 || vitals.heart_rate > 120)) {
    alerts.push({ type: 'emergency', message: `Abnormal heart rate: ${vitals.heart_rate} bpm (normal: 50-120)` });
  }
  if (vitals.blood_pressure_sys != null && (vitals.blood_pressure_sys > 180 || vitals.blood_pressure_sys < 90)) {
    alerts.push({ type: 'warning', message: `Abnormal BP (systolic): ${vitals.blood_pressure_sys}/${vitals.blood_pressure_dia || '--'} mmHg` });
  }
  if (vitals.spo2 != null && vitals.spo2 < 92) {
    alerts.push({ type: 'emergency', message: `Low SpO2: ${vitals.spo2}% (normal: ≥92%)` });
  }
  if (vitals.blood_glucose != null && vitals.blood_glucose > 200) {
    alerts.push({ type: 'warning', message: `High blood glucose: ${vitals.blood_glucose} mg/dL` });
  }
  if (vitals.temperature != null && vitals.temperature > 38.5) {
    alerts.push({ type: 'warning', message: `High temperature: ${vitals.temperature}°C` });
  }
  return alerts;
}

async function evaluateCustomRules(elderId, data) {
  const rules = await db('alert_rules').where(function () {
    this.whereNull('elder_id').orWhere('elder_id', elderId);
  }).where('enabled', true);

  const triggered = [];
  for (const rule of rules.length ? rules : DEFAULT_RULES) {
    if (checkRule(rule, data)) {
      const msg = (rule.message_template || rule.message || rule.name).replace('{value}', data[rule.metric]);
      triggered.push({ type: rule.alert_type, message: msg });
    }
  }
  return triggered;
}

async function getNotificationRecipients(elderId) {
  const caretakers = await db('caretaker_elders as ce')
    .join('users as u', 'ce.caretaker_id', 'u.id')
    .leftJoin('user_preferences as up', 'u.id', 'up.user_id')
    .where('ce.elder_id', elderId)
    .select('u.id', 'u.email', 'u.phone', 'up.sms_notifications', 'up.email_notifications', 'up.whatsapp_notifications');

  const contacts = await db('emergency_contacts').where('elder_id', elderId).orderBy('priority');
  return { caretakers, contacts };
}

async function notifyRecipients(elderId, elder, alertDef, io) {
  const { caretakers, contacts } = await getNotificationRecipients(elderId);

  const [alert] = await db('alerts').insert({
    elder_id: elderId,
    type: alertDef.type,
    message: alertDef.message,
  }).returning('*');

  const tamilMsg = alertDef.message;

  for (const c of caretakers) {
    if (c.email_notifications !== false && c.email) {
      await sendEmail({
        to: c.email,
        subject: `[ElderCare ${alertDef.type.toUpperCase()}] ${elder?.elder_name || elder?.name}`,
        html: `<p><strong>${alertDef.type.toUpperCase()}</strong></p><p>${tamilMsg}</p>`,
        text: tamilMsg,
      });
    }
    if (c.sms_notifications && c.phone) {
      await sendSMS(c.phone, `ElderCare Alert: ${tamilMsg}`);
    }
    if (c.whatsapp_notifications && c.phone) {
      await sendWhatsApp(c.phone, `ElderCare Alert: ${tamilMsg}`);
    }
    await sendPushToUser(c.id, { title: alertDef.type.toUpperCase(), body: tamilMsg, elderId });
  }

  for (const contact of contacts) {
    if (contact.email) {
      await sendEmail({ to: contact.email, subject: '[ElderCare Alert]', html: `<p>${tamilMsg}</p>`, text: tamilMsg });
    }
    if (contact.phone) {
      await sendSMS(contact.phone, `ElderCare: ${tamilMsg}`);
    }
  }

  if (io) {
    io.to('caretakers').emit('alert', { ...alert, elder_name: elder?.elder_name || elder?.name });
    io.to(`caretaker-${elderId}`).emit('alert', { ...alert, elder_name: elder?.elder_name || elder?.name });
  }

  return alert;
}

async function sendWhatsApp(to, message) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) {
    console.log(`[WhatsApp mock] To: ${to} | ${message}`);
    return { mock: true };
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: to.replace(/\D/g, ''), type: 'text', text: { body: message } }),
    });
    return res.json();
  } catch (err) {
    console.error('[WhatsApp failed]', err.message);
    return { error: err.message };
  }
}

async function createAlertsForVitals(elderId, vitals, io) {
  const elder = await db('elders as e')
    .join('users as u', 'e.user_id', 'u.id')
    .where('e.id', elderId)
    .select('e.*', 'u.name as elder_name', 'u.email as elder_email')
    .first();

  const alertDefs = [
    ...evaluateVitals(vitals),
    ...(await evaluateCustomRules(elderId, vitals)),
  ];

  const unique = [...new Map(alertDefs.map((a) => [a.message, a])).values()];
  const created = [];
  for (const def of unique) {
    created.push(await notifyRecipients(elderId, elder, def, io));
  }
  return created;
}

async function createAlertForActivity(elderId, activity, io) {
  if (!activity.fall_detected && !(activity.steps != null && activity.steps < 500)) return [];

  const elder = await db('elders as e').join('users as u', 'e.user_id', 'u.id').where('e.id', elderId).select('e.*', 'u.name as elder_name').first();
  const defs = await evaluateCustomRules(elderId, activity);
  const created = [];
  for (const def of defs) {
    created.push(await notifyRecipients(elderId, elder, def, io));
  }
  return created;
}

async function checkMissedVitals() {
  const elders = await db('elders').select('id');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  for (const elder of elders) {
    const recent = await db('vitals').where('elder_id', elder.id).where('recorded_at', '>=', yesterday).first();
    if (!recent) {
      const e = await db('elders as e').join('users as u', 'e.user_id', 'u.id').where('e.id', elder.id).select('u.name as elder_name').first();
      await notifyRecipients(elder.id, e, { type: 'info', message: `No vitals logged in 24 hours for ${e.elder_name}` }, null);
    }
  }
}

async function triggerSOS(elderId, io) {
  const elder = await db('elders as e')
    .join('users as u', 'e.user_id', 'u.id')
    .where('e.id', elderId)
    .select('e.*', 'u.name as elder_name', 'u.email as elder_email', 'u.phone')
    .first();

  if (!elder) throw new Error('Elder not found');

  const message = `SOS EMERGENCY: ${elder.elder_name} needs immediate help! Address: ${elder.address || 'N/A'}. Phone: ${elder.phone || 'N/A'}`;
  const alert = await notifyRecipients(elderId, elder, { type: 'sos', message }, io);

  const contacts = await db('emergency_contacts').where('elder_id', elderId);
  for (const c of contacts) {
    if (c.phone) await sendSMS(c.phone, message);
    if (c.email) await sendEmail({ to: c.email, subject: '[SOS]', html: `<h2>SOS</h2><p>${message}</p>`, text: message });
  }

  if (io) io.to('caretakers').emit('sos', alert);
  return alert;
}

module.exports = {
  evaluateVitals, evaluateCustomRules, createAlertsForVitals,
  createAlertForActivity, triggerSOS, checkMissedVitals, sendWhatsApp, DEFAULT_RULES,
};
