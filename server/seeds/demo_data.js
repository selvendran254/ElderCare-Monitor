const bcrypt = require('bcryptjs');

const ELDERS = [
  { name: 'Ramasamy Pillai', email: 'elder@demo.com', age: 72, gender: 'male', blood_group: 'O+', conditions: ['diabetes', 'hypertension'], address: '12, Anna Salai, Chennai' },
  { name: 'பாப்பாம்மா', email: 'pappamma@demo.com', age: 68, gender: 'female', blood_group: 'A+', conditions: ['arthritis'], address: '45, T. Nagar, Chennai' },
  { name: 'Murugan', email: 'murugan@demo.com', age: 75, gender: 'male', blood_group: 'B+', conditions: ['hypertension', 'heart disease'], address: '78, Mylapore, Chennai' },
  { name: 'Lakshmiammal', email: 'lakshmi.elder@demo.com', age: 70, gender: 'female', blood_group: 'AB+', conditions: ['diabetes'], address: '23, Adyar, Chennai' },
  { name: 'Subramanian', email: 'subbu@demo.com', age: 80, gender: 'male', blood_group: 'O-', conditions: ['COPD', 'hypertension'], address: '56, Velachery, Chennai' },
  { name: 'Kamala', email: 'kamala@demo.com', age: 65, gender: 'female', blood_group: 'A-', conditions: [], address: '90, Tambaram, Chennai' },
  { name: 'Velu', email: 'velu@demo.com', age: 77, gender: 'male', blood_group: 'B-', conditions: ['diabetes', 'kidney disease'], address: '34, Porur, Chennai' },
  { name: 'Meenakshi', email: 'meenakshi@demo.com', age: 69, gender: 'female', blood_group: 'O+', conditions: ['osteoporosis'], address: '67, Chrompet, Chennai' },
  { name: 'Rajendran', email: 'rajendran@demo.com', age: 74, gender: 'male', blood_group: 'A+', conditions: ['hypertension'], address: '11, Pallavaram, Chennai' },
  { name: 'Saraswathi', email: 'saraswathi@demo.com', age: 71, gender: 'female', blood_group: 'B+', conditions: ['diabetes', 'arthritis'], address: '88, Guindy, Chennai' },
  { name: 'Govindan', email: 'govindan@demo.com', age: 76, gender: 'male', blood_group: 'AB-', conditions: ['heart disease'], address: '19, Ambattur, Chennai' },
  { name: 'Valliammai', email: 'valliammai@demo.com', age: 73, gender: 'female', blood_group: 'O+', conditions: ['hypertension', 'diabetes'], address: '42, Avadi, Chennai' },
];

const CARETAKERS = [
  { name: 'Lakshmi Devi', email: 'caretaker@demo.com', cert: 'GNM Nursing' },
  { name: 'Priya Care', email: 'priya.caretaker@demo.com', cert: 'BSc Nursing' },
  { name: 'Kumar Swamy', email: 'kumar.caretaker@demo.com', cert: 'Home Care Certified' },
  { name: 'Anitha R', email: 'anitha.caretaker@demo.com', cert: 'GNM Nursing' },
  { name: 'Ravi Shankar', email: 'ravi.caretaker@demo.com', cert: 'Elder Care Specialist' },
];

const DOCTORS = [
  { name: 'Dr. Venkatesh', email: 'doctor@demo.com', spec: 'Geriatric Medicine', hospital: 'Apollo Chennai' },
  { name: 'Dr. Priya Menon', email: 'priya.doctor@demo.com', spec: 'Cardiology', hospital: 'Fortis Malar' },
  { name: 'Dr. Karthik', email: 'karthik.doctor@demo.com', spec: 'Endocrinology', hospital: 'MIOT Hospital' },
];

const MEDICINES = [
  { name: 'Metformin', dosage: '500mg', frequency: 'twice daily', type: 'tablet', reason: 'Diabetes' },
  { name: 'Amlodipine', dosage: '5mg', frequency: 'once daily', type: 'tablet', reason: 'Blood Pressure' },
  { name: 'Atorvastatin', dosage: '10mg', frequency: 'once daily', type: 'tablet', reason: 'Cholesterol' },
  { name: 'Aspirin', dosage: '75mg', frequency: 'once daily', type: 'tablet', reason: 'Heart Health' },
  { name: 'Calcium + Vit D', dosage: '1 tab', frequency: 'once daily', type: 'tablet', reason: 'Bone Health' },
  { name: 'Insulin Glargine', dosage: '10 units', frequency: 'once daily', type: 'injection', reason: 'Diabetes' },
];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }

