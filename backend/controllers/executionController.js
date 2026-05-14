const express = require('express');

const auth = require('../middleware/auth');

const {
  computeExecutionPlan,
  simulateExecution
} = require('../controllers/executionController');

const router = express.Router({
  mergeParams: true
});

router.post(
  '/compute-execution',
  auth,
  computeExecutionPlan
);

router.post(
  '/simulate',
  auth,
  simulateExecution
);

module.exports = router;