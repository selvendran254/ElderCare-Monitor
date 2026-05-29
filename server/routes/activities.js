const express = require('express');
const { getActivities, addActivity } = require('../controllers/activitiesController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/:elderId', getActivities);
router.post('/:elderId', addActivity);

module.exports = router;
