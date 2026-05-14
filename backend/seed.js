const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB. Clearing old data...');
    
    // Clear existing data for a fresh start
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    // 1. Create a dummy user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    const user = await User.create({ name: 'Anish', email: 'test@esmagico.com', password: hashedPassword });

    // 2. Create a project
    const project = await Project.create({
      name: 'Es Magico Assessment Phase 1',
      owner: user._id,
      collaborators: [user._id]
    });

    // 3. Create some tasks to demonstrate dependencies
    const task1 = await Task.create({
      projectId: project._id,
      title: 'Design Database Schema',
      priority: 5,
      estimatedHours: 2,
      status: 'Completed'
    });

    const task2 = await Task.create({
      projectId: project._id,
      title: 'Build API Routes',
      priority: 4,
      estimatedHours: 4,
      dependencies: [task1._id], // Depends on Task 1
      status: 'Pending'
    });

    const task3 = await Task.create({
      projectId: project._id,
      title: 'Connect React Frontend',
      priority: 3,
      estimatedHours: 3,
      dependencies: [task2._id], // Depends on Task 2
      status: 'Pending'
    });

    console.log('\n✅ Database Seeded Successfully!');
    console.log('=============================================');
    console.log(`🔥 COPY THIS PROJECT ID: "${project._id}"`);
    console.log('=============================================\n');

    process.exit();
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase() 