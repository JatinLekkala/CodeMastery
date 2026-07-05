import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import problemReducer from './slices/problemSlice';
import submissionReducer from './slices/submissionSlice';
import leaderboardReducer from './slices/leaderboardSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    problems: problemReducer,
    submissions: submissionReducer,
    leaderboard: leaderboardReducer,
  },
});

export default store;
