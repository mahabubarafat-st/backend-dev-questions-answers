const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get course overview (public)
router.get('/overview', async (req, res) => {
  try {
    const course = await Course.findOne({ isActive: true });
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Return only basic info and section overviews
    const overview = {
      title: course.title,
      description: course.description,
      price: course.price,
      currency: course.currency,
      totalQuestions: course.totalQuestions,
      totalFreeQuestions: course.totalFreeQuestions,
      sections: course.sections.map(section => ({
        id: section.id,
        title: section.title,
        description: section.description,
        icon: section.icon,
        questionsCount: section.questions.length,
        freeQuestionsCount: section.freeQuestionsCount
      }))
    };

    res.json(overview);
  } catch (error) {
    console.error('Course overview error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get course content (requires auth)
router.get('/content', auth, async (req, res) => {
  try {
    const course = await Course.findOne({ isActive: true });
    const user = await User.findById(req.user.userId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isPremium = user.subscription === 'premium';
    
    // Filter content based on subscription
    const filteredSections = course.sections.map(section => {
      let availableQuestions;
      
      if (isPremium) {
        // Premium users get all questions
        availableQuestions = section.questions;
      } else {
        // Free users get only the first question(s) marked as free
        availableQuestions = section.questions
          .filter(q => q.isFree)
          .slice(0, section.freeQuestionsCount);
      }

      return {
        ...section.toObject(),
        questions: availableQuestions,
        totalQuestions: section.questions.length,
        availableQuestions: availableQuestions.length
      };
    });

    res.json({
      ...course.toObject(),
      sections: filteredSections,
      userSubscription: user.subscription,
      userProgress: user.progress
    });
  } catch (error) {
    console.error('Course content error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific section
router.get('/section/:sectionId', auth, async (req, res) => {
  try {
    const { sectionId } = req.params;
    const course = await Course.findOne({ isActive: true });
    const user = await User.findById(req.user.userId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const section = course.sections.find(s => s.id === sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const isPremium = user.subscription === 'premium';
    let availableQuestions;

    if (isPremium) {
      availableQuestions = section.questions;
    } else {
      availableQuestions = section.questions
        .filter(q => q.isFree)
        .slice(0, section.freeQuestionsCount);
    }

    res.json({
      ...section.toObject(),
      questions: availableQuestions,
      totalQuestions: section.questions.length,
      availableQuestions: availableQuestions.length,
      userSubscription: user.subscription
    });
  } catch (error) {
    console.error('Section error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific question
router.get('/question/:sectionId/:questionId', auth, async (req, res) => {
  try {
    const { sectionId, questionId } = req.params;
    const course = await Course.findOne({ isActive: true });
    const user = await User.findById(req.user.userId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const section = course.sections.find(s => s.id === sectionId);
    if (!section) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const question = section.questions.find(q => q.id === questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const isPremium = user.subscription === 'premium';
    
    // Check if user has access to this question
    if (!isPremium && !question.isFree) {
      return res.status(403).json({ 
        message: 'Premium subscription required',
        requiresPremium: true 
      });
    }

    res.json({
      ...question.toObject(),
      userSubscription: user.subscription
    });
  } catch (error) {
    console.error('Question error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;