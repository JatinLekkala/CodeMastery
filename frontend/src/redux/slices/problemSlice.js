import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

// Async Thunks
export const fetchProblems = createAsyncThunk(
  'problems/fetchProblems',
  async (filters = {}, thunkAPI) => {
    try {
      const { difficulty, tags, search, page = 1, limit = 10 } = filters;
      const params = {};
      if (difficulty) params.difficulty = difficulty;
      if (tags) params.tags = tags;
      if (search) params.search = search;
      params.page = page;
      params.limit = limit;

      const res = await api.get('/problems', { params });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to fetch problems');
    }
  }
);

export const fetchProblemById = createAsyncThunk(
  'problems/fetchProblemById',
  async (problemId, thunkAPI) => {
    try {
      const res = await api.get(`/problems/${problemId}`);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to fetch problem details');
    }
  }
);

export const createProblem = createAsyncThunk(
  'problems/createProblem',
  async (problemData, thunkAPI) => {
    try {
      const res = await api.post('/problems', problemData);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || 'Failed to create problem');
    }
  }
);

const initialState = {
  problems: [],
  currentProblem: null,
  filters: {
    difficulty: '',
    tags: '',
    search: '',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProblems: 0,
  },
  loading: false,
  error: null,
};

const problemSlice = createSlice({
  name: 'problems',
  initialState,
  reducers: {
    setFilters(state, action) {
      state.filters = { ...state.filters, ...action.payload };
    },
    resetFilters(state) {
      state.filters = { difficulty: '', tags: '', search: '' };
    },
    clearCurrentProblem(state) {
      state.currentProblem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Problems
      .addCase(fetchProblems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProblems.fulfilled, (state, action) => {
        state.problems = action.payload.problems;
        state.pagination.currentPage = action.payload.currentPage;
        state.pagination.totalPages = action.payload.totalPages;
        state.pagination.totalProblems = action.payload.totalProblems;
        state.loading = false;
      })
      .addCase(fetchProblems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Problem by ID
      .addCase(fetchProblemById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProblemById.fulfilled, (state, action) => {
        state.currentProblem = action.payload;
        state.loading = false;
      })
      .addCase(fetchProblemById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Problem
      .addCase(createProblem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProblem.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createProblem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, resetFilters, clearCurrentProblem } = problemSlice.actions;
export default problemSlice.reducer;
