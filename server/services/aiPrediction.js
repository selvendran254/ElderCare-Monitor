const db = require('../models/db');

async function generatePrediction(elderId) {
  const today = new Date();
  const dailyForecast = [];
  let totalRisk = 0;

  for (let d = 0; d < 7; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];

    const weekAgo = new Date(date);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const vitals = await db('vitals').where('elder_id', elderId).where('recorded_at', '>=', weekAgo.toISOString());
    const activities = await db('activities').where('elder_id', elderId).where('date', '>=', weekAgo.toISOString().split('T')[0]);
    const medLogs = await db('medication_logs as ml')
      .join('medications as m', 'ml.medication_id', 'm.id')
      .where('m.elder_id', elderId).where('ml.log_date', '>=', weekAgo.toISOString().split('T')[0]);

    let dayRisk = 20;
    if (vitals.length) {
      const avgHr = vitals.reduce((s, v) => s + (v.heart_rate || 0), 0) / vitals.length;
      const avgSys = vitals.reduce((s, v) => s + (v.blood_pressure_sys || 0), 0) / vitals.length;
      if (avgHr > 100 || avgHr < 55) dayRisk += 25;
      if (avgSys > 160 || avgSys < 95) dayRisk += 25;
    }
    const avgSteps = activities.length ? activities.reduce((s, a) => s + a.steps, 0) / activities.length : 3000;
    if (avgSteps < 1500) dayRisk += 20;
    const compliance = medLogs.length ? medLogs.filter(l => l.status === 'taken').length / medLogs.length : 1;
    if (compliance < 0.7) dayRisk += 20;

    dayRisk = Math.min(100, Math.round(dayRisk + Math.random() * 10));
    totalRisk += dayRisk;

    dailyForecast.push({
      date: dateStr,
      risk_score: dayRisk,
      risk_level: dayRisk >= 70 ? 'high' : dayRisk >= 40 ? 'medium' : 'low',
      factors: [
        avgSteps < 1500 ? 'Low activity trend' : null,
        compliance < 0.7 ? 'Medication non-compliance' : null,
      ].filter(Boolean),
    });
  }

  const avgRisk = Math.round(totalRisk / 7);
  const riskLevel = avgRisk >= 70 ? 'high' : avgRisk >= 40 ? 'medium' : 'low';
  const summary = riskLevel === 'high'
    ? 'High health risk predicted for next 7 days. Close monitoring recommended.'
    : riskLevel === 'medium'
      ? 'Moderate risk. Maintain medication schedule and daily vitals.'
      : 'Low risk. Continue current care plan.';

  const prediction = {
    elder_id: elderId,
    prediction_date: today.toISOString().split('T')[0],
    risk_score: avgRisk,
    risk_level: riskLevel,
    summary,
    daily_forecast: JSON.stringify(dailyForecast),
  };

  await db('ai_predictions').insert(prediction).onConflict(['elder_id', 'prediction_date']).merge(prediction);
  return { ...prediction, daily_forecast: dailyForecast };
}

async function getLatestPrediction(elderId) {
  const p = await db('ai_predictions').where('elder_id', elderId).orderBy('prediction_date', 'desc').first();
  if (!p) return generatePrediction(elderId);
  return { ...p, daily_forecast: typeof p.daily_forecast === 'string' ? JSON.parse(p.daily_forecast) : p.daily_forecast };
}

module.exports = { generatePrediction, getLatestPrediction };
