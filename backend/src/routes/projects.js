const express = require('express');
const jwt = require('jsonwebtoken');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const router = express.Router();

// Create a new project
router.post('/', auth, async (req, res) => {
  try {
    const project = new Project({
      name: req.body.name,
      owner: req.user.id,
      collaborators: [req.user.id] // Owner is the first collaborator
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate a 30-minute invite token
router.post('/:projectId/invite', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    // Only owner can invite (optional, but good practice)
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to create invites' });
    }

    // Sign a specific token that expires in 30 minutes
    const inviteToken = jwt.sign(
      { projectId: project._id }, 
      process.env.INVITE_SECRET, 
      { expiresIn: '30m' } 
    );
    
    res.json({ inviteToken });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Join project using invite token
router.post('/join', auth, async (req, res) => {
  try {
    const { inviteToken } = req.body;
    
    // Verify token and check expiration automatically
    const decoded = jwt.verify(inviteToken, process.env.INVITE_SECRET);
    
    const project = await Project.findById(decoded.projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // Add user if not already a collaborator
    if (!project.collaborators.includes(req.user.id)) {
      project.collaborators.push(req.user.id);
      await project.save();
    }

    res.json({ message: 'Successfully joined project', project });
  } catch (error) {
    // This catches expired tokens and invalid signatures
    res.status(400).json({ message: 'Invalid or expired invite token' });
  }
});

module.exports = router;