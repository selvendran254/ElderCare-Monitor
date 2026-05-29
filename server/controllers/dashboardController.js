const db = require('../models/db');
const PDFDocument = require('pdfkit');
const { canAccessElder } = require('./vitalsController');

async function getAssignedElders(req, res, next) {
  try {
    let elders;

    if (req.user.role === 'caretaker') {
      elders = await db('caretaker_elders as ce')
        .join('elders as e', 'ce.elder_id', 'e.id')
        .join('users as u', 'e.user_id', 'u.id')
        .where('ce.caretaker_id', req.user.id)
        .select('e.*', 'u.name', 'u.email', 'u.phone');
    } else if (req.user.role === 'doctor') {
      elders = await db('doctor_elders as de')
        .join('elders as e', 'de.elder_id', 'e.id')
        .join('users as u', 'e.user_id', 'u.id')
        .where('de.doctor_id', req.user.id)
        .select('e.*', 'u.name', 'u.email', 'u.phone');
    } else if (req.user.role === 'admin') {
      elders = await db('elders as e')
        .join('users as u', 'e.user_id', 'u.id')
        .select('e.*', 'u.name', 'u.email', 'u.phone');
    } else if (req.user.role === 'family') {
      elders = await db('family_access as fa')
        .join('elders as e', 'fa.elder_id', 'e.id')
        .join('users as u', 'e.user_id', 'u.id')
        .where('fa.family_user_id', req.user.id)
        .select('e.*', 'u.name', 'u.email', 'u.phone');
    } else if (req.user.role === 'elder') {
      elders = await db('elders as e')
        .join('users as u', 'e.user_id', 'u.id')
        .where('e.user_id', req.user.id)
        .select('e.*', 'u.name', 'u.email', 'u.phone');
    } else {
      return res.status(403).json({ error: 'Access denied' });
    }

    const enriched = await Promise.all(
      elders.map(async (elder) => {
        const latestVitals = await db('vitals')
          .where('elder_id', elder.id)
          .orderBy('recorded_at', 'desc')
          .first();

        const unresolvedAlerts = await db('alerts')
          .where({ elder_id: elder.id, resolved: false })
          .count('id as count')
          .first();

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const medLogs = await db('medication_logs as ml')
          .join('medications as m', 'ml.medication_id', 'm.id')
          .where('m.elder_id', elder.id)
          .where('ml.log_date', '>=', weekAgo.toISOString().split('T')[0]);

        const taken = medLogs.filter((l) => l.status === 'taken').length;
        const compliance = medLogs.length
          ? Math.round((taken / medLogs.length) * 100)
          : 100;

        return {
          ...elder,
          latestVitals,
          alertCount: parseInt(unresolvedAlerts?.count || 0, 10),
          compliance,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    next(err);
  }
}

async function getHealthTimeline(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const allowed = await canAccessElder(req.user, elderId);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const vitals = await db('vitals')
      .where('elder_id', elderId)
      .orderBy('recorded_at', 'desc')
      .limit(30);

    const activities = await db('activities')
      .where('elder_id', elderId)
      .orderBy('date', 'desc')
      .limit(30);

    const appointments = await db('appointments')
      .where('elder_id', elderId)
      .orderBy('scheduled_at', 'desc')
      .limit(20);

    const alerts = await db('alerts')
      .where('elder_id', elderId)
      .orderBy('triggered_at', 'desc')
      .limit(20);

    const timeline = [
      ...vitals.map((v) => ({ type: 'vitals', data: v, date: v.recorded_at })),
      ...activities.map((a) => ({ type: 'activity', data: a, date: a.date })),
      ...appointments.map((a) => ({ type: 'appointment', data: a, date: a.scheduled_at })),
      ...alerts.map((a) => ({ type: 'alert', data: a, date: a.triggered_at })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(timeline);
  } catch (err) {
    next(err);
  }
}

async function exportHealthReport(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const allowed = await canAccessElder(req.user, elderId);
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const elder = await db('elders as e')
      .join('users as u', 'e.user_id', 'u.id')
      .where('e.id', elderId)
      .select('e.*', 'u.name', 'u.email')
      .first();

    if (!elder) return res.status(404).json({ error: 'Elder not found' });

    const vitals = await db('vitals')
      .where('elder_id', elderId)
      .orderBy('recorded_at', 'desc')
      .limit(20);

    const medications = await db('medications').where('elder_id', elderId);
    const appointments = await db('appointments').where('elder_id', elderId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=health-report-${elder.name.replace(/\s/g, '-')}.pdf`
    );

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);

    doc.fontSize(20).text('ElderCare Monitor - Health Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Patient: ${elder.name}`);
    doc.text(`Age: ${elder.age || 'N/A'} | Blood Group: ${elder.blood_group || 'N/A'}`);
    doc.text(`Email: ${elder.email}`);
    doc.moveDown();

    doc.fontSize(16).text('Recent Vitals');
    doc.fontSize(11);
    vitals.forEach((v) => {
      doc.text(
        `${new Date(v.recorded_at).toLocaleString()} - HR: ${v.heart_rate} | BP: ${v.blood_pressure_sys}/${v.blood_pressure_dia}`
      );
    });
    doc.moveDown();

    doc.fontSize(16).text('Medications');
    doc.fontSize(11);
    medications.forEach((m) => {
      doc.text(`${m.name} - ${m.dosage} (${m.frequency})`);
    });
    doc.moveDown();

    doc.fontSize(16).text('Appointments');
    doc.fontSize(11);
    appointments.forEach((a) => {
      doc.text(
        `${new Date(a.scheduled_at).toLocaleString()} - ${a.status}: ${a.notes || ''}`
      );
    });

    doc.end();
  } catch (err) {
    next(err);
  }
}

async function assignElder(req, res, next) {
  try {
    const { elder_id, caretaker_id, doctor_id } = req.body;

    if (req.user.role === 'caretaker' || caretaker_id) {
      const cid = caretaker_id || req.user.id;
      await db('caretaker_elders')
        .insert({ caretaker_id: cid, elder_id })
        .onConflict(['caretaker_id', 'elder_id'])
        .ignore();
    }

    if (doctor_id) {
      await db('doctor_elders')
        .insert({ doctor_id, elder_id })
        .onConflict(['doctor_id', 'elder_id'])
        .ignore();
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAssignedElders,
  getHealthTimeline,
  exportHealthReport,
  assignElder,
};
