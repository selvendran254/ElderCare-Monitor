const db = require('../models/db');
const { canAccessElder } = require('./vitalsController');
const { getAnalytics, calculateHealthScore, exportCsv } = require('../services/analytics');
const PDFDocument = require('pdfkit');

async function getElderAnalytics(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const allowed = await canAccessElder(req.user, elderId);
    if (!allowed && req.user.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    const days = parseInt(req.query.days || '30', 10);
    const data = await getAnalytics(elderId, days);
    res.json(data);
  } catch (err) { next(err); }
}

async function getHealthScore(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const score = await calculateHealthScore(elderId);
    res.json(score);
  } catch (err) { next(err); }
}

async function exportCsvReport(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const { filename, content } = await exportCsv(elderId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(content);
  } catch (err) { next(err); }
}

async function getMonthlyReport(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const elder = await db('elders as e').join('users as u', 'e.user_id', 'u.id').where('e.id', elderId).select('e.*', 'u.name', 'u.email').first();
    const analytics = await getAnalytics(elderId, 30);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=monthly-report-${elder.name.replace(/\s/g, '-')}.pdf`);

    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    doc.fontSize(20).text('ElderCare Monitor - Monthly Health Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Patient: ${elder.name} | Age: ${elder.age} | Blood Group: ${elder.blood_group}`);
    doc.text(`Health Score: ${analytics.summary.healthScore}/100 | Compliance: ${analytics.summary.compliance}%`);
    doc.moveDown();
    doc.fontSize(16).text('Risk Breakdown');
    doc.fontSize(11);
    Object.entries(analytics.riskBreakdown).forEach(([k, v]) => doc.text(`${k}: ${v}%`));
    doc.moveDown();
    doc.fontSize(16).text('30-Day Summary');
    doc.fontSize(11);
    doc.text(`Avg Heart Rate: ${analytics.summary.avgHR || 'N/A'} bpm`);
    doc.text(`Avg BP Systolic: ${analytics.summary.avgBP || 'N/A'} mmHg`);
    doc.text(`Avg Daily Steps: ${analytics.summary.avgSteps}`);
    doc.end();
  } catch (err) { next(err); }
}

async function getLabResults(req, res, next) {
  try {
    const results = await db('lab_results').where('elder_id', req.params.elderId).orderBy('tested_at', 'desc');
    res.json(results);
  } catch (err) { next(err); }
}

async function addLabResult(req, res, next) {
  try {
    const [result] = await db('lab_results').insert({ elder_id: req.params.elderId, ...req.body }).returning('*');
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function getPrescriptions(req, res, next) {
  try {
    const rx = await db('prescriptions').where('elder_id', req.params.elderId).orderBy('prescribed_at', 'desc');
    res.json(rx);
  } catch (err) { next(err); }
}

async function addPrescription(req, res, next) {
  try {
    const [rx] = await db('prescriptions').insert({
      elder_id: req.params.elderId,
      doctor_id: req.user.id,
      ...req.body,
    }).returning('*');
    res.status(201).json(rx);
  } catch (err) { next(err); }
}

async function saveHandover(req, res, next) {
  try {
    const [h] = await db('shift_handovers').insert({
      caretaker_id: req.user.id,
      ...req.body,
    }).returning('*');
    res.status(201).json(h);
  } catch (err) { next(err); }
}

async function getHandovers(req, res, next) {
  try {
    const h = await db('shift_handovers').where('elder_id', req.params.elderId).orderBy('handover_at', 'desc').limit(20);
    res.json(h);
  } catch (err) { next(err); }
}

module.exports = {
  getElderAnalytics, getHealthScore, exportCsvReport, getMonthlyReport,
  getLabResults, addLabResult, getPrescriptions, addPrescription,
  saveHandover, getHandovers,
};
