const express = require('express');
const {
  getAppointments,
  createAppointment,
  updateAppointment,
} = require('../controllers/appointmentsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/:elderId', getAppointments);
router.post('/', createAppointment);
router.put('/:id', updateAppointment);

module.exports = router;
