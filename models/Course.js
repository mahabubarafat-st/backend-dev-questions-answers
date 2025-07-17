const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  tags: [String],
  codeExample: {
    type: String
  },
  resources: [String],
  isFree: {
    type: Boolean,
    default: false
  }
});

const sectionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String
  },
  order: {
    type: Number,
    required: true
  },
  questions: [questionSchema],
  freeQuestionsCount: {
    type: Number,
    default: 1
  }
});

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Backend Developer Interview Questions'
  },
  description: {
    type: String,
    required: true,
    default: 'Comprehensive course covering backend development interview questions and answers'
  },
  price: {
    type: Number,
    required: true,
    default: 5
  },
  currency: {
    type: String,
    default: 'USD'
  },
  sections: [sectionSchema],
  totalQuestions: {
    type: Number,
    default: 0
  },
  totalFreeQuestions: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate totals before saving
courseSchema.pre('save', function(next) {
  this.totalQuestions = this.sections.reduce((total, section) => total + section.questions.length, 0);
  this.totalFreeQuestions = this.sections.reduce((total, section) => total + section.freeQuestionsCount, 0);
  next();
});

module.exports = mongoose.model('Course', courseSchema);