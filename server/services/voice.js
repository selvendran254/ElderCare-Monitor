const db = require('../models/db');

function parseVoiceTranscript(transcript, lang = 'en') {
  const text = (transcript || '').toLowerCase();
  const parsed = { mood: 'neutral' };

  const hrMatch = text.match(/(?:heart rate|heart|hr|இதய|துடிப்ப)[^\d]*(\d{2,3})/i) || text.match(/(\d{2,3})\s*(?:bpm|beats)/i);
  if (hrMatch) parsed.heart_rate = parseInt(hrMatch[1], 10);

  const bpMatch = text.match(/(\d{2,3})\s*[\/by]\s*(\d{2,3})/) || text.match(/(?:bp|blood pressure|இரத்த)[^\d]*(\d{2,3})[^\d]+(\d{2,3})/i);
  if (bpMatch) {
    parsed.blood_pressure_sys = parseInt(bpMatch[1], 10);
    parsed.blood_pressure_dia = parseInt(bpMatch[2], 10);
  }

  const spo2Match = text.match(/(?:spo2|oxygen|ஆக்ஸிஜன)[^\d]*(\d{2,3})/i);
  if (spo2Match) parsed.spo2 = parseInt(spo2Match[1], 10);

  const glucoseMatch = text.match(/(?:glucose|sugar|சர்க்கரை)[^\d]*(\d{2,3})/i);
  if (glucoseMatch) parsed.blood_glucose = parseInt(glucoseMatch[1], 10);

  const tempMatch = text.match(/(?:temperature|temp|வெப்ப)[^\d]*(\d{2}(?:\.\d)?)/i);
  if (tempMatch) parsed.temperature = parseFloat(tempMatch[1]);

  const stepsMatch = text.match(/(?:steps|படிகள)[^\d]*(\d+)/i);
  if (stepsMatch) parsed.steps = parseInt(stepsMatch[1], 10);

  if (lang === 'ta' || /[\u0B80-\u0BFF]/.test(transcript)) {
    parsed.language = 'ta';
  }

  return parsed;
}

async function saveVoiceLog(elderId, transcript, language) {
  const parsed = parseVoiceTranscript(transcript, language);
  const [log] = await db('voice_logs').insert({
    elder_id: elderId,
    transcript,
    language: language || parsed.language || 'en',
    parsed_data: JSON.stringify(parsed),
  }).returning('*');
  return { log, parsed };
}

module.exports = { parseVoiceTranscript, saveVoiceLog };
