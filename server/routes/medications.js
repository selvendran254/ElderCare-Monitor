const express = require('express');
const {
  getMedications,
  addMedication,
  logMedication,
  getCompliance,
} = require('../controllers/medicationsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/:elderId/compliance', getCompliance);
router.get('/:elderId', getMedications);
router.post('/:elderId', addMedication);
router.post('/log/:medId', logMedication);

module.exports = router;
