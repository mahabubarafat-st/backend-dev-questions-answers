const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Middleware to check admin access
router.use(auth, adminAuth);

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ subscription: 'premium' });
    const totalTransactions = await Transaction.countDocuments();
    const totalRevenue = await Transaction.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    // Get recent transactions
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email');

    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email subscription createdAt');

    res.json({
      userStats: {
        total: totalUsers,
        premium: premiumUsers,
        conversionRate: totalUsers > 0 ? (premiumUsers / totalUsers * 100).toFixed(2) : 0
      },
      financialStats: {
        totalTransactions,
        revenue,
        averageRevenue: totalTransactions > 0 ? (revenue / totalTransactions).toFixed(2) : 0
      },
      recentTransactions,
      recentUsers
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user details
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's transactions
    const transactions = await Transaction.find({ userId: user._id });
    
    res.json({
      user,
      transactions
    });
  } catch (error) {
    console.error('Admin user details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/users/:userId', async (req, res) => {
  try {
    const { name, email, role, subscription } = req.body;
    
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (subscription) {
      user.subscription = subscription;
      if (subscription === 'premium' && !user.subscriptionDate) {
        user.subscriptionDate = new Date();
      }
    }
    
    await user.save();
    
    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscription: user.subscription
      }
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course content for editing
router.get('/course', async (req, res) => {
  try {
    const course = await Course.findOne({ isActive: true });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('Admin course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update course details
router.put('/course', async (req, res) => {
  try {
    const { title, description, price, currency } = req.body;
    
    const course = await Course.findOne({ isActive: true });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Update fields
    if (title) course.title = title;
    if (description) course.description = description;
    if (price) course.price = price;
    if (currency) course.currency = currency;
    
    await course.save();
    
    res.json({
      message: 'Course updated successfully',
      course: {
        id: course._id,
        title: course.title,
        description: course.description,
        price: course.price,
        currency: course.currency
      }
    });
  } catch (error) {
    console.error('Admin update course error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new section
router.post('/sections', async (req, res) => {
  try {
    const { title, description, icon, order } = req.body;
    
    const course = await Course.findOne({ isActive: true });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Create section ID
    const sectionId = title.toLowerCase().replace(/\s+/g, '-');
    
    // Add new section
    course.sections.push({
      id: sectionId,
      title,
      description,
      icon,
      order: order || course.sections.length + 1,
      questions: [],
      freeQuestionsCount: 1
    });
    
    await course.save();
    
    res.status(201).json({
      message: 'Section added successfully',
      section: course.sections[course.sections.length - 1]
    });
  } catch (error) {
    console.error('Admin add section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a section
router.put('/sections/:sectionId', async (req, res) => {
  try {
    const { title, description, icon, order, freeQuestionsCount } = req.body;
    
    const course = await Course.findOne({ isActive: true });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Find section
    const sectionIndex = course.sections.findIndex(s => s.id === req.params.sectionId);
    
    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    // Update fields
    if (title) course.sections[sectionIndex].title = title;
    if (description) course.sections[sectionIndex].description = description;
    if (icon) course.sections[sectionIndex].icon = icon;
    if (order) course.sections[sectionIndex].order = order;
    if (freeQuestionsCount !== undefined) {
      course.sections[sectionIndex].freeQuestionsCount = freeQuestionsCount;
    }
    
    await course.save();
    
    res.json({
      message: 'Section updated successfully',
      section: course.sections[sectionIndex]
    });
  } catch (error) {
    console.error('Admin update section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a section
router.delete('/sections/:sectionId', async (req, res) => {
  try {
    const course = await Course.findOne({ isActive: true });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Find section
    const sectionIndex = course.sections.findIndex(s => s.id === req.params.sectionId);
    
    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    // Remove section
    course.sections.splice(sectionIndex, 1);
    
    await course.save();
    
    res.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Admin delete section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a question to a section
router.post('/sections/:sectionId/questions', async (req, res) => {
  try {
    const { title, question, answer, difficulty, tags, codeExample, resources, isFree } = req.body;
    
    const course = await Course.findOne({ isActive: true });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Find section
    const sectionIndex = course.sections.findIndex(s => s.id === req.params.sectionId);
    
    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    // Create question ID
    const questionId = title.toLowerCase().replace(/\s+/g, '-');
    
    // Add new question
    course.sections[sectionIndex].questions.push({
      id: questionId,
      title,
      question,
      answer,
      difficulty: difficulty || 'intermediate',
      tags: tags || [],
      codeExample,
      resources: resources || [],
      isFree: isFree || false
    });
    
    await course.save();
    
    res.status(201).json({
      message: 'Question added successfully',
      question: course.sections[sectionIndex].questions[course.sections[sectionIndex].questions.length - 1]
    });
  } catch (error) {
    console.error('Admin add question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a question
router.put('/sections/:sectionId/questions/:questionId', async (req, res) => {
  try {
    const { title, question, answer, difficulty, tags, codeExample, resources, isFree } = req.body;
    
    const course = await Course.findOne({ isActive: true });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Find section
    const sectionIndex = course.sections.findIndex(s => s.id === req.params.sectionId);
    
    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    // Find question
    const questionIndex = course.sections[sectionIndex].questions.findIndex(q => q.id === req.params.questionId);
    
    if (questionIndex === -1) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Update fields
    if (title) course.sections[sectionIndex].questions[questionIndex].title = title;
    if (question) course.sections[sectionIndex].questions[questionIndex].question = question;
    if (answer) course.sections[sectionIndex].questions[questionIndex].answer = answer;
    if (difficulty) course.sections[sectionIndex].questions[questionIndex].difficulty = difficulty;
    if (tags) course.sections[sectionIndex].questions[questionIndex].tags = tags;
    if (codeExample !== undefined) course.sections[sectionIndex].questions[questionIndex].codeExample = codeExample;
    if (resources) course.sections[sectionIndex].questions[questionIndex].resources = resources;
    if (isFree !== undefined) course.sections[sectionIndex].questions[questionIndex].isFree = isFree;
    
    await course.save();
    
    res.json({
      message: 'Question updated successfully',
      question: course.sections[sectionIndex].questions[questionIndex]
    });
  } catch (error) {
    console.error('Admin update question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a question
router.delete('/sections/:sectionId/questions/:questionId', async (req, res) => {
  try {
    const course = await Course.findOne({ isActive: true });
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Find section
    const sectionIndex = course.sections.findIndex(s => s.id === req.params.sectionId);
    
    if (sectionIndex === -1) {
      return res.status(404).json({ message: 'Section not found' });
    }
    
    // Find question
    const questionIndex = course.sections[sectionIndex].questions.findIndex(q => q.id === req.params.questionId);
    
    if (questionIndex === -1) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    // Remove question
    course.sections[sectionIndex].questions.splice(questionIndex, 1);
    
    await course.save();
    
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Admin delete question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all transactions
router.get('/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name email');
    
    res.json(transactions);
  } catch (error) {
    console.error('Admin transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;