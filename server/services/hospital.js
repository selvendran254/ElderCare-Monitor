const db = require('../models/db');
const { addRecord } = require('./blockchain');

async function getHospitals() {
  return db('hospital_integrations').where('status', 'active');
}

async function syncElderToHospital(elderId, hospitalId) {
  const hospital = await db('hospital_integrations').where({ id: hospitalId }).first();
  if (!hospital) throw new Error('Hospital not found');

  const elder = await db('elders as e')
    .join('users as u', 'e.user_id', 'u.id')
    .where('e.id', elderId)
    .select('e.*', 'u.name', 'u.email', 'u.phone')
    .first();

  const vitals = await db('vitals').where('elder_id', elderId).orderBy('recorded_at', 'desc').limit(5);
  const medications = await db('medications').where('elder_id', elderId);

  const payload = {
    abdm_id: hospital.abdm_id,
    patient: {
      name: elder.name,
      age: elder.age,
      blood_group: elder.blood_group,
      phone: elder.phone,
      abha_id: `ABHA-${elderId}-${Date.now().toString(36).toUpperCase()}`,
    },
    vitals: vitals.map(v => ({
      heart_rate: v.heart_rate,
      bp: `${v.blood_pressure_sys}/${v.blood_pressure_dia}`,
      recorded_at: v.recorded_at,
    })),
    medications: medications.map(m => ({ name: m.name, dosage: m.dosage })),
    synced_at: new Date().toISOString(),
  };

  const [log] = await db('hospital_sync_logs').insert({
    elder_id: elderId,
    hospital_id: hospitalId,
    sync_type: 'full_health_record',
    status: 'success',
    payload: JSON.stringify(payload),
  }).returning('*');

  await addRecord(elderId, 'hospital_sync', log.id, { hospital: hospital.hospital_name, abha_id: payload.patient.abha_id });

  return { hospital, payload, log };
}

async function getSyncHistory(elderId) {
  return db('hospital_sync_logs as h')
    .join('hospital_integrations as hi', 'h.hospital_id', 'hi.id')
    .where('h.elder_id', elderId)
    .select('h.*', 'hi.hospital_name', 'hi.hospital_code')
    .orderBy('h.synced_at', 'desc');
}

async function fetchHospitalRecords(elderId, hospitalId) {
  const syncs = await getSyncHistory(elderId);
  const hospital = await db('hospital_integrations').where({ id: hospitalId }).first();
  return {
    hospital,
    records: syncs.filter(s => s.hospital_id === hospitalId),
    mock_external_records: [
      { type: 'lab', test: 'CBC', date: new Date().toISOString(), hospital: hospital?.hospital_name },
      { type: 'discharge', summary: 'Routine checkup - stable condition', date: new Date().toISOString() },
    ],
  };
}

module.exports = { getHospitals, syncElderToHospital, getSyncHistory, fetchHospitalRecords };
