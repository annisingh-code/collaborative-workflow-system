const express = require('express');

const auth = require('../middleware/auth');

const {
  createProject,
  generateInvite,
  joinProject,
  getProjects
} = require('../controllers/projectController');

const router = express.Router();

router.post('/', auth, createProject);

router.post(
  '/:projectId/invite',
  auth,
  generateInvite
);

router.post('/join', auth, joinProject);

router.get('/', auth, getProjects);

module.exports = router;