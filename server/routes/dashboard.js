const express = require('express');
const {
  getAssignedElders,
  getHealthTimeline,
  exportHealthReport,
  assignElder,
} = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');
const { saveSubscription } = require('../services/push');

const router = express.Router();

router.use(authenticate);

router.get('/elders', getAssignedElders);
router.get('/timeline/:elderId', authorize('doctor', 'caretaker'), getHealthTimeline);
router.get('/report/:elderId', authorize('doctor'), exportHealthReport);
router.post('/assign', assignElder);
router.post('/push-subscribe', async (req, res, next) => {
  try {
    await saveSubscription(req.user.id, req.body.subscription);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
