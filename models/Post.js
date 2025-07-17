const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['announcement', 'tutorial', 'news', 'discussion'],
    default: 'discussion'
  },
  tags: [{
    type: String,
    trim: true
  }],
  featuredImage: {
    type: String
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  comments: [commentSchema],
  viewCount: {
    type: Number,
    default: 0
  },
  relatedQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course.sections.questions'
  }]
}, {
  timestamps: true
});

// Create slug from title before saving
postSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Virtual for post URL
postSchema.virtual('url').get(function() {
  return `/blog/${this.slug}`;
});

module.exports = mongoose.model('Post', postSchema);