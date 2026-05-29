const express = require('express');
const { getVitals, addVitals } = require('../controllers/vitalsController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/:elderId', getVitals);
router.post('/:elderId', addVitals);

module.exports = router;
