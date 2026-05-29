const express = require('express');
const { getAlerts, resolveAlert, triggerSOSAlert } = require('../controllers/alertsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/:elderId', getAlerts);
router.post('/:elderId/sos', triggerSOSAlert);
router.put('/:id/resolve', resolveAlert);

module.exports = router;
