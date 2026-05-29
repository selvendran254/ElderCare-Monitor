const db = require('../models/db');
const { canAccessElder } = require('./vitalsController');
const { saveVoiceLog } = require('../services/voice');
const { recordFall, getFallHistory } = require('../services/fallDetection');
const { saveLocation, getLatestLocation, getLocationHistory, getAllElderLocations } = require('../services/gps');
const { createSession, startSession, endSession, getSessionsForElder } = require('../services/video');
const { generatePrediction, getLatestPrediction } = require('../services/aiPrediction');
const { getPillBoxStatus, simulateDose, getOrCreatePillBox, sendWhatsAppAlert } = require('../services/pillBox');
const { getChain, verifyChain, addRecord } = require('../services/blockchain');
const { getHospitals, syncElderToHospital, getSyncHistory, fetchHospitalRecords } = require('../services/hospital');

async function checkAccess(req, elderId) {
  const allowed = await canAccessElder(req.user, elderId);
  if (!allowed && req.user.role !== 'admin') {
    const err = new Error('Access denied');
    err.status = 403;
    throw err;
  }
}

// 1. Voice
async function postVoice(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    await checkAccess(req, elderId);
    const { transcript, language } = req.body;
    const { log, parsed } = await saveVoiceLog(elderId, transcript, language);
    res.json({ log, parsed });
  } catch (err) { next(err); }
}

async function applyVoiceVitals(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    await checkAccess(req, elderId);
    const { transcript, language } = req.body;
    const { parsed } = await saveVoiceLog(elderId, transcript, language);
    if (parsed.heart_rate || parsed.blood_pressure_sys) {
      const [vital] = await db('vitals').insert({
        elder_id: elderId,
        heart_rate: parsed.heart_rate,
        blood_pressure_sys: parsed.blood_pressure_sys,
        blood_pressure_dia: parsed.blood_pressure_dia,
        spo2: parsed.spo2,
        blood_glucose: parsed.blood_glucose,
        temperature: parsed.temperature,
        recorded_by: 'voice',
        source: 'voice_assistant',
      }).returning('*');
      await addRecord(elderId, 'vitals', vital.id, vital);
      const io = req.app.get('io');
      if (io) io.to('caretakers').emit('vitals', { ...vital, elder_id: elderId });
      return res.json({ parsed, vital });
    }
    res.json({ parsed, message: 'No vitals detected in speech' });
  } catch (err) { next(err); }
}

// 2. WhatsApp
async function postWhatsApp(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const { phone, message, language } = req.body;
    const result = await sendWhatsAppAlert(phone, message, language);
    res.json(result);
  } catch (err) { next(err); }
}

// 3. Fall
async function postFall(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    await checkAccess(req, elderId);
    const io = req.app.get('io');
    const event = await recordFall(elderId, req.body, io);
    res.status(201).json(event);
  } catch (err) { next(err); }
}

async function getFalls(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    await checkAccess(req, elderId);
    res.json(await getFallHistory(elderId));
  } catch (err) { next(err); }
}

// 4. GPS
async function postLocation(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    await checkAccess(req, elderId);
    const loc = await saveLocation(elderId, req.body);
    const io = req.app.get('io');
    if (io) io.to('caretakers').emit('location', { ...loc, elder_id: elderId });
    res.status(201).json(loc);
  } catch (err) { next(err); }
}

async function getLocation(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    await checkAccess(req, elderId);
    const latest = await getLatestLocation(elderId);
    const history = await getLocationHistory(elderId, parseInt(req.query.hours || '24', 10));
    res.json({ latest, history });
  } catch (err) { next(err); }
}

async function getAllLocations(req, res, next) {
  try {
    const locations = req.user.role === 'admin'
      ? await Promise.all((await db('elders').select('id as elder_id')).map(async (e) => {
          const loc = await getLatestLocation(e.elder_id);
          return loc ? { ...e, ...loc } : null;
        })).then(r => r.filter(Boolean))
      : await getAllElderLocations(req.user.id);
    res.json(locations);
  } catch (err) { next(err); }
}

// 5. Video
async function postVideoSession(req, res, next) {
  try {
    const { appointmentId, elderId, doctorId } = req.body;
    const session = await createSession({
      appointmentId,
      elderId: elderId || parseInt(req.params.elderId, 10),
      doctorId: doctorId || req.user.id,
    });
    res.status(201).json(session);
  } catch (err) { next(err); }
}

async function getVideoSessions(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    await checkAccess(req, elderId);
    res.json(await getSessionsForElder(elderId));
  } catch (err) { next(err); }
}

async function patchVideoSession(req, res, next) {
  try {
    const action = req.body.action;
    const session = action === 'end'
      ? await endSession(req.params.sessionId)
      : await startSession(req.params.sessionId);
    res.json(session);
  } catch (err) { next(err); }
}

// 7. AI Prediction
async function getPrediction(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    await checkAccess(req, elderId);
    if (req.query.refresh) {
      return res.json(await generatePrediction(elderId));
    }
    res.json(await getLatestPrediction(elderId));
  } catch (err) { next(err); }
}

// 8. Pill Box
async function getPillBox(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    await checkAccess(req, elderId);
    res.json(await getPillBoxStatus(elderId));
  } catch (err) { next(err); }
}

async function postPillBoxEvent(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const box = await getOrCreatePillBox(elderId);
    const event = await simulateDose(box.id, req.body.compartment, req.body.status || 'taken');
    res.status(201).json(event);
  } catch (err) { next(err); }
}

// 9. Blockchain
async function getBlockchain(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    await checkAccess(req, elderId);
    const chain = await getChain(elderId);
    const verification = await verifyChain(elderId);
    res.json({ chain, verification });
  } catch (err) { next(err); }
}

async function postBlockchainRecord(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const record = await addRecord(elderId, req.body.record_type, req.body.record_id, req.body.data);
    res.status(201).json(record);
  } catch (err) { next(err); }
}

// 10. Hospital
async function listHospitals(req, res, next) {
  try {
    res.json(await getHospitals());
  } catch (err) { next(err); }
}

async function syncHospital(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const result = await syncElderToHospital(elderId, parseInt(req.body.hospital_id, 10));
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function getHospitalSyncs(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    res.json(await getSyncHistory(elderId));
  } catch (err) { next(err); }
}

async function getHospitalRecords(req, res, next) {
  try {
    const elderId = parseInt(req.params.elderId, 10);
    const hospitalId = parseInt(req.params.hospitalId, 10);
    res.json(await fetchHospitalRecords(elderId, hospitalId));
  } catch (err) { next(err); }
}

module.exports = {
  postVoice, applyVoiceVitals, postWhatsApp, postFall, getFalls,
  postLocation, getLocation, getAllLocations,
  postVideoSession, getVideoSessions, patchVideoSession,
  getPrediction, getPillBox, postPillBoxEvent,
  getBlockchain, postBlockchainRecord,
  listHospitals, syncHospital, getHospitalSyncs, getHospitalRecords,
};
