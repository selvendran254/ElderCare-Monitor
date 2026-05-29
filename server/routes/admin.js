const express = require('express');
const {
  getUsers, getElders, assignCaretaker, assignDoctor, assignFamily,
  getAuditLogs, getAlertRules, createAlertRule, updateAlertRule,
  createUser, getStats, getEmergencyContacts, addEmergencyContact,
} = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.post('/users', createUser);
router.get('/elders', getElders);
router.post('/assign/caretaker', assignCaretaker);
router.post('/assign/doctor', assignDoctor);
router.post('/assign/family', assignFamily);
router.get('/audit-logs', getAuditLogs);
router.get('/alert-rules', getAlertRules);
router.post('/alert-rules', createAlertRule);
router.put('/alert-rules/:id', updateAlertRule);
router.get('/emergency-contacts/:elderId', getEmergencyContacts);
router.post('/emergency-contacts/:elderId', addEmergencyContact);

module.exports = router;
