require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Problem = require('./models/Problem');
const TestCase = require('./models/TestCase');
const Submission = require('./models/Submission');

// Solvers to calculate correct expected output for programmatically generated test cases
const solveTwoSum = (nums, target) => {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return `${map.get(complement)} ${i}`;
    }
    map.set(nums[i], i);
  }
  return '';
};

const solvePalindrome = (s) => {
  const cleaned = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const reversed = cleaned.split('').reverse().join('');
  return cleaned === reversed ? 'true' : 'false';
};

const solveFib = (n) => {
  if (n === 0) return '0';
  if (n === 1) return '1';
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    let temp = a + b;
    a = b;
    b = temp;
  }
  return b.toString();
};

const solveBinarySearch = (nums, target) => {
  let l = 0, r = nums.length - 1;
  while (l <= r) {
    const mid = Math.floor((l + r) / 2);
    if (nums[mid] === target) return mid.toString();
    if (nums[mid] < target) l = mid + 1;
    else r = mid - 1;
  }
  return '-1';
};

const solveLCS = (text1, text2) => {
  const m = text1.length, n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  return dp[m][n].toString();
};

const solveMergeK = (lists) => {
  const flat = [];
  for (const list of lists) {
    flat.push(...list);
  }
  flat.sort((a, b) => a - b);
  return flat.join(' ');
};

const solveNQueens = (n) => {
  let count = 0;
  const cols = new Set();
  const diag1 = new Set();
  const diag2 = new Set();
  const backtrack = (row) => {
    if (row === n) {
      count++;
      return;
    }
    for (let col = 0; col < n; col++) {
      if (cols.has(col) || diag1.has(row - col) || diag2.has(row + col)) continue;
      cols.add(col);
      diag1.add(row - col);
      diag2.add(row + col);
      backtrack(row + 1);
      cols.delete(col);
      diag1.delete(row - col);
      diag2.delete(row + col);
    }
  };
  backtrack(0);
  return count.toString();
};

const solveGraphColoring = (V, edges, M) => {
  const adj = Array.from({ length: V }, () => []);
  for (const [u, v] of edges) {
    adj[u].push(v);
    adj[v].push(u);
  }
  const colors = Array(V).fill(0);
  const isSafe = (v, c) => {
    for (const neighbor of adj[v]) {
      if (colors[neighbor] === c) return false;
    }
    return true;
  };
  const solve = (v) => {
    if (v === V) return true;
    for (let c = 1; c <= M; c++) {
      if (isSafe(v, c)) {
        colors[v] = c;
        if (solve(v + 1)) return true;
        colors[v] = 0;
      }
    }
    return false;
  };
  return solve(0) ? '1' : '0';
};

const solveWordBreak = (s, wordDict) => {
  const dict = new Set(wordDict);
  const dp = Array(s.length + 1).fill(false);
  dp[0] = true;
  for (let i = 1; i <= s.length; i++) {
    for (let j = 0; j < i; j++) {
      if (dp[j] && dict.has(s.substring(j, i))) {
        dp[i] = true;
        break;
      }
    }
  }
  return dp[s.length] ? 'true' : 'false';
};

const solveSortArray = (nums) => {
  const sorted = [...nums].sort((a, b) => a - b);
  return sorted.join(' ');
};

