const cron = require('node-cron');
const db = require('../models/db');
const { sendEmail } = require('./notification');
const { checkMissedVitals } = require('./alert');
const { calculateHealthScore } = require('./analytics');

function parseFrequencyHours(frequency) {
  const lower = (frequency || '').toLowerCase();
  if (lower.includes('twice')) return [8, 20];
  if (lower.includes('three') || lower.includes('thrice')) return [8, 14, 20];
  if (lower.includes('four')) return [6, 12, 18, 22];
  return [8];
}

function getCurrentHourWindow() {
  const now = new Date();
  return now.getHours();
}

async function checkMedicationReminders() {
  const currentHour = getCurrentHourWindow();
  const today = new Date().toISOString().split('T')[0];

  const medications = await db('medications as m')
    .join('elders as e', 'm.elder_id', 'e.id')
    .join('users as u', 'e.user_id', 'u.id')
    .where('m.start_date', '<=', today)
    .where(function () {
      this.whereNull('m.end_date').orWhere('m.end_date', '>=', today);
    })
    .select('m.*', 'u.name as elder_name', 'e.user_id as elder_user_id');

  for (const med of medications) {
    const scheduledHour = med.scheduled_time
      ? parseInt(String(med.scheduled_time).split(':')[0], 10)
      : parseFrequencyHours(med.frequency)[0];

    const frequencyHours = parseFrequencyHours(med.frequency);
    const shouldRemind = frequencyHours.includes(currentHour) || scheduledHour === currentHour;

    if (!shouldRemind) continue;

    const existingLog = await db('medication_logs')
      .where({ medication_id: med.id })
      .where('log_date', today)
      .where('status', 'taken')
      .first();

    if (existingLog) continue;

    const missedLog = await db('medication_logs')
      .where({ medication_id: med.id })
      .where('log_date', today)
      .first();

    if (!missedLog) {
      await db('medication_logs').insert({
        medication_id: med.id,
        status: 'missed',
        log_date: today,
      });
    }

    const elderUser = await db('users').where({ id: med.elder_user_id }).first();

    if (elderUser?.email) {
      await sendEmail({
        to: elderUser.email,
        subject: 'Medication Reminder - ElderCare Monitor',
        html: `<p>Reminder: Take <strong>${med.name}</strong> (${med.dosage}) now.</p>`,
        text: `Reminder: Take ${med.name} (${med.dosage}) now.`,
      });
    }

    await sendPushToUser(med.elder_user_id, {
      title: 'Medication Reminder',
      body: `Time to take ${med.name} (${med.dosage})`,
      medicationId: med.id,
    });

    const caretakers = await db('caretaker_elders as ce')
      .join('users as u', 'ce.caretaker_id', 'u.id')
      .where('ce.elder_id', med.elder_id)
      .select('u.id', 'u.email');

    for (const c of caretakers) {
      await sendPushToUser(c.id, {
        title: 'Medication Reminder',
        body: `${med.elder_name} has a pending medication: ${med.name}`,
        elderId: med.elder_id,
      });
    }
  }
}

function startMedicationCron() {
  cron.schedule('0 * * * *', () => {
    console.log('[Cron] Checking medication reminders...');
    checkMedicationReminders().catch((err) =>
      console.error('[Cron] Medication reminder error:', err.message)
    );
  });

  cron.schedule('0 8 * * *', () => {
    console.log('[Cron] Checking missed vitals...');
    checkMissedVitals().catch((err) => console.error('[Cron] Missed vitals error:', err.message));
  });

  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Calculating daily health scores...');
    try {
      const elders = await db('elders').select('id');
      for (const e of elders) await calculateHealthScore(e.id);
    } catch (err) {
      console.error('[Cron] Health score error:', err.message);
    }
  });
}

module.exports = { startMedicationCron, checkMedicationReminders };
