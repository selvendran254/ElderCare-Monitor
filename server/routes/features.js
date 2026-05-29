const express = require('express');
const ctrl = require('../controllers/featuresController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// 1. Tamil Voice Assistant
router.post('/voice/:elderId', ctrl.postVoice);
router.post('/voice/:elderId/apply', ctrl.applyVoiceVitals);

// 2. WhatsApp Alerts
router.post('/whatsapp/:elderId', ctrl.postWhatsApp);

// 3. Fall Detection
router.post('/fall/:elderId', ctrl.postFall);
router.get('/fall/:elderId', ctrl.getFalls);

// 4. GPS / Live Map
router.post('/gps/:elderId', ctrl.postLocation);
router.get('/gps/:elderId', ctrl.getLocation);
router.get('/gps', ctrl.getAllLocations);

// 5. Telemedicine Video
router.post('/video/:elderId', ctrl.postVideoSession);
router.get('/video/:elderId', ctrl.getVideoSessions);
router.patch('/video/session/:sessionId', ctrl.patchVideoSession);

// 7. AI Health Prediction
router.get('/ai-prediction/:elderId', ctrl.getPrediction);

// 8. Smart Pill Box
router.get('/pillbox/:elderId', ctrl.getPillBox);
router.post('/pillbox/:elderId/event', ctrl.postPillBoxEvent);

// 9. Blockchain Records
router.get('/blockchain/:elderId', ctrl.getBlockchain);
router.post('/blockchain/:elderId', ctrl.postBlockchainRecord);

// 10. Government Hospital Integration
router.get('/hospitals', ctrl.listHospitals);
router.post('/hospitals/:elderId/sync', ctrl.syncHospital);
router.get('/hospitals/:elderId/sync-history', ctrl.getHospitalSyncs);
router.get('/hospitals/:elderId/:hospitalId/records', ctrl.getHospitalRecords);

module.exports = router;