const seedData = async () => {
  try {
    // Connect to Database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/codemastery');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Problem.deleteMany({});
    await TestCase.deleteMany({});
    await Submission.deleteMany({});
    console.log('Cleared existing database collections.');

    // 1. Seed Users
    const users = [
      {
        email: 'admin@codemastery.com',
        password: 'password123',
        fullName: 'Admin Codemaster',
        dateOfBirth: new Date('1990-01-01'),
        role: 'Admin',
        rating: 1500,
        totalProblemsAttempted: 5,
        totalProblemsSolved: 5,
      },
      {
        email: 'alice@codemastery.com',
        password: 'password123',
        fullName: 'Alice Smith',
        dateOfBirth: new Date('1995-05-12'),
        role: 'User',
        rating: 1320,
        totalProblemsAttempted: 6,
        totalProblemsSolved: 4,
      },
      {
        email: 'bob@codemastery.com',
        password: 'password123',
        fullName: 'Bob Johnson',
        dateOfBirth: new Date('1998-08-22'),
        role: 'User',
        rating: 1240,
        totalProblemsAttempted: 4,
        totalProblemsSolved: 2,
      },
      {
        email: 'charlie@codemastery.com',
        password: 'password123',
        fullName: 'Charlie Brown',
        dateOfBirth: new Date('2000-11-30'),
        role: 'User',
        rating: 1210,
        totalProblemsAttempted: 3,
        totalProblemsSolved: 1,
      },
      {
        email: 'dave@codemastery.com',
        password: 'password123',
        fullName: 'Dave Miller',
        dateOfBirth: new Date('1997-03-15'),
        role: 'User',
        rating: 1200,
        totalProblemsAttempted: 0,
        totalProblemsSolved: 0,
      }
    ];

    const seededUsers = [];
    for (const u of users) {
      const user = new User(u);
      await user.save();
      seededUsers.push(user);
    }
    console.log(`Seeded ${seededUsers.length} users successfully.`);

    // 2. Base Problems data definitions
    const baseProblems = [
      {
        title: 'Two Sum',
        statement: `Given an array of integers 'nums' and an integer 'target', return indices of the two numbers such that they add up to 'target'.
You may assume that each input would have exactly one solution, and you may not use the same element twice.
You can return the answer in any order.

Input Format:
- First line: N (size of array)
- Second line: N space-separated integers representing the array elements.
- Third line: Target integer.

Output Format:
- Print two space-separated indices.`,
        difficulty: 'Easy',
        tags: ['Arrays', 'Hash-Table'],
        timeLimit: 3000,
        memoryLimit: 256,
        sampleInput: `4\n2 7 11 15\n9`,
        sampleOutput: `0 1`,
        constraints: `2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9`,
        attemptsCount: 15,
        solutionsCount: 12,
        generateTestCases: () => {
          const tcs = [
            { input: `4\n2 7 11 15\n9`, expectedOutput: `0 1`, isHidden: false },
            { input: `3\n3 2 4\n6`, expectedOutput: `1 2`, isHidden: false },
            { input: `2\n3 3\n6`, expectedOutput: `0 1`, isHidden: false },
          ];
          // Programmatic Hidden Cases (22 cases total = 25 cases)
          // 1. Edge Case: Negatives
          tcs.push({ input: `4\n-3 4 3 90\n0`, expectedOutput: `0 2`, isHidden: true });
          tcs.push({ input: `3\n-10 -20 30\n10`, expectedOutput: `1 2`, isHidden: true });
          // 2. Large numbers
          tcs.push({ input: `2\n1000000000 2000000000\n3000000000`, expectedOutput: `0 1`, isHidden: true });
          // 3. Various random cases
          for (let i = 0; i < 19; i++) {
            const size = 5 + i;
            const arr = Array.from({ length: size }, (_, index) => index * 2 + 1); // odd numbers: 1, 3, 5, ...
            const idx1 = Math.floor(Math.random() * (size / 2));
            const idx2 = Math.floor(size / 2) + Math.floor(Math.random() * (size / 2));
            const target = arr[idx1] + arr[idx2];
            tcs.push({
              input: `${size}\n${arr.join(' ')}\n${target}`,
              expectedOutput: `${idx1} ${idx2}`,
              isHidden: true
            });
          }
          return tcs;
        }
      },
      {
        title: 'Palindrome Check',
        statement: `Determine whether a given string S is a palindrome (reads the same backwards as forwards).

Input Format:
- A single line containing string S.

Output Format:
- Print 'true' if the string is a palindrome, otherwise print 'false'.`,
        difficulty: 'Easy',
        tags: ['Strings', 'Two-Pointers'],
        timeLimit: 2000,
        memoryLimit: 256,
        sampleInput: `racecar`,
        sampleOutput: `true`,
        constraints: `1 <= S.length <= 10^5\nString consists of lowercase English characters.`,
        attemptsCount: 12,
        solutionsCount: 10,
        generateTestCases: () => {
          const tcs = [
            { input: `racecar`, expectedOutput: `true`, isHidden: false },
            { input: `hello`, expectedOutput: `false`, isHidden: false },
            { input: `a`, expectedOutput: `true`, isHidden: false },
          ];
          // Programmatic (22 hidden cases)
          const words = [
            'aba', 'abcba', 'abccba', 'noon', 'civic', 'radar', 'level', 'rotor', 'kayak', 'reviver',
            'xyz', 'coding', 'docker', 'redis', 'react', 'express', 'node', 'mongodb', 'mismatch', 'palindrom',
            'aa', 'ab', 'ba', 'bb', 'abcde', 'edcba', 'aaaaaaa', 'aabaa', 'abacaba', 'abaaba'
          ];
          for (let i = 0; i < 22; i++) {
            const w = words[i % words.length];
            tcs.push({
              input: w,
              expectedOutput: solvePalindrome(w),
              isHidden: true
            });
          }
          return tcs;
        }
      },
      {
        title: 'Fibonacci Number',
        statement: `Calculate the N-th Fibonacci number.
The Fibonacci sequence starts with F(0) = 0 and F(1) = 1.
Each subsequent term is the sum of the preceding two terms: F(N) = F(N-1) + F(N-2).

Input Format:
- A single line containing an integer N.

Output Format:
- Print the N-th Fibonacci number.`,
        difficulty: 'Medium',
        tags: ['DP', 'Math'],
        timeLimit: 2000,
        memoryLimit: 256,
        sampleInput: `6`,
        sampleOutput: `8`,
        constraints: `0 <= N <= 30`,
        attemptsCount: 9,
        solutionsCount: 7,
        generateTestCases: () => {
          const tcs = [
            { input: `6`, expectedOutput: `8`, isHidden: false },
            { input: `0`, expectedOutput: `0`, isHidden: false },
            { input: `1`, expectedOutput: `1`, isHidden: false },
          ];
          // Generates inputs from 2 to 25
          for (let n = 2; n <= 25; n++) {
            tcs.push({
              input: n.toString(),
              expectedOutput: solveFib(n),
              isHidden: true
            });
          }
          return tcs;
        }
      },
      {
        title: 'Binary Search',
        statement: `Given a sorted array of N integers and a target value, return the index of the target if it exists in the array. If it does not exist, return -1.
You must write an algorithm with O(log N) runtime complexity.

Input Format:
- First line: N (size of array) and Target, separated by space.
- Second line: N sorted space-separated integers.

Output Format:
- Print the 0-based index of the Target if found, otherwise print -1.`,
        difficulty: 'Medium',
        tags: ['Searching', 'Arrays'],
        timeLimit: 2000,
        memoryLimit: 256,
        sampleInput: `5 7\n1 3 5 7 9`,
        sampleOutput: `3`,
        constraints: `1 <= N <= 10^5\n-10^9 <= target, array[i] <= 10^9`,
        attemptsCount: 8,
        solutionsCount: 6,
        generateTestCases: () => {
          const tcs = [
            { input: `5 7\n1 3 5 7 9`, expectedOutput: `3`, isHidden: false },
            { input: `5 2\n1 3 5 7 9`, expectedOutput: `-1`, isHidden: false },
            { input: `1 5\n5`, expectedOutput: `0`, isHidden: false },
          ];
          // 22 Hidden Cases
          // Target at bounds, negatives, search misses
          tcs.push({ input: `6 2\n2 4 6 8 10 12`, expectedOutput: `0`, isHidden: true }); // first
          tcs.push({ input: `6 12\n2 4 6 8 10 12`, expectedOutput: `5`, isHidden: true }); // last
          tcs.push({ input: `5 -5\n-10 -5 0 5 10`, expectedOutput: `1`, isHidden: true }); // negative target
          tcs.push({ input: `5 15\n-10 -5 0 5 10`, expectedOutput: `-1`, isHidden: true }); // missing target (greater)
          tcs.push({ input: `5 -15\n-10 -5 0 5 10`, expectedOutput: `-1`, isHidden: true }); // missing target (lesser)

          for (let i = 0; i < 17; i++) {
            const size = 10 + i;
            const arr = Array.from({ length: size }, (_, index) => index * 3 - 20); // sorted arithmetic sequence
            const target = arr[Math.floor(Math.random() * size)];
            tcs.push({
              input: `${size} ${target}\n${arr.join(' ')}`,
              expectedOutput: solveBinarySearch(arr, target),
              isHidden: true
            });
          }
          return tcs;
        }
      },
      {
        title: 'Longest Common Subsequence',
        statement: `Given two strings text1 and text2, return the length of their longest common subsequence.
A subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.

Input Format:
- First line: string text1.
- Second line: string text2.

Output Format:
- Print the length of the longest common subsequence.`,
        difficulty: 'Hard',
        tags: ['DP', 'Strings'],
        timeLimit: 4000,
        memoryLimit: 256,
        sampleInput: `abcde\nace`,
        sampleOutput: `3`,
        constraints: `1 <= text1.length, text2.length <= 1000\nStrings consist of lowercase English characters only.`,
        attemptsCount: 5,
        solutionsCount: 2,
        generateTestCases: () => {
          const tcs = [
            { input: `abcde\nace`, expectedOutput: `3`, isHidden: false },
            { input: `abc\nabc`, expectedOutput: `3`, isHidden: false },
            { input: `abc\ndef`, expectedOutput: `0`, isHidden: false },
          ];
          const testPairs = [
            ['abc', 'def'], ['aggtab', 'gxtxayb'], ['aaaa', 'aa'], ['a', 'b'], ['abcdefg', 'abdeg'],
            ['apple', 'peach'], ['redis', 'docker'], ['mongodb', 'mongoose'], ['express', 'node'],
            ['socketio', 'websockets'], ['competitive', 'programming'], ['monaco', 'editor'],
            ['react', 'redux'], ['sandbox', 'isolated'], ['compile', 'run'], ['verdict', 'accepted'],
            ['longest', 'common'], ['subsequence', 'substring'], ['dynamic', 'programming'],
            ['data', 'structures'], ['algorithms', 'sorting'], ['binary', 'search']
          ];
          for (let i = 0; i < 22; i++) {
            const [s1, s2] = testPairs[i];
            tcs.push({
              input: `${s1}\n${s2}`,
              expectedOutput: solveLCS(s1, s2),
              isHidden: true
            });
          }
          return tcs;
        }
      },
      {
        title: 'Merge K Sorted Lists',
        statement: `Merge K sorted linked lists and return it as one sorted list.

Input Format:
- First line: K (number of sorted lists).
- Next K lines: Each line starts with list size M, followed by M space-separated sorted integers.

Output Format:
- Print the merged sorted list of integers separated by spaces.`,
        difficulty: 'Hard',
        tags: ['Heaps', 'Divide-and-Conquer'],
        timeLimit: 5000,
        memoryLimit: 256,
        sampleInput: `3\n3 1 4 5\n3 1 3 4\n2 2 6`,
        sampleOutput: `1 1 2 3 4 4 5 6`,
        constraints: `0 <= K <= 10^4\n0 <= M <= 500`,
        attemptsCount: 4,
        solutionsCount: 2,
        generateTestCases: () => {
          const tcs = [
            { input: `3\n3 1 4 5\n3 1 3 4\n2 2 6`, expectedOutput: `1 1 2 3 4 4 5 6`, isHidden: false },
            { input: `1\n2 1 3`, expectedOutput: `1 3`, isHidden: false },
            { input: `2\n2 2 4\n2 1 3`, expectedOutput: `1 2 3 4`, isHidden: false },
          ];
          // Generate 22 hidden cases
          for (let i = 0; i < 22; i++) {
            const K = 2 + (i % 5);
            const lists = [];
            let inputStr = `${K}\n`;
            for (let k = 0; k < K; k++) {
              const size = 1 + Math.floor(Math.random() * 4);
              const list = Array.from({ length: size }, () => Math.floor(Math.random() * 50) - 25);
              list.sort((a, b) => a - b);
              lists.push(list);
              inputStr += `${size} ${list.join(' ')}\n`;
            }
            tcs.push({
              input: inputStr.trim(),
              expectedOutput: solveMergeK(lists),
              isHidden: true
            });
          }
          return tcs;
        }
      },
      {
        title: 'N-Queens',
        statement: `The n-queens puzzle is the problem of placing n queens on an n x n chessboard such that no two queens attack each other.
Given an integer n, return the number of distinct solutions.

Input Format:
- A single line containing integer n.

Output Format:
- Print the count of distinct placements.`,
        difficulty: 'Hard',
        tags: ['Backtracking'],
        timeLimit: 5000,
        memoryLimit: 256,
        sampleInput: `4`,
        sampleOutput: `2`,
        constraints: `1 <= n <= 9`,
        attemptsCount: 3,
        solutionsCount: 1,
        generateTestCases: () => {
          const tcs = [
            { input: `4`, expectedOutput: `2`, isHidden: false },
            { input: `1`, expectedOutput: `1`, isHidden: false },
            { input: `2`, expectedOutput: `0`, isHidden: false },
          ];
          // We generate cases for N=3, 5, 6, 7, 8, 9 multiple times to hit 25 cases
          const ns = [3, 5, 6, 7, 8, 9, 4, 5, 6, 7, 8, 9, 3, 4, 5, 6, 7, 8, 9, 5, 6, 7];
          for (let i = 0; i < 22; i++) {
            const nVal = ns[i];
            tcs.push({
              input: nVal.toString(),
              expectedOutput: solveNQueens(nVal),
              isHidden: true
            });
          }
          return tcs;
        }
      },
      {
        title: 'Graph Coloring',
        statement: `Given an undirected graph and a number of colors M, determine if the graph can be colored with at most M colors such that no two adjacent vertices are colored with the same color.

Input Format:
- First line: V (number of vertices), E (number of edges), and M (max colors).
- Next E lines: two space-separated integers representing vertex indices of an edge.

Output Format:
- Print 1 if colorable, print 0 otherwise.`,
        difficulty: 'Hard',
        tags: ['Graphs', 'Backtracking'],
        timeLimit: 4000,
        memoryLimit: 256,
        sampleInput: `4 5 3\n0 1\n1 2\n2 3\n3 0\n0 2`,
        sampleOutput: `1`,
        constraints: `1 <= V <= 20\n0 <= E <= V*(V-1)/2`,
        attemptsCount: 2,
        solutionsCount: 0,
        generateTestCases: () => {
          const tcs = [
            { input: `4 5 3\n0 1\n1 2\n2 3\n3 0\n0 2`, expectedOutput: `1`, isHidden: false },
            { input: `3 3 2\n0 1\n1 2\n2 0`, expectedOutput: `0`, isHidden: false },
            { input: `4 6 3\n0 1\n1 2\n2 3\n3 0\n0 2\n1 3`, expectedOutput: `0`, isHidden: false },
          ];
          // Programmatic hidden cases
          for (let i = 0; i < 22; i++) {
            // Triangle: 3 vertices, cyclic, M=3 (colorable), M=2 (uncolorable)
            const isEven = i % 2 === 0;
            const M = isEven ? 2 : 1;
            const edges = [[0, 1], [1, 2]];
            let inputStr = `3 2 ${M}\n0 1\n1 2`;
            tcs.push({
              input: inputStr,
              expectedOutput: solveGraphColoring(3, edges, M),
              isHidden: true
            });
          }
          return tcs;
        }
      },
      {
        title: 'Word Break',
        statement: `Given a string s and a dictionary of strings wordDict, return true if s can be segmented into a space-separated sequence of one or more dictionary words.
Note that the same word in the dictionary may be reused multiple times in the segmentation.

Input Format:
- First line: String s.
- Second line: W (number of words in dictionary).
- Next W lines: words in the dictionary.

Output Format:
- Print 'true' if s can be segmented, otherwise print 'false'.`,
        difficulty: 'Medium',
        tags: ['DP', 'Strings'],
        timeLimit: 3000,
        memoryLimit: 256,
        sampleInput: `leetcode\n2\nleet\ncode`,
        sampleOutput: `true`,
        constraints: `1 <= s.length <= 300\n1 <= wordDict.length <= 1000\nWords are lowercase English letters.`,
        attemptsCount: 6,
        solutionsCount: 4,
        generateTestCases: () => {
          const tcs = [
            { input: `leetcode\n2\nleet\ncode`, expectedOutput: `true`, isHidden: false },
            { input: `catsandog\n5\ncats\ndog\nsand\nand\ncat`, expectedOutput: `false`, isHidden: false },
            { input: `applepenapple\n2\napple\npen`, expectedOutput: `true`, isHidden: false },
          ];
          // 22 hidden cases
          const words = ['cats', 'dog', 'sand', 'and', 'cat'];
          for (let i = 0; i < 22; i++) {
            const isMatch = i % 3 !== 0;
            const s = isMatch ? 'catsanddog' : 'catsandog';
            const dict = isMatch ? ['cats', 'sand', 'dog'] : ['cats', 'dog', 'sand', 'and'];
            tcs.push({
              input: `${s}\n${dict.length}\n${dict.join('\n')}`,
              expectedOutput: solveWordBreak(s, dict),
              isHidden: true
            });
          }
          return tcs;
        }
      },
      {
        title: 'Sort Array',
        statement: `Sort an array of N integers in ascending order.
Implement an efficient O(N log N) sorting algorithm (e.g., QuickSort or MergeSort).

Input Format:
- First line: N (size of array).
- Second line: N space-separated integers.

Output Format:
- Print sorted array elements separated by spaces.`,
        difficulty: 'Easy',
        tags: ['Sorting', 'Arrays'],
        timeLimit: 2000,
        memoryLimit: 256,
        sampleInput: `5\n5 2 3 1 4`,
        sampleOutput: `1 2 3 4 5`,
        constraints: `1 <= N <= 50000\n-5*10^4 <= array[i] <= 5*10^4`,
        attemptsCount: 20,
        solutionsCount: 18,
        generateTestCases: () => {
          const tcs = [
            { input: `5\n5 2 3 1 4`, expectedOutput: `1 2 3 4 5`, isHidden: false },
            { input: `3\n1 1 1`, expectedOutput: `1 1 1`, isHidden: false },
            { input: `6\n-2 3 -5 8 1 0`, expectedOutput: `-5 -2 0 1 3 8`, isHidden: false },
          ];
          // Generate 22 hidden test cases
          for (let i = 0; i < 22; i++) {
            const size = 5 + i;
            const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 200) - 100);
            tcs.push({
              input: `${size}\n${arr.join(' ')}`,
              expectedOutput: solveSortArray(arr),
              isHidden: true
            });
          }
          return tcs;
        }
      }
    ];

    for (const p of baseProblems) {
      const problem = new Problem({
        title: p.title,
        statement: p.statement,
        difficulty: p.difficulty,
        tags: p.tags,
        timeLimit: p.timeLimit,
        memoryLimit: p.memoryLimit,
        sampleInput: p.sampleInput,
        sampleOutput: p.sampleOutput,
        constraints: p.constraints,
        attemptsCount: p.attemptsCount,
        solutionsCount: p.solutionsCount,
      });

      const savedProblem = await problem.save();

      // Retrieve generated 25 test cases for the problem
      const testcases = p.generateTestCases();
      const testCasesData = testcases.map((tc) => ({
        problemId: savedProblem._id,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
      }));

      await TestCase.insertMany(testCasesData);
      console.log(`Seeded problem "${p.title}" with ${testCasesData.length} testcases.`);
    }

    console.log(`Seeded all problems and testcases successfully.`);

    // 3. Seed mock submissions
    const dbProblems = await Problem.find({});
    const dbUsers = await User.find({ role: 'User' });

    const submissionsData = [
      {
        userId: dbUsers[0]._id, // alice
        problemId: dbProblems[0]._id, // Two Sum
        code: `// Alice solution`,
        language: 'C++',
        verdict: 'Accepted',
        executionTime: 45,
        memoryUsed: 6,
        testCasesPassedCount: 25,
        isRunOnly: false,
        createdAt: new Date(Date.now() - 3600000 * 2)
      },
      {
        userId: dbUsers[0]._id, // alice
        problemId: dbProblems[1]._id, // Palindrome
        code: `# Alice python solution`,
        language: 'Python',
        verdict: 'Accepted',
        executionTime: 72,
        memoryUsed: 14,
        testCasesPassedCount: 25,
        isRunOnly: false,
        createdAt: new Date(Date.now() - 3600000 * 1.5)
      },
      {
        userId: dbUsers[0]._id, // alice
        problemId: dbProblems[2]._id, // Fibonacci
        code: `// Alice Java solution`,
        language: 'Java',
        verdict: 'Wrong Answer',
        executionTime: 120,
        memoryUsed: 42,
        testCasesPassedCount: 15,
        isRunOnly: false,
        createdAt: new Date(Date.now() - 3600000)
      },
      {
        userId: dbUsers[0]._id, // alice
        problemId: dbProblems[2]._id, // Fibonacci
        code: `// Alice Java solution (fixed)`,
        language: 'Java',
        verdict: 'Accepted',
        executionTime: 110,
        memoryUsed: 43,
        testCasesPassedCount: 25,
        isRunOnly: false,
        createdAt: new Date(Date.now() - 1800000)
      },
      {
        userId: dbUsers[1]._id, // bob
        problemId: dbProblems[0]._id, // Two Sum
        code: `# Bob Python`,
        language: 'Python',
        verdict: 'Accepted',
        executionTime: 85,
        memoryUsed: 15,
        testCasesPassedCount: 25,
        isRunOnly: false,
        createdAt: new Date(Date.now() - 3600000 * 3)
      },
      {
        userId: dbUsers[2]._id, // charlie
        problemId: dbProblems[1]._id, // Palindrome
        code: `// Charlie solution`,
        language: 'C++',
        verdict: 'Accepted',
        executionTime: 32,
        memoryUsed: 5,
        testCasesPassedCount: 25,
        isRunOnly: false,
        createdAt: new Date(Date.now() - 3600000 * 4)
      }
    ];

    await Submission.insertMany(submissionsData);
    console.log(`Seeded ${submissionsData.length} mock submissions successfully.`);

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Database seeding error:', err);
    process.exit(1);
  }
};

seedData();
