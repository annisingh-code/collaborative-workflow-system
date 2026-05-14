const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { name, email, password } =
      req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          'Password must be at least 6 characters'
      });
    }

    // Existing user check
    let user = await User.findOne({
      email
    });

    if (user) {
      return res.status(400).json({
        message:
          'User already registered'
      });
    }

    // Password hashing
    const salt = await bcrypt.genSalt(10);

    const hashedPassword =
      await bcrypt.hash(password, salt);

    // Create user
    user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Server error'
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } =
      req.body;

    // Find user
    const user = await User.findOne({
      email
    });

    if (!user) {
      return res.status(400).json({
        message:
          'Invalid email or password'
      });
    }

    // Compare password
    const validPassword =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!validPassword) {
      return res.status(400).json({
        message:
          'Invalid email or password'
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Server error'
    });
  }
};