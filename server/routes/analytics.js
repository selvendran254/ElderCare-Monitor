const express = require('express');
const {
  getElderAnalytics, getHealthScore, exportCsvReport, getMonthlyReport,
  getLabResults, addLabResult, getPrescriptions, addPrescription,
  saveHandover, getHandovers,
} = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/:elderId', getElderAnalytics);
router.get('/:elderId/health-score', getHealthScore);
router.get('/:elderId/export/csv', exportCsvReport);
router.get('/:elderId/export/monthly', getMonthlyReport);
router.get('/:elderId/lab-results', getLabResults);
router.post('/:elderId/lab-results', addLabResult);
router.get('/:elderId/prescriptions', getPrescriptions);
router.post('/:elderId/prescriptions', addPrescription);
router.get('/:elderId/handovers', getHandovers);
router.post('/:elderId/handovers', saveHandover);

module.exports = router;