exports.seed = async function (knex) {
  await knex('iot_readings').del();
  await knex('iot_devices').del();
  await knex('shift_handovers').del();
  await knex('health_scores').del();
  await knex('audit_logs').del();
  await knex('alert_rules').del();
  await knex('prescriptions').del();
  await knex('lab_results').del();
  await knex('medication_logs').del();
  await knex('medications').del();
  await knex('vitals').del();
  await knex('activities').del();
  await knex('appointments').del();
  await knex('alerts').del();
  await knex('emergency_contacts').del();
  await knex('family_access').del();
  await knex('caretaker_elders').del();
  await knex('doctor_elders').del();
  await knex('caretaker_profiles').del();
  await knex('doctor_profiles').del();
  await knex('user_preferences').del();
  await knex('push_subscriptions').del();
  await knex('refresh_tokens').del();
  await knex('elders').del();
  await knex('users').del();

  const hash = await bcrypt.hash('password123', 10);

  const [adminUser] = await knex('users').insert({
    name: 'Admin User', email: 'admin@demo.com', password_hash: hash, role: 'admin', phone: '+919800000000',
  }).returning('*');
  await knex('user_preferences').insert({ user_id: adminUser.id });

  const caretakerIds = [];
  for (const c of CARETAKERS) {
    const [u] = await knex('users').insert({
      name: c.name, email: c.email, password_hash: hash, role: 'caretaker', phone: `+9198765${rand(10000, 99999)}`,
    }).returning('*');
    await knex('caretaker_profiles').insert({ user_id: u.id, certification: c.cert, max_elders: 5, shift_start: '08:00', shift_end: '20:00' });
    await knex('user_preferences').insert({ user_id: u.id });
    caretakerIds.push(u.id);
  }

  const doctorIds = [];
  for (const d of DOCTORS) {
    const [u] = await knex('users').insert({
      name: d.name, email: d.email, password_hash: hash, role: 'doctor', phone: `+9198765${rand(10000, 99999)}`,
    }).returning('*');
    await knex('doctor_profiles').insert({ user_id: u.id, specialization: d.spec, hospital_affiliation: d.hospital, license_number: `TN-MED-${rand(10000, 99999)}` });
    await knex('user_preferences').insert({ user_id: u.id });
    doctorIds.push(u.id);
  }

  const [familyUser] = await knex('users').insert({
    name: 'Arun Kumar', email: 'family@demo.com', password_hash: hash, role: 'family', phone: '+919876543299',
  }).returning('*');
  await knex('user_preferences').insert({ user_id: familyUser.id });

  const elderRecords = [];
  for (let i = 0; i < ELDERS.length; i++) {
    const e = ELDERS[i];
    const [u] = await knex('users').insert({
      name: e.name, email: e.email, password_hash: hash, role: 'elder', phone: `+9198765${rand(10000, 99999)}`, preferred_language: e.name.match(/[\u0B80-\u0BFF]/) ? 'ta' : 'en',
    }).returning('*');

    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - e.age);

    const [elder] = await knex('elders').insert({
      user_id: u.id, age: e.age, gender: e.gender, blood_group: e.blood_group,
      emergency_contact: caretakerIds[i % caretakerIds.length] ? 'caretaker@demo.com' : '',
      address: e.address, chronic_conditions: JSON.stringify(e.conditions),
      allergies: JSON.stringify(i % 3 === 0 ? ['penicillin'] : []),
      mobility_status: e.age > 75 ? 'walker' : 'independent',
      cognitive_status: e.age > 78 ? 'mild' : 'normal',
      living_situation: i % 2 === 0 ? 'with family' : 'alone',
      insurance_provider: 'Star Health', weight_kg: rand(55, 85), height_cm: rand(155, 175),
      bmi: rand(22, 28),
    }).returning('*');

    await knex('emergency_contacts').insert([
      { elder_id: elder.id, name: 'Son - Arun', relationship: 'son', phone: '+919876543210', email: 'family@demo.com', priority: 1 },
      { elder_id: elder.id, name: 'Daughter - Priya', relationship: 'daughter', phone: '+919876543211', priority: 2 },
    ]);

    await knex('caretaker_elders').insert({ caretaker_id: caretakerIds[i % caretakerIds.length], elder_id: elder.id });
    if (i % 2 === 0) await knex('caretaker_elders').insert({ caretaker_id: caretakerIds[(i + 1) % caretakerIds.length], elder_id: elder.id }).onConflict().ignore();
    await knex('doctor_elders').insert({ doctor_id: doctorIds[i % doctorIds.length], elder_id: elder.id });
    if (i % 3 === 0) await knex('doctor_elders').insert({ doctor_id: doctorIds[(i + 1) % doctorIds.length], elder_id: elder.id }).onConflict().ignore();

    if (i <= 3) await knex('family_access').insert({ family_user_id: familyUser.id, elder_id: elder.id, relationship: i === 0 ? 'son' : 'relative' }).onConflict().ignore();

    elderRecords.push({ elder, user: u, conditions: e.conditions });
  }

  const defaultRules = [
    { name: 'Low Heart Rate', metric: 'heart_rate', operator: 'lt', threshold: 50, alert_type: 'emergency', message_template: 'Heart rate critically low: {value} bpm' },
    { name: 'High Heart Rate', metric: 'heart_rate', operator: 'gt', threshold: 120, alert_type: 'emergency', message_template: 'Heart rate critically high: {value} bpm' },
    { name: 'High BP', metric: 'blood_pressure_sys', operator: 'gt', threshold: 180, alert_type: 'warning', message_template: 'High BP: {value} mmHg' },
    { name: 'Low SpO2', metric: 'spo2', operator: 'lt', threshold: 92, alert_type: 'emergency', message_template: 'Low SpO2: {value}%' },
    { name: 'High Glucose', metric: 'blood_glucose', operator: 'gt', threshold: 200, alert_type: 'warning', message_template: 'High glucose: {value}' },
    { name: 'Low Steps', metric: 'steps', operator: 'lt', threshold: 500, alert_type: 'info', message_template: 'Low activity: {value} steps' },
  ];
  await knex('alert_rules').insert(defaultRules);

  const now = new Date();
  for (const { elder, conditions } of elderRecords) {
    for (let d = 89; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      date.setHours(rand(7, 20), rand(0, 59), 0, 0);
      const dateStr = date.toISOString().split('T')[0];

      const hr = rand(62, 88) + (conditions.includes('heart disease') ? rand(0, 15) : 0);
      const sys = rand(115, 145) + (conditions.includes('hypertension') ? rand(0, 25) : 0);
      const dia = rand(70, 90);
      const isAbnormal = d < 3 && elder.id <= 3;

      // Morning reading
      await knex('vitals').insert({
        elder_id: elder.id,
        heart_rate: isAbnormal && d === 0 ? rand(125, 135) : hr,
        blood_pressure_sys: isAbnormal && d === 1 ? rand(185, 195) : sys,
        blood_pressure_dia: dia,
        spo2: rand(94, 99),
        temperature: 36 + Math.random() * 1.5,
        blood_glucose: conditions.includes('diabetes') ? rand(110, 180) : rand(90, 120),
        glucose_type: 'fasting',
        respiratory_rate: rand(14, 20),
        pain_level: rand(0, 4),
        mood: pick(['happy', 'calm', 'anxious', 'neutral']),
        hydration_glasses: rand(4, 10),
        recorded_at: new Date(date),
        source: d % 5 === 0 ? 'smartwatch' : 'manual',
      });

      // Evening reading (skip every 3rd day to keep data realistic)
      if (d % 3 !== 0) {
        const eve = new Date(date);
        eve.setHours(rand(18, 21), rand(0, 59), 0, 0);
        await knex('vitals').insert({
          elder_id: elder.id,
          heart_rate: hr + rand(-5, 8),
          blood_pressure_sys: sys + rand(-8, 12),
          blood_pressure_dia: dia + rand(-5, 8),
          spo2: rand(93, 98),
          temperature: 36.2 + Math.random() * 1.2,
          blood_glucose: conditions.includes('diabetes') ? rand(130, 200) : rand(95, 130),
          glucose_type: 'post-meal',
          respiratory_rate: rand(14, 22),
          pain_level: rand(0, 5),
          mood: pick(['happy', 'calm', 'tired', 'neutral']),
          hydration_glasses: rand(6, 12),
          recorded_at: eve,
          source: d % 4 === 0 ? 'smartwatch' : 'manual',
        });
      }

      await knex('activities').insert({
        elder_id: elder.id, date: dateStr,
        steps: rand(1500, 6000), sleep_hours: 5 + Math.random() * 3, meal_count: rand(2, 4),
        water_intake_ml: rand(1000, 2500), exercise_minutes: rand(0, 45),
        outdoor_minutes: rand(0, 60), social_interactions: rand(0, 5),
        calories_burned: rand(1200, 2200), fall_detected: d === 5 && elder.id === 3,
        location: 'home', weather: pick(['sunny', 'cloudy', 'rainy']),
      });
    }

    for (let m = 0; m < rand(4, 6); m++) {
      const med = MEDICINES[(elder.id + m) % MEDICINES.length];
      const [medRec] = await knex('medications').insert({
        elder_id: elder.id, name: med.name, dosage: med.dosage, frequency: med.frequency,
        medicine_type: med.type, food_timing: 'after food', reason: med.reason,
        prescribed_by: 'Dr. Venkatesh', pharmacy: 'Apollo Pharmacy',
        start_date: new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0],
        scheduled_time: m % 2 === 0 ? '08:00:00' : '20:00:00',
        stock_remaining: rand(10, 60),
      }).returning('*');

      for (let d = 29; d >= 0; d--) {
        const logDate = new Date(now);
        logDate.setDate(logDate.getDate() - d);
        await knex('medication_logs').insert({
          medication_id: medRec.id,
          status: Math.random() > 0.15 ? 'taken' : 'missed',
          log_date: logDate.toISOString().split('T')[0],
        });
      }
    }

    for (let a = 0; a < rand(6, 10); a++) {
      const sched = new Date(now);
      sched.setDate(sched.getDate() + rand(-30, 45));
      sched.setHours(rand(9, 17), rand(0, 3) * 15, 0, 0);
      await knex('appointments').insert({
        elder_id: elder.id,
        doctor_id: doctorIds[a % doctorIds.length],
        scheduled_at: sched,
        notes: pick(['Routine checkup', 'Follow-up visit', 'Blood test review', 'Cardiac evaluation', 'Diabetes review', 'Physiotherapy session', 'Eye examination', 'Dental checkup']),
        appointment_type: pick(['checkup', 'follow-up', 'lab review', 'specialist']),
        status: sched < now ? pick(['completed', 'approved', 'completed']) : pick(['pending', 'approved', 'pending']),
        clinical_notes: sched < now ? pick([
          'Patient stable. Continue current medication.',
          'BP slightly elevated. Monitor daily.',
          'Blood sugar under control. Diet advised.',
          'Good progress. Next visit in 3 months.',
          'Mild joint pain reported. Physiotherapy recommended.',
        ]) : null,
      });
    }

    const alertTypes = [
      { type: 'emergency', message: 'Heart rate spike detected — immediate attention needed' },
      { type: 'warning', message: 'Blood pressure above normal range (165/95)' },
      { type: 'info', message: 'Low activity detected today — only 800 steps' },
      { type: 'warning', message: 'Missed morning medication — Metformin' },
      { type: 'warning', message: 'SpO2 dropped below 93%' },
      { type: 'info', message: 'Hydration reminder — only 3 glasses today' },
      { type: 'emergency', message: 'Fall detected by smartwatch sensor' },
      { type: 'warning', message: 'Blood glucose elevated — 210 mg/dL' },
    ];
    for (let a = 0; a < rand(5, 10); a++) {
      const at = new Date(now);
      at.setDate(at.getDate() - rand(0, 25));
      at.setHours(rand(6, 22), rand(0, 59), 0, 0);
      const def = alertTypes[a % alertTypes.length];
      await knex('alerts').insert({
        elder_id: elder.id, type: def.type, message: def.message,
        triggered_at: at, resolved: a % 3 === 0,
      });
    }

    await knex('lab_results').insert([
      { elder_id: elder.id, test_name: 'HbA1c', result_value: String((rand(50, 85) / 10).toFixed(1)), unit: '%', reference_range: '4-6', status: conditions.includes('diabetes') ? 'borderline' : 'normal' },
      { elder_id: elder.id, test_name: 'Total Cholesterol', result_value: String(rand(150, 250)), unit: 'mg/dL', reference_range: '<200', status: rand(0, 1) ? 'normal' : 'borderline' },
      { elder_id: elder.id, test_name: 'Creatinine', result_value: String((rand(70, 120) / 100).toFixed(1)), unit: 'mg/dL', reference_range: '0.7-1.2', status: 'normal' },
      { elder_id: elder.id, test_name: 'Fasting Glucose', result_value: String(rand(90, 180)), unit: 'mg/dL', reference_range: '70-100', status: conditions.includes('diabetes') ? 'high' : 'normal' },
      { elder_id: elder.id, test_name: 'Hemoglobin', result_value: String((rand(110, 150) / 10).toFixed(1)), unit: 'g/dL', reference_range: '12-16', status: 'normal' },
      { elder_id: elder.id, test_name: 'TSH', result_value: String((rand(10, 45) / 10).toFixed(1)), unit: 'mIU/L', reference_range: '0.4-4.0', status: 'normal' },
      { elder_id: elder.id, test_name: 'Vitamin D', result_value: String(rand(15, 45)), unit: 'ng/mL', reference_range: '30-100', status: rand(0, 1) ? 'low' : 'normal' },
    ]);

    for (let p = 0; p < rand(3, 5); p++) {
      const med = MEDICINES[(elder.id + p) % MEDICINES.length];
      await knex('prescriptions').insert({
        elder_id: elder.id, doctor_id: doctorIds[p % doctorIds.length],
        medicine_name: med.name, dosage: med.dosage, frequency: med.frequency,
        duration_days: rand(30, 180),
        instructions: pick(['Take after meals', 'Take before breakfast', 'Take at bedtime', 'Take with plenty of water']),
      });
    }

    for (let h = 0; h < rand(5, 12); h++) {
      const ht = new Date(now);
      ht.setDate(ht.getDate() - rand(0, 14));
      ht.setHours(rand(7, 19), 0, 0, 0);
      await knex('shift_handovers').insert({
        elder_id: elder.id,
        caretaker_id: caretakerIds[elder.id % caretakerIds.length],
        notes: pick([
          'Patient had good appetite today. Took all medications on time.',
          'Slight fatigue observed in the afternoon. Rest recommended.',
          'Blood pressure slightly elevated — monitoring closely.',
          'Family visited today. Patient mood improved significantly.',
          'Completed morning walk. 3200 steps recorded.',
          'Patient complained of mild knee pain. Ice pack applied.',
          'Sleep quality poor last night — only 4 hours. Nap advised.',
          'All vitals within normal range. No concerns.',
        ]),
        handover_at: ht,
      });
    }

    const [device] = await knex('iot_devices').insert({
      elder_id: elder.id, device_type: 'smartwatch', device_name: `Watch-${elder.id}`, device_id: `SW-${elder.id}`,
      battery_level: rand(20, 100), latitude: 13.0827 + Math.random() * 0.05, longitude: 80.2707 + Math.random() * 0.05,
      geofence_radius_m: 500, last_seen: now,
    }).returning('*');

    for (let r = 0; r < 10; r++) {
      const rt = new Date(now);
      rt.setHours(rt.getHours() - r);
      await knex('iot_readings').insert({
        device_id: device.id, elder_id: elder.id, reading_type: 'vitals',
        data: JSON.stringify({ heart_rate: rand(65, 85), steps: rand(100, 2000), battery: rand(20, 100) }),
        recorded_at: rt,
      });
    }

    for (let d = 29; d >= 0; d--) {
      const sd = new Date(now);
      sd.setDate(sd.getDate() - d);
      await knex('health_scores').insert({
        elder_id: elder.id, score_date: sd.toISOString().split('T')[0],
        overall_score: rand(55, 95), cardiac_risk: rand(10, 60), fall_risk: rand(10, 50),
        medication_risk: rand(5, 40), activity_score: rand(40, 90),
      });
    }
  }

  await knex('audit_logs').insert([
    { user_id: adminUser.id, action: 'seed_database', entity_type: 'system', details: JSON.stringify({ elders: ELDERS.length }) },
    { user_id: caretakerIds[0], action: 'login', entity_type: 'user', details: JSON.stringify({ method: 'password' }) },
    { user_id: caretakerIds[0], action: 'view_elder', entity_type: 'elder', details: JSON.stringify({ elder_id: 1 }) },
    { user_id: doctorIds[0], action: 'approve_appointment', entity_type: 'appointment', details: JSON.stringify({ status: 'approved' }) },
    { user_id: adminUser.id, action: 'assign_caretaker', entity_type: 'assignment', details: JSON.stringify({ caretaker: 'Lakshmi Devi' }) },
    { user_id: caretakerIds[1], action: 'add_medication', entity_type: 'medication', details: JSON.stringify({ name: 'Metformin' }) },
    { user_id: doctorIds[1], action: 'add_clinical_notes', entity_type: 'appointment', details: JSON.stringify({ notes: 'Patient stable' }) },
    { user_id: familyUser.id, action: 'login', entity_type: 'user', details: JSON.stringify({ method: 'password' }) },
  ]);

  console.log(`Seeded: ${ELDERS.length} elders, ${CARETAKERS.length} caretakers, ${DOCTORS.length} doctors, 90 days history each`);
};
