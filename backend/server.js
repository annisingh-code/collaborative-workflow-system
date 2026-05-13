const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes (We will create these next)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));



// Nest tasks under projects: /api/projects/:projectId/tasks
app.use('/api/projects/:projectId/tasks', require('./routes/tasks'));
// Add the execution engine route
app.use('/api/projects/:projectId', require('./routes/execution'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));