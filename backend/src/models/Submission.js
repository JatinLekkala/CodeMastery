const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: false,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      enum: ['C++', 'Java', 'Python'],
      required: true,
    },
    verdict: {
      type: String,
      enum: ['Pending', 'Accepted', 'Wrong Answer', 'TLE', 'Runtime Error', 'Compilation Error'],
      default: 'Pending',
    },
    executionTime: {
      type: Number,
      default: 0, // in milliseconds
    },
    memoryUsed: {
      type: Number,
      default: 0, // in Megabytes
    },
    testCasesPassedCount: {
      type: Number,
      default: 0,
    },
    isRunOnly: {
      type: Boolean,
      default: false,
    },
    customInput: {
      type: String,
      default: null,
    },
    runOutputs: [
      {
        input: { type: String },
        expectedOutput: { type: String },
        userOutput: { type: String },
        verdict: { type: String },
        error: { type: String },
      }
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Submission', SubmissionSchema);
