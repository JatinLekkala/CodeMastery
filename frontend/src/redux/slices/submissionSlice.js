import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async Thunks
export const submitSolution = createAsyncThunk(
  'submissions/submitSolution',
  async (solutionData, thunkAPI) => {
    try {
      const res = await api.post('/submissions', solutionData);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to submit solution');
    }
  }
);

export const runSolution = createAsyncThunk(
  'submissions/runSolution',
  async (solutionData, thunkAPI) => {
    try {
      const res = await api.post('/submissions/run', solutionData);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to run solution');
    }
  }
);

export const fetchSubmissions = createAsyncThunk(
  'submissions/fetchSubmissions',
  async (filters = {}, thunkAPI) => {
    try {
      const { problemId, userId, page = 1, limit = 10 } = filters;
      const params = {};
      if (problemId) params.problemId = problemId;
      if (userId) params.userId = userId;
      params.page = page;
      params.limit = limit;

      const res = await api.get('/submissions', { params });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to fetch submissions');
    }
  }
);

export const fetchSubmissionById = createAsyncThunk(
  'submissions/fetchSubmissionById',
  async (submissionId, thunkAPI) => {
    try {
      const res = await api.get(`/submissions/${submissionId}`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to fetch submission details');
    }
  }
);

const initialState = {
  submissions: [],
  currentSubmission: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalSubmissions: 0,
  },
  submitting: false,
  loading: false,
  error: null,
};

const submissionSlice = createSlice({
  name: 'submissions',
  initialState,
  reducers: {
    clearCurrentSubmission(state) {
      state.currentSubmission = null;
    },
    updateSubmissionVerdict(state, action) {
      const { submissionId, verdict, testCasesPassedCount, executionTime, memoryUsed, isRunOnly, runOutputs } = action.payload;
      
      // Update in currentSubmission if it matches
      if (state.currentSubmission && state.currentSubmission._id === submissionId) {
        state.currentSubmission.verdict = verdict;
        state.currentSubmission.testCasesPassedCount = testCasesPassedCount;
        state.currentSubmission.executionTime = executionTime;
        state.currentSubmission.memoryUsed = memoryUsed;
        state.currentSubmission.isRunOnly = isRunOnly;
        state.currentSubmission.runOutputs = runOutputs;
        state.submitting = false;
      }
      
      // Update in submissions list if present (only if it is a standard final submission)
      if (!isRunOnly) {
        const submission = state.submissions.find(s => s._id === submissionId);
        if (submission) {
          submission.verdict = verdict;
          submission.testCasesPassedCount = testCasesPassedCount;
          submission.executionTime = executionTime;
          submission.memoryUsed = memoryUsed;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Submit Solution
      .addCase(submitSolution.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitSolution.fulfilled, (state, action) => {
        state.currentSubmission = action.payload;
        // Prepend to submissions list
        state.submissions = [action.payload, ...state.submissions];
      })
      .addCase(submitSolution.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      // Run Solution
      .addCase(runSolution.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(runSolution.fulfilled, (state, action) => {
        state.currentSubmission = action.payload;
        state.submitting = false;
      })
      .addCase(runSolution.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload;
      })
      // Fetch Submissions List
      .addCase(fetchSubmissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissions.fulfilled, (state, action) => {
        state.submissions = action.payload.submissions;
        state.pagination.currentPage = action.payload.currentPage;
        state.pagination.totalPages = action.payload.totalPages;
        state.pagination.totalSubmissions = action.payload.totalSubmissions;
        state.loading = false;
      })
      .addCase(fetchSubmissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Submission by ID
      .addCase(fetchSubmissionById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubmissionById.fulfilled, (state, action) => {
        state.currentSubmission = action.payload;
        state.loading = false;
      })
      .addCase(fetchSubmissionById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentSubmission, updateSubmissionVerdict } = submissionSlice.actions;
export default submissionSlice.reducer;
