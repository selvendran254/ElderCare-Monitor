const db = require('../models/db');

async function calculateHealthScore(elderId, date) {
  const dateStr = date || new Date().toISOString().split('T')[0];
  const weekAgo = new Date(dateStr);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStart = weekAgo.toISOString().split('T')[0];

  const vitals = await db('vitals').where('elder_id', elderId).where('recorded_at', '>=', weekStart).orderBy('recorded_at', 'desc');
  const activities = await db('activities').where('elder_id', elderId).where('date', '>=', weekStart);
  const medLogs = await db('medication_logs as ml')
    .join('medications as m', 'ml.medication_id', 'm.id')
    .where('m.elder_id', elderId).where('ml.log_date', '>=', weekStart);

  let cardiacRisk = 20;
  let fallRisk = 20;
  let medicationRisk = 20;
  let activityScore = 80;

  if (vitals.length) {
    const latest = vitals[0];
    if (latest.heart_rate < 50 || latest.heart_rate > 120) cardiacRisk = 80;
    else if (latest.heart_rate < 60 || latest.heart_rate > 100) cardiacRisk = 50;
    else cardiacRisk = 15;

    if (latest.blood_pressure_sys > 180 || latest.blood_pressure_sys < 90) cardiacRisk = Math.max(cardiacRisk, 70);
    if (latest.spo2 && latest.spo2 < 92) cardiacRisk = 90;
  }

  const falls = activities.filter((a) => a.fall_detected).length;
  fallRisk = falls > 0 ? 85 : activities.some((a) => a.steps < 1000) ? 55 : 20;

  const taken = medLogs.filter((l) => l.status === 'taken').length;
  const total = medLogs.length || 1;
  medicationRisk = Math.round(100 - (taken / total) * 100);

  const avgSteps = activities.length ? activities.reduce((s, a) => s + (a.steps || 0), 0) / activities.length : 0;
  activityScore = Math.min(100, Math.round((avgSteps / 5000) * 100));

  const overall = Math.round(
    (100 - cardiacRisk) * 0.3 +
    (100 - fallRisk) * 0.25 +
    (100 - medicationRisk) * 0.25 +
    activityScore * 0.2
  );

  const score = {
    elder_id: elderId,
    score_date: dateStr,
    overall_score: overall,
    cardiac_risk: cardiacRisk,
    fall_risk: fallRisk,
    medication_risk: medicationRisk,
    activity_score: activityScore,
  };

  await db('health_scores').insert(score).onConflict(['elder_id', 'score_date']).merge();
  return score;
}

async function getAnalytics(elderId, days = 30) {
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startStr = start.toISOString().split('T')[0];

  const vitals = await db('vitals').where('elder_id', elderId).where('recorded_at', '>=', start);
  const activities = await db('activities').where('elder_id', elderId).where('date', '>=', startStr);
  const scores = await db('health_scores').where('elder_id', elderId).where('score_date', '>=', startStr).orderBy('score_date');

  const medLogs = await db('medication_logs as ml')
    .join('medications as m', 'ml.medication_id', 'm.id')
    .where('m.elder_id', elderId).where('ml.log_date', '>=', startStr);

  const avgHR = vitals.length
    ? Math.round(vitals.filter((v) => v.heart_rate != null).reduce((s, v) => s + v.heart_rate, 0) / (vitals.filter((v) => v.heart_rate != null).length || 1))
    : null;
  const avgBP = vitals.length
    ? Math.round(vitals.filter((v) => v.blood_pressure_sys != null).reduce((s, v) => s + v.blood_pressure_sys, 0) / (vitals.filter((v) => v.blood_pressure_sys != null).length || 1))
    : null;
  const avgSteps = activities.length ? Math.round(activities.reduce((s, a) => s + a.steps, 0) / activities.length) : 0;
  const compliance = medLogs.length ? Math.round((medLogs.filter((l) => l.status === 'taken').length / medLogs.length) * 100) : 100;

  const currentScore = scores.length ? scores[scores.length - 1] : await calculateHealthScore(elderId);

  return {
    summary: { avgHR, avgBP, avgSteps, compliance, healthScore: currentScore.overall_score },
    vitalsTrend: vitals,
    activityTrend: activities,
    healthScores: scores,
    riskBreakdown: {
      cardiac: currentScore.cardiac_risk,
      fall: currentScore.fall_risk,
      medication: currentScore.medication_risk,
      activity: currentScore.activity_score,
    },
  };
}

async function exportCsv(elderId) {
  const elder = await db('elders as e').join('users as u', 'e.user_id', 'u.id').where('e.id', elderId).select('u.name').first();
  const vitals = await db('vitals').where('elder_id', elderId).orderBy('recorded_at', 'desc').limit(100);
  const header = 'Date,Heart Rate,Systolic BP,Diastolic BP,SpO2,Glucose,Temperature\n';
  const rows = vitals.map((v) =>
    `${new Date(v.recorded_at).toISOString()},${v.heart_rate},${v.blood_pressure_sys},${v.blood_pressure_dia},${v.spo2 || ''},${v.blood_glucose || ''},${v.temperature || ''}`
  ).join('\n');
  return { filename: `vitals-${elder.name.replace(/\s/g, '-')}.csv`, content: header + rows };
}

module.exports = { calculateHealthScore, getAnalytics, exportCsv };
