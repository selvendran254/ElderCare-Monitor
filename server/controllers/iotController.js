const { getDevices, registerDevice, recordReading, getReadings } = require('../services/iot');

async function listDevices(req, res, next) {
  try {
    res.json(await getDevices(parseInt(req.params.elderId, 10)));
  } catch (err) { next(err); }
}

async function createDevice(req, res, next) {
  try {
    const device = await registerDevice(parseInt(req.params.elderId, 10), req.body);
    res.status(201).json(device);
  } catch (err) { next(err); }
}

async function postReading(req, res, next) {
  try {
    const io = req.app.get('io');
    const reading = await recordReading(parseInt(req.params.deviceId, 10), req.body, io);
    res.status(201).json(reading);
  } catch (err) { next(err); }
}

async function listReadings(req, res, next) {
  try {
    res.json(await getReadings(parseInt(req.params.elderId, 10)));
  } catch (err) { next(err); }
}

module.exports = { listDevices, createDevice, postReading, listReadings };
