const express = require('express');
const { listDevices, createDevice, postReading, listReadings } = require('../controllers/iotController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/:elderId/devices', listDevices);
router.post('/:elderId/devices', createDevice);
router.get('/:elderId/readings', listReadings);
router.post('/devices/:deviceId/readings', postReading);

module.exports = router;
