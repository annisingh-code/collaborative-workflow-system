const jwt = require('jsonwebtoken');

const Project = require('../models/Project');

// CREATE PROJECT
exports.createProject = async (
    req,
    res
) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({
                message:
                    'Project name is required'
            });
        }

        const project = new Project({
            name,
            owner: req.user.id,
            collaborators: [req.user.id]
        });

        await project.save();

        res.status(201).json(project);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
};

// GENERATE INVITE TOKEN
exports.generateInvite = async (
    req,
    res
) => {
    try {
        const project = await Project.findById(
            req.params.projectId
        );

        if (!project) {
            return res.status(404).json({
                message: 'Project not found'
            });
        }

        // Only owner can create invite
        if (
            project.owner.toString() !==
            req.user.id
        ) {
            return res.status(403).json({
                message:
                    'Not authorized to create invites'
            });
        }

        const inviteToken = jwt.sign(
            {
                projectId: project._id
            },
            process.env.INVITE_SECRET,
            {
                expiresIn: '30m'
            }
        );

        res.json({ inviteToken });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: 'Server error'
        });
    }
};

// JOIN PROJECT
exports.joinProject = async (
    req,
    res
) => {
    try {
        const { inviteToken } = req.body;

        if (!inviteToken) {
            return res.status(400).json({
                message:
                    'Invite token is required'
            });
        }

        // Verify token
        const decoded = jwt.verify(
            inviteToken,
            process.env.INVITE_SECRET
        );

        const project = await Project.findById(
            decoded.projectId
        );

        if (!project) {
            return res.status(404).json({
                message: 'Project not found'
            });
        }

        // Add collaborator only once
        const alreadyJoined =
            project.collaborators.includes(
                req.user.id
            );

        if (!alreadyJoined) {
            project.collaborators.push(
                req.user.id
            );

            await project.save();
        }

        res.json({
            message:
                'Successfully joined project',
            project
        });
    } catch (error) {
        console.error(error);

        res.status(400).json({
            message:
                'Invalid or expired invite token'
        });
    }
};

// GET USER PROJECTS
exports.getProjects = async (
    req,
    res
) => {
    try {
        const projects =
            await Project.find({
                collaborators: req.user.id
            });

        res.json(projects);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message:
                'Error fetching projects'
        });
    }
};