const express = require('express');
const auth = require('../middleware/auth');

const {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  getTaskHistory,
  retryTask
} = require('../controllers/taskController');

const router = express.Router({ mergeParams: true });

router.post('/', auth, createTask);

router.get('/', auth, getTasks);

router.put('/:taskId', auth, updateTask);

router.delete('/:taskId', auth, deleteTask);

router.get('/:taskId/history', auth, getTaskHistory);

router.post('/:taskId/retry', auth, retryTask);

module.exports = router;