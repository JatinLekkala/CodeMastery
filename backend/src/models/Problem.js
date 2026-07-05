const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    statement: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      required: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    timeLimit: {
      type: Number,
      default: 5000, // in milliseconds
    },
    memoryLimit: {
      type: Number,
      default: 256, // in Megabytes
    },
    sampleInput: {
      type: String,
      default: '',
    },
    sampleOutput: {
      type: String,
      default: '',
    },
    constraints: {
      type: String,
      default: '',
    },
    solutionsCount: {
      type: Number,
      default: 0,
    },
    attemptsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Problem', ProblemSchema);
